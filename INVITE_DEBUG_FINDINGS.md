# Invite System Debug Findings

## Overview
The invite system is designed to award +250 MSP to the **inviter** when a new user completes OAuth via their invite link. Despite the logic being in place, MSP is not reflecting on the profile page.

---

## Flow Summary

1. **Invite Link Hit** (`/invite/[username]`)
   - Looks up inviter by `username` in `participants` or `connected_accounts`
   - Sets HTTP-only cookie `hive_invite_ref` with `{ inviterUserId, inviterUsername }`
   - Redirects to `/profile?invite=tracked`

2. **OAuth Callback** (`/api/auth/x/callback`)
   - Reads `hive_invite_ref` cookie
   - Calls `redeemInviteBonus()` with inviter + invitee info
   - If successful, redirects with `?invite=bonus`
   - Clears the invite cookie

3. **Redeem Invite Bonus** (`lib/supabase/invites.ts`)
   - Checks: not self-referral, not already redeemed
   - Inserts row into `invite_redemptions`
   - Calls `awardInviteCampaignBonus()` → `incrementParticipantStats()`

4. **Profile Stats** (`/api/user`)
   - Fetches `getInviteMspBreakdown(user.id)` from `invite_redemptions`
   - Adds `inviteMsp.total` to `totalMsp`
   - Returns `inviteBonusMsp` in stats

---

## Potential Failure Points

### 1. ❌ Inviter Not Found in Database
**Location:** `/api/invite/[username]/route.ts` lines 31-53

The invite route looks up the inviter by `username` in `participants` table first, then falls back to `connected_accounts`. 

**Problem:** If the inviter has never joined any campaign, they won't exist in `participants`. And if they haven't connected additional accounts, they won't be in `connected_accounts` either.

**Result:** `inviterUserId` is `null` → redirect to `/profile?invite=missing` → no cookie set.

**Fix Required:** The inviter lookup should also check the session user's X ID directly, or store users in a dedicated `users` table upon first login.

---

### 2. ❌ Insert Missing Required Fields
**Location:** `lib/supabase/participants.ts` lines 157-162

When `incrementParticipantStats` creates a new participant (for the invite rewards campaign), it only provides:
```ts
{
  campaign_id: campaignId,
  user_id: userId,
  msp: mspDelta,
  post_count: postCountDelta > 0 ? postCountDelta : 0,
}
```

**Problem:** The `participants` table requires `username` and `display_name` as NOT NULL:
```sql
username TEXT NOT NULL,
display_name TEXT NOT NULL,
```

**Result:** Insert fails silently (logged as "Failed to create participant for increment").

**Fix Required:** `incrementParticipantStats` needs to accept and pass `username` and `display_name`, or the insert in `ensureInviteCampaignParticipant` should be used exclusively for invite bonuses (which it already does, but `incrementParticipantStats` is called afterward and may fail if the participant doesn't exist).

---

### 3. ⚠️ `ensureInviteCampaignParticipant` Creates Participant, Then `incrementParticipantStats` Updates
**Location:** `lib/supabase/invites.ts` lines 139-198

The flow is:
1. `ensureInviteCampaignParticipant()` creates participant with `msp: 0`
2. `incrementParticipantStats()` updates MSP to +250

This should work IF step 1 succeeds. But if step 1 fails (e.g., missing profile data), step 2 will also fail because the participant doesn't exist.

---

### 4. ⚠️ Profile Source Lookup Returns Nothing
**Location:** `lib/supabase/invites.ts` lines 157-163

```ts
const { data: profileSource } = await supabase
  .from('participants')
  .select('username, display_name, profile_image_url')
  .eq('user_id', userId)
  .order('joined_at', { ascending: false })
  .limit(1)
  .maybeSingle<...>()
```

**Problem:** If the inviter has never joined any campaign, `profileSource` is `null`. The fallback uses `fallbackUsername ?? 'inviter'`, but `fallbackUsername` comes from the cookie which may also be null.

**Result:** Participant is created with `username: 'inviter'`, `display_name: 'inviter'`. This works but looks wrong in the UI.

---

### 5. ❌ Cookie Not Persisting Across Domains
**Location:** `/api/invite/[username]/route.ts` lines 62-70

Cookie settings:
```ts
{
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: INVITE_COOKIE_MAX_AGE,
}
```

**Problem:** If the OAuth redirect goes to a different domain than where the cookie was set (e.g., ngrok URL vs localhost), the cookie won't be sent.

**Verification:** Check that `X_REDIRECT_URI` in `.env.local` matches the ngrok URL being used.

---

### 6. ⚠️ `getInviteMspBreakdown` Queries by Inviter ID
**Location:** `lib/supabase/invites.ts` lines 83-88

```ts
const { data, error } = await supabase
  .from('invite_redemptions')
  .select('msp_awarded, created_at')
  .eq('inviter_user_id', inviterUserId)
```

This is correct—it sums MSP for the **inviter**. But `/api/user` calls it with `user.id` (the current logged-in user). So if User A invited User B:
- User A's profile shows the bonus (correct)
- User B's profile shows 0 invite bonus (correct—they didn't invite anyone)

---

## Verification Steps

### Step 1: Check if invite cookie is being set
1. Visit `/invite/pentaton_xc` in incognito
2. Open DevTools → Application → Cookies
3. Look for `hive_invite_ref` cookie
4. If missing, the inviter lookup failed

### Step 2: Check debug endpoint
After restarting the dev server, hit:
```
GET /api/debug/invite-redemptions
```

Response shows:
- `redemptions`: rows in `invite_redemptions` table
- `inviteParticipants`: participants in the Invite Rewards campaign
- `inviteRewardsCampaignId`: confirms env var is set

### Step 3: Check server logs
Look for these console messages during OAuth callback:
- `Failed to redeem invite bonus:` → redemption threw
- `Failed to check invite redemption:` → DB query failed
- `Failed to record invite redemption:` → insert failed
- `Failed to seed invite rewards participant:` → participant insert failed
- `Failed to increment invite rewards participant stats for` → MSP update failed

---

## Root Cause Hypothesis

**Most likely:** The inviter (`pentaton_xc`) doesn't exist in the `participants` table because they haven't joined any campaign yet. The invite link lookup fails, no cookie is set, and the OAuth callback has nothing to redeem.

**Second most likely:** The cookie is set but lost during the OAuth redirect because the domain changes (ngrok → twitter → ngrok callback).

---

## Recommended Fixes

### Fix 1: Store users on first login
Create a `users` table and insert a row when someone completes OAuth. Then the invite lookup can find any authenticated user, not just campaign participants.

### Fix 2: Use X user ID in invite links
Instead of `/invite/pentaton_xc`, use `/invite/1234567890` (X user ID). Store the inviter's X ID in the session/cookie when they log in, and use that for lookups.

### Fix 3: Auto-join inviter to Invite Rewards campaign on first login
When a user logs in, automatically create a participant record in the "Invite Rewards" campaign. This ensures the inviter always exists for lookups.

### Fix 4: Add logging to diagnose
Add `console.log` statements at each step of the invite flow to see exactly where it fails.

---

## Quick Diagnostic Commands

### Check if inviter exists in participants:
```sql
SELECT user_id, username FROM participants WHERE username ILIKE 'pentaton_xc';
```

### Check invite redemptions:
```sql
SELECT * FROM invite_redemptions ORDER BY created_at DESC;
```

### Check Invite Rewards campaign participants:
```sql
SELECT * FROM participants WHERE campaign_id = '00000000-0000-0000-0000-00000000cafe';
```

---

## Files Involved

| File | Purpose |
|------|---------|
| `app/api/invite/[username]/route.ts` | Sets invite cookie |
| `app/api/auth/x/callback/route.ts` | Redeems invite on OAuth |
| `lib/supabase/invites.ts` | Redemption logic + MSP breakdown |
| `lib/supabase/participants.ts` | Participant CRUD + MSP increment |
| `app/api/user/route.ts` | Aggregates stats including invite MSP |
| `app/profile/page.tsx` | Displays invite bonus tile |
| `.env.local` | `INVITE_REWARDS_CAMPAIGN_ID` |

---

## Status

- [x] Migrations applied (0012, 0013, 0014)
- [x] Env var set (`INVITE_REWARDS_CAMPAIGN_ID`)
- [x] Debug endpoint created (`/api/debug/invite-redemptions`)
- [ ] Verify inviter exists in DB
- [ ] Verify cookie is set on invite link visit
- [ ] Verify redemption runs on OAuth callback
- [ ] Verify MSP increment succeeds
