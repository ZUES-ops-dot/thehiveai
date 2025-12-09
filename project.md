# Hive AI — Project Overview

> An animated, living Solana social intelligence hive designed to feel like a reactive ecosystem.

## 1. Purpose & Vision
- Visualize the Solana narrative graph as a glowing, breathing organism.
- Deliver actionable intel (narratives, influencers, projects) through immersive visuals, sound, and motion.
- Provide a blueprint for production-ready, GPU-friendly, animation-heavy front-ends similar to Kaito AI, but with more playful motion.

## 2. Core Screens
| Screen | Status | Highlights |
|--------|--------|------------|
| **Dashboard** | ✅ | Stats grid, hexagonal hive network, trending narratives, activity feed, influencer board, network pulse nodes, settings hooks. |
| **Mindshare** | ✅ | Dedicated "Live Hive Network" canvas, stats row, node cluster showcase, same hexagon graph with wider viewport. |
| **Narratives** | ✅ | Funded narrative pools with links, trending topics, tag filters, storyline metrics. |
| **Narrative Detail** | ✅ | Individual narrative page with funding status, leaderboard, live activity, momentum graph, amplify actions (`/narrative/[id]`). |
| **Missions** | ✅ | Daily/Weekly/Monthly/Special missions with progress tracking, XP rewards, badges, cosmetics (`/missions`). |
| **Leaderboards** | ✅ | Weekly/Monthly/Yearly/All-Time rankings with period tabs, reward distribution info (`/leaderboards`). |
| **Profile** | ✅ | Creator stats, tier badge, leaderboard ranks, recent earnings, glow tier showcase (`/profile`). |
| **Projects** | ✅ | Sentiment + velocity cards for Solana projects (`app/projects/page.tsx`). |

_All routes share the animated layout (particles, hex grid overlay, gradient background, Navbar, Providers)._ 

## 3. Major Systems
1. **Global Animation Store (`useHiveMotion`)**
   - Tracks mood, pulse speed, market state, glow intensity, ripple/particle strength, reduced motion, active theme (`prime`, `shadow`, `lumina`, `matrix`).
   - Supplies state to UI controls (HiveSettingsPanel) and motion hooks.

2. **Sound Design Layer (`useSoundEffects`)**
   - Web Audio API toolkit with synthesized tones for transitions, waves, success pings, alerts, hover ticks.
   - Debounced playback + toggle hook for muting.

3. **Real-Time Effect Engine**
   - Canvas-driven hexagon grid (`HiveHexagonGrid`) with SSR-safe guards.
   - Particle field background (`HiveParticleField`) and noise overlays.
   - `useAnimationFrame` hooks for shimmer, ripple, glow.

4. **Global Hexagon Pattern Overlay**
   - CSS + Tailwind utilities (`bg-hive-grid`, `gradient-text`, glow classes) for honeycomb ambiance.

5. **Live Activity Layer**
   - `HiveActivityFeed` renders mock tweet notifications with motion/scroll.
   - Data sourced from `lib/mock/tweets.json`.

6. **Personality Layer (`HivePersona`)**
   - Insight cards with rotating statements tied to market state and confidence.

7. **Onboarding Animation (`HiveOnboarding`)**
   - Multi-phase timeline (dark → particles → hexagon → crack → emerge → complete) with audio cues and graceful skip handling.

8. **Theme Variants (`lib/themes/hiveThemes.ts`)**
   - Matrix, Prime, Shadow, Lumina palettes (CSS variable driven) consumed by store + settings panel.

9. **Performance & GPU Checklist**
   - Documented budgets (≤400 particles, ≤200 nodes, ≤15 concurrent animations, 16 ms frame budget) within `plan.md`.

10. **Narrative Economy v3**
    - Project-funded narrative pools with HiveCredits
    - Mindshare Points (MSP) earned through impact, not volume
    - 4-period leaderboards (Weekly 45%, Monthly 30%, Yearly 20%, All-Time 5%)
    - Fixed reward curve (#1=30%, #2=15%, #3=10%, #4-10=25%, #11-50=20%)
    - Anti-spam: unique engagement, credibility multiplier, virality scoring

11. **Creator Missions System**
    - Daily/Weekly/Monthly/Special mission types
    - Categories: Amplification, Engagement, Streak, Tier, Discovery
    - XP + Credits + Badges + Cosmetics rewards
    - Progress tracking with animated bars

12. **5-Tier Glow System**
    | Tier | Name | Visual Effect |
    |------|------|---------------|
    | T1 | Prime | Soft pulsing glow |
    | T2 | Lumina | Gold spokes radiating |
    | T3 | Echelon | Fractal hologram edges |
    | T4 | Apex | Orbiting particles |
    | T5 | Overmind | Radiant swarm aura |

## 4. Reusable Components
- **Hive primitives:** `HiveGlowCard`, `HiveNode`, `HivePulseNumber`, `HiveSparkline`, `HiveClusterGraph`, `HiveParticleField`.
- **Data cards:** `TrendCard`, `InfluencerCard`, `ProjectCard`, `TweetPreview`.
- **UI controls:** `HiveSettingsPanel`, Navbar, providers wrapper.

_Notable detail:_ `HiveClusterGraph` now renders *hexagonal* nodes (glow + inner pulse) and is responsive via container measurement.

## 5. Mock Data Layer (`/lib/mock`)
- `tweets.json`, `accounts.json`, `clusters.json`, `network.json` (additional project/narrative data in respective files).
- Data drives all demo visuals; easy swap for live APIs later.

## 6. State & Hooks
| Store/Hook | Responsibility |
|------------|----------------|
| `useHiveStore` | Graph selections, filters, zoom/pan, sidebar states, persisted preferences. |
| `useHiveMotion` | Global animation + theme controls. |
| `useSoundToggle` | Syncs sound setting with store + audio context. |
| `useHiveInteraction` | Hover/click orchestration between cards and graph nodes. |

## 7. Layout & Styling
- **Next.js 14 App Router** with client components for animated sections.
- **Tailwind CSS** extended with CSS variables (background/foreground/input/ring) defined in `globals.css` + `tailwind.config.ts`.
- Utility classes: `glow-border-*`, `text-glow-*`, `gradient-text`, `bg-hive-grid`, custom scrollbars.
- Layout ensures mobile responsiveness (stacked grids, `space-y` adjustments, hamburger menu in Navbar, responsive HiveClusterGraph).

## 8. Animations & Motion
- Framer Motion for entrance, hover, loop animations.
- Custom keyframes in Tailwind config (`pulseGlow`, `float`, `orbit`, `glowLine`, etc.).
- Canvas animations driven by `requestAnimationFrame` and SSR-safe hooks.
- Particle + noise overlays for depth.

## 9. Audio & Accessibility
- All sound effects optional (default off, toggled via settings).
- `prefers-reduced-motion` respected in key components (e.g., hex grid, onboarding timeline stops).

## 10. Navigation & UX
- Sticky Navbar with animated logo, desktop links, mobile grid launcher.
- Search CTA placeholder (`⌘K`).
- Settings panel (right drawer) for tuning mood, market state, particle/glow levels, sound, theme.

## 11. Scripts & Tooling
| Command | Purpose |
|---------|---------|
| `npm install` | Install 630+ deps (Next.js, Tailwind, Framer Motion, Zustand, Lucide, etc.). |
| `npm run dev` | Launch Next.js dev server with live reload. |

## 12. B2B Platform (Project Dashboard)
Route: `/projects/dashboard`

Features implemented:
- Account overview (total funded, active narratives, avg cost/MSP)
- Weekly performance analytics with sparklines
- Funded narratives list with ROI tracking
- Top amplifiers for project's narratives
- Recent activity feed
- Cost-per-mindshare breakdown
- Quick actions (Create Narrative, Add Funding, View Analytics)

## 13. Mindshare Engine (`lib/engine/mindshare-engine.ts`)
Core MSP calculation formula:
```
MSP = (reach × engagement × relevance × credibility × velocity) × tierMultiplier × bonuses
```

| Factor | Weight | Description |
|--------|--------|-------------|
| Reach | 25% | Unique users, impressions, new followers |
| Engagement | 25% | Likes (1x), RTs (3x), Quotes (5x), Replies (2x) |
| Relevance | 20% | Keyword overlap with narrative |
| Credibility | 15% | Creator history + tier bonus |
| Velocity | 15% | Engagement rate over time |

Additional features:
- Tier multipliers (Prime 1x → Overmind 3x)
- Content type bonuses (Thread 1.5x, Video 2x, Analysis 1.8x)
- Early amplification bonus (+50% first 24h)
- Decay function (10%/day after 7 days)
- Anti-spam heuristics

## 14. Social Graph v2 — Constellations
Route: `/graph/constellations`

Interactive network visualization showing:
- **Nodes**: Creators (hexagons), Narratives (circles), Projects (squares)
- **Edges**: Amplifies, Collaborates, Funds relationships
- **Clusters**: 9 color-coded clusters (DeFi, Trading, NFT, Memes, Gaming, AI, RWA, Social, Ecosystem)

Features:
- Force-directed layout with custom simulation
- Node filtering by type, cluster, tier
- Search functionality
- Min connection strength slider
- Pan/zoom controls
- Node hover → show connected nodes
- Node click → open detail sidebar with metrics
- Cluster-based coloring

Components:
- `ConstellationGraph` — Canvas-based force graph
- `GraphControls` — Filters and controls panel
- `useConstellationData` — Data hook with filtering

## 15. Hive Persona v2 — AI Intelligence System
Route: `/api/persona` (POST)

AI-powered insight system with safety features:

**Components:**
- `PersonaCard` — Inline insight widget for any page
- `AskHiveModal` — Interactive chat interface

**Features:**
- LLM-powered analysis (OpenAI GPT-4o-mini default)
- Confidence scoring (0-100%)
- Hallucination detection
- Safety disclaimers
- Audit logging for all queries
- Rate limiting (20 req/min)
- Context-aware prompts per page type

**Usage:**
```tsx
// Inline insight
<PersonaCard 
  query="What's driving momentum in this narrative?" 
  context={{ narrativeId: 'ai-agents' }}
/>

// Modal chat
const [askOpen, setAskOpen] = useState(false)
<button onClick={() => setAskOpen(true)}>Ask Hive</button>
<AskHiveModal open={askOpen} onClose={() => setAskOpen(false)} />
```

**Environment:**
```bash
OPENAI_API_KEY=sk-xxx
PERSONA_MODEL=gpt-4o-mini  # optional
```

## 16. X Authentication & Campaign System

### X OAuth Integration
Route: `/api/auth/x`

Users connect their X (Twitter) account to:
- Display their X profile picture and name
- Join campaigns and track their posts
- Earn MSP rewards for valid posts

**Components:**
- `XProfileCard` — Displays connected X account with PFP, followers, tweet count
- `XLoginButton` — OAuth login button with X branding

**API Routes:**
- `GET /api/auth/x` — Initiates OAuth 2.0 with PKCE
- `GET /api/auth/x/callback` — Handles OAuth callback, fetches user data
- `POST /api/auth/x/logout` — Clears auth session

**Environment Variables:**
```bash
X_CLIENT_ID=your_client_id
X_CLIENT_SECRET=your_client_secret
X_REDIRECT_URI=http://localhost:3000/api/auth/x/callback
```

### Dual-Hashtag Tracking System
Route: `/api/tracking?tag=ProjectTag`

HiveAI tracks posts on X using a dual-hashtag system for campaign validation.

**Tracking Rule:**
```
detected = post.includes("#HiveAI") AND post.includes(projectHashtag)
```

A post is only valid if it contains BOTH:
1. **Primary Hashtag:** `#HiveAI` (required in ALL campaigns)
2. **Project Hashtag:** `#<ProjectTag>` (unique per campaign)

**Data Source:** Nitter instances (free, no API required)
- Rotates through multiple Nitter instances for reliability
- Parses tweet data: username, text, timestamp, engagement metrics
- Calculates MSP based on engagement

**API Endpoints:**
- `GET /api/tracking?tag=ProjectTag` — Fetch posts for a campaign
- `GET /api/tracking?tag=ProjectTag&status=true` — Get tracking status summary
- `POST /api/tracking` — Validate if a post text contains required hashtags

**Engine:** `lib/engine/hashtag-tracker.ts`
- `buildTrackingQuery()` — Generates Nitter and X search URLs
- `isValidPost()` — Validates dual-hashtag presence
- `fetchCampaignPosts()` — Fetches and parses posts from Nitter
- `calculatePostMSP()` — Calculates MSP from engagement metrics

### Campaign System
Store: `useCampaignStore`

**Features:**
- Users join campaigns after connecting X account
- Everyone starts at rank 0 (no pre-existing standings)
- MSP earned through valid posts with dual hashtags
- Real-time leaderboard per campaign

**Components:**
- `CampaignCard` — Campaign info, join button, mini leaderboard
- `CampaignLeaderboard` — Full leaderboard with participant rankings

**Campaign Data Structure:**
```typescript
interface Campaign {
  id: string
  name: string
  projectTag: string // e.g., "SolXToken"
  description: string
  rewardPool: number
  participants: CampaignParticipant[]
  totalMSP: number
  totalPosts: number
}
```

**Participant Flow:**
1. User connects X account on Profile page
2. User browses active campaigns
3. User joins campaign (starts at rank 0, 0 MSP)
4. User posts on X with `#HiveAI #ProjectTag`
5. System tracks posts via Nitter
6. MSP awarded based on engagement
7. Leaderboard updates in real-time

## 17. Future Enhancements
- Hook up live Solana + X/Twitter data feeds.
- Add backend cron + AI summarization pipelines (outlined in `plan.md`).
- Extend Hive Graph to 3D WebGL (Three.js) and add onboarding checkpoints.
- Implement automated post tracking cron job
- Add notification system for campaign milestones

## 18. File Map (High-Level)
```
app/
 ├─ page.tsx (Dashboard)
 ├─ mindshare/page.tsx
 ├─ narratives/page.tsx
 ├─ narrative/[id]/page.tsx (Narrative Detail)
 ├─ missions/page.tsx
 ├─ leaderboards/page.tsx
 ├─ profile/page.tsx (X auth + Campaigns)
 ├─ projects/
 │   ├─ page.tsx
 │   └─ dashboard/page.tsx (B2B Portal)
 ├─ api/
 │   ├─ auth/x/ (OAuth routes)
 │   ├─ tracking/ (Hashtag tracking)
 │   └─ persona/ (AI insights)
 └─ globals.css
components/
 ├─ hive/
 │   ├─ HiveGlowCard.tsx
 │   ├─ HiveNode.tsx
 │   ├─ HiveClusterGraph.tsx (hexagonal nodes)
 │   ├─ HiveTierBadge.tsx (dynamic tier animations)
 │   └─ ...
 ├─ auth/
 │   ├─ XLoginButton.tsx
 │   └─ XProfileCard.tsx
 ├─ campaign/
 │   ├─ CampaignCard.tsx
 │   └─ CampaignLeaderboard.tsx
 ├─ layout/Navbar.tsx
 └─ ui/HiveSettingsPanel.tsx
lib/
 ├─ types/
 │   ├─ economy.ts (GlowTier, CreatorProfile, NarrativePool)
 │   ├─ missions.ts (Mission types)
 │   └─ auth.ts (XUser, Campaign, TrackedPost)
 ├─ engine/
 │   ├─ mindshare-engine.ts (MSP calculations)
 │   └─ hashtag-tracker.ts (Nitter-based tracking)
 ├─ stores/
 │   ├─ useHiveStore.ts
 │   ├─ useHiveMotion.ts
 │   ├─ useAuthStore.ts (X auth state)
 │   └─ useCampaignStore.ts (Campaign state)
 ├─ mock/
 │   ├─ creators.json
 │   ├─ narratives.json
 │   ├─ missions.json
 │   ├─ campaigns.json
 │   ├─ projects-funding.json
 │   └─ ...
 └─ audio/useSoundEffects.ts
```

## 19. Key Differentiators
- Hexagon-first visual language (overlay, nodes, grids) with adaptive canvas sizing.
- Multi-layer ambiance (particles, glow, noise, audio) yet SSR-safe.
- Centralized motion controller + settings for real-time tuning.
- Comprehensive blueprint documenting systems, states, performance budgets.

This `project.md` should serve as the canonical reference for everything shipped in Hive AI to date.
