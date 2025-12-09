# HiveAI Operations Prompts & Runbooks

Central reference for the recurring “population” commands and creative prompt templates used to launch new narratives.

---

## 1. Wallet Sync → Google Sheets

**Purpose:** Push all wallet owners + ranks to the Google Sheet via the Apps Script webhook.

### Prerequisites
1. `GOOGLE_SHEETS_WEBHOOK_URL` set locally and in Vercel (current prod value: `https://script.google.com/macros/s/AKfycbw1oHYqLXqB7enHn0IpSpMUuLkYIod37tLia9Teo7CxecJQxVeovlp56tubERxT0H4k/exec`).
2. `CRON_SECRET` matches the value in Vercel/env.
3. Apps Script deployment authorized (run `testSetup()` once).

### Command (PowerShell)
```powershell
Invoke-RestMethod `
  -Method POST `
  -Uri "https://hiveai-six.vercel.app/api/wallets/sheets-sync" `
  -Headers @{ "x-cron-secret" = "8325110eb9414310831cdb7eab9626ec" }
```

### Notes
- Successful response should include `sheetsResponse.success = true`.
- Check Google Sheet tabs:
  - **Wallets**: refreshed rows.
  - **Sync Log**: timestamped entry per run.

---

## 2. Manual Wallet Export (JSON / CSV)

Useful when Sheets is down or you need raw data.

```powershell
# JSON (all campaigns)
Invoke-RestMethod `
  -Method GET `
  -Uri "https://hiveai-six.vercel.app/api/wallets/export" `
  -Headers @{ "x-cron-secret" = "8325110eb9414310831cdb7eab9626ec" }

# CSV (download)
Invoke-RestMethod `
  -Method GET `
  -Uri "https://hiveai-six.vercel.app/api/wallets/export?format=csv" `
  -Headers @{ "x-cron-secret" = "8325110eb9414310831cdb7eab9626ec" } `
  -OutFile "wallets.csv"
```

Optional filter for a single campaign:
```
.../api/wallets/export?campaignId=<UUID>
```

---

## 3. Supabase Migrations & Types Refresh

Run whenever database schema changes (missions, narratives, etc.).

```powershell
# Push pending migrations (prompts for confirmation)
npx supabase db push

# Regenerate typed client after schema changes
npx supabase gen types typescript --linked `
  | Out-File -Encoding utf8 lib/supabase/types.ts
```

Keep `.env.local` aligned with Vercel after each deployment (especially `X_REDIRECT_URI`, `NEXT_PUBLIC_APP_URL`, `GOOGLE_SHEETS_WEBHOOK_URL`).

---

## 4. Connect X / OAuth Sanity Check

When migrating domains, confirm these env vars match the deployed host:

| Variable | Example |
|----------|---------|
| `X_REDIRECT_URI` | `https://hiveai-six.vercel.app/api/auth/x/callback` |
| `NEXT_PUBLIC_APP_URL` | `https://hiveai-six.vercel.app` |

After redeploying, re-auth via “Connect X” on the target device.

---

## 5. Narrative Creation Prompt Template

Use with the Hive Persona endpoint or any LLM to craft new narrative briefs.

```
You are the Hive narrative architect. Draft a new campaign brief with:
- Title
- Dual hashtags (#HiveAI + custom project tag)
- Narrative description (1 paragraph)
- Strategic angle (why this matters now)
- Key creator archetypes to target
- Sponsor pool outline (token amount + unlock criteria)
- Success metrics (MSP, posts, unique creators)

Context:
- Ecosystem focus: [insert L1 / sector]
- Desired launch date: [date]
- Existing campaigns to complement/avoid: [list]

End with: “Ready for funding? [Yes/No]” and a 0-100 confidence score.
```

### Persona Endpoint Example (cURL)
```bash
curl -X POST https://hiveai-six.vercel.app/api/persona \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Draft a new narrative revolving around Solana social wallets.",
    "mode": "oracle",
    "context": {
      "pageContext": "narrative",
      "title": "SolSocial Surge",
      "topCreators": ["@alpha_hive", "@solsage"],
      "recentActivity": ["Wallet onboarding spiked 40%", "Social graph integrations shipped"]
    }
  }'
```

---

## 6. Narrative Population Checklist

1. **Create Campaign** via Project Dashboard modal (or Supabase Admin):
   - Set `project_tag`, funding pool, start/end dates.
2. **Seed Narrative Assets**:
   - Banner, description, sponsor copy.
3. **Announce Prompt** (use template above) on Hive Persona or internal Discord.
4. **Verify Leaderboard Filters**:
   - Visit `/narratives`, ensure new campaign appears in trending cards.
5. **Run Wallet Sync** after first wave joins (Section 1).

---

## 7. Troubleshooting Quick Prompts

- **Wallet sync failing** → Re-run Apps Script `testSetup`, confirm `sheetsResponse.error`.
- **Infinite `_rsc` fetches** → Verify page Suspense boundaries & router replace guards.
- **OAuth “invalid_state”** → Ensure requests originate from `NEXT_PUBLIC_APP_URL`.

Keep this file updated whenever new operational commands or narrative prompt templates are introduced.
