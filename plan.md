# 🐝 HIVE AI — Development Plan

> "An animated, living Solana social intelligence hive."

## Project Overview

Hive AI is a living, animated, multi-node brain that visualizes the X (Twitter) Solana ecosystem as a glowing, evolving swarm. The front-end MUST FEEL ALIVE with glowing nodes, pulsing clusters, animated connections, floating particles, and reactive gradients.

---

## Phase 1: Foundation Setup ✅

- [x] Create plan.md
- [ ] Initialize Next.js 14 project with App Router
- [ ] Configure Tailwind CSS with neon/cyber-hive theme
- [ ] Install dependencies (Framer Motion, shadcn/ui, react-force-graph, tsparticles)
- [ ] Set up dark mode only theme
- [ ] Create base layout with animated background

## Phase 2: Core Components

### Hive UI Components
- [ ] `<HiveNode />` — Glowing, animated node
- [ ] `<HiveClusterGraph />` — Moving force graph nodes
- [ ] `<HiveGlowCard />` — Animated card wrapper with glow
- [ ] `<HivePulseNumber />` — Count-up animation numbers
- [ ] `<HiveSparkline />` — Animated line graph
- [ ] `<HiveOrbitMenu />` — Circular animated navigation
- [ ] `<HiveParticleField />` — Background particle animation
- [ ] `<HiveHexagonFrame />` — Glowing hexagon borders

### Data Components
- [ ] `<TrendingNarrativeList />`
- [ ] `<InfluencerTable />`
- [ ] `<ProjectHeatCard />`
- [ ] `<AnimatedTweetPreview />`
- [ ] `<EngagementPulseGraph />`

## Phase 3: Mock + Verified Data Layer

### 3.1 Mock Sources (for UI scaffolding)
- [ ] `mock/tweets.json` — Sample tweet data
- [ ] `mock/accounts.json` — Influencer accounts
- [ ] `mock/projects.json` — Solana projects
- [ ] `mock/clusters.json` — Topic clusters
- [ ] `mock/network.json` — Network graph data

### 3.2 Verifiable Events (Supabase + tracking engine)
- [ ] Campaign joins (`participants`)
- [ ] Hashtag-tracked posts (`post_events`, `increment_participant_stats`)
- [ ] Narrative joins/comments (future tables)
- [ ] Missions progress derived only from auditable events (see §27)

### 3.3 Live Data Migration (current sprint)
1. **Wire tracking ingestion**: `/api/tracking` persists every valid tweet via `recordPostEvent`, `incrementParticipantStats`, and `upsertTrackingState`.
2. **Expose recent posts**: `/api/posts/recent` surfaces `post_events` for the dashboard activity feed (fallback to mock only if empty).
3. **Expose top influencers**: `/api/influencers/top` aggregates Supabase participants (followers, virality, engagement efficiency).
4. **Replace dashboard mocks**: activity feed + influencer cards consume the new APIs.
5. **Missions telemetry**: missions page fetches `missions_progress` once cron + aggregation exist (see §27).

### 3.4 Outstanding Live Data Tasks (Dec 6, 2025)
- **Missions backend** — Create Supabase tables (`missions`, `mission_rewards`, `mission_progress`) plus `/api/missions` so the missions page can display real assignments, progress, completed counts, and badge unlocks instead of placeholders.
- **Project Lens data model** — Introduce a `projects` table (or enrich `campaigns`) with sector/category, primary/secondary hashtags, sentiment aggregates, and mention velocity so the Project Lens grid can auto-fill analytics per project rather than reusing dashboard trending campaigns.
- **Reward distribution execution** — Implement a scheduled job or RPC that uses `REWARD_CURVE` + MSP totals to compute payouts/credits so leaderboard rewards match the published distribution (Rank #1 30%, #2 15%, #3 10%, #4-10 25%, #11-50 20%).
- **Narrative analytics persistence** — Store per-narrative keywords, contributor lists, sponsor pools, and funding stats so the Narratives Explorer cards pull live data instead of mock word clouds/metrics.
- **Badges & profile stats** — Track badge awards, credits, and mission completions in Supabase and return them via `/api/user` so profile cards and missions counters no longer rely on hardcoded values (e.g., “Badges Earned”).

### 3.5 Narrative Analytics Pipeline (in progress)
1. **Schema** — `narrative_analytics` + `narrative_sponsors` tables (JSON fields for keywords, top_accounts, sponsor pools) with indexes/`updated_at` triggers. ✅ (Migration 0005)
2. **Aggregation job** — Serverless function or cron task that:
   - Fetches recent `post_events` per campaign and extracts hashtags/keywords.
   - Ranks top contributors from `participants` (MSP, followers) for “top_accounts”.
   - Pulls sponsor rows from `narrative_sponsors`.
   - Upserts synthesized payload into `narrative_analytics`.
3. **API surface** — `/api/narratives/analytics` returns analytics per campaign (optionally scoped to connected accounts), falling back to on-demand recompute if stale.
4. **UI wiring** — Narratives Explorer consumes the API to display live keywords, contributors, and sponsor pool insights for both active and trending campaigns.

## Phase 4: Core Pages (All Animated)

### 🏠 Dashboard (Hive Overview)
- [ ] Hive Cluster Map (center) with animated glowing nodes
- [ ] Trending Narratives Wheel with rotating segments
- [ ] Influencer Heatboard with glowing cards
- [ ] Engagement Pulse Graph with animated sparkline
- [ ] Activity Feed with hologram-style tweet animations

### 🧠 Mindshare Page
- [ ] Force graph with real movement
- [ ] Nodes grow/shrink by influence
- [ ] Oscillating connections
- [ ] Click-to-zoom sub-clusters
- [ ] Animated storytelling mode

### 🔥 Narratives Explorer
- [ ] Pulsing tags
- [ ] Expanding "narrative waves"
- [ ] Kinetic word clouds
- [ ] Topic-timeline grow animations

### 🌟 Influencer Analyzer
- [ ] Tilt-on-hover cards
- [ ] Heat color transitions
- [ ] Glowing hexagon profile frames
- [ ] Animated virality scores

### 💠 Project Lens
- [ ] Animated project card entries
- [ ] Glowing radial sentiment gauge
- [ ] Rising particle mention velocity
- [ ] Purpose: showcase which Solana projects have the most attention. Inputs:
  - Mention count (from mock now; later from data pipeline)
  - Sentiment score (bullish/bearish)
  - Velocity sparkline (rate of mention change)
- [ ] KPI: help projects understand their social traction and which narratives to fund.

### 🧬 Hive Graph (Optional)
- [ ] 3D glowing nodes
- [ ] Depth blur effects
- [ ] Particle information flow
- [ ] Smooth camera movement

## Phase 5: Animation & Polish

- [ ] Page transitions with Framer Motion
- [ ] Route animations
- [ ] Hover states everywhere
- [ ] Loading animations
- [ ] Particle ambient effects
- [ ] Glow edge effects

## Phase 6: X Authentication & Campaign Tracking 

### X OAuth Integration
- [x] X OAuth 2.0 with PKCE (`/api/auth/x`)
- [x] OAuth callback handler (`/api/auth/x/callback`)
- [x] Logout endpoint (`/api/auth/x/logout`)
- [x] XUser type definitions (`lib/types/auth.ts`)
- [x] Auth state store (`lib/stores/useAuthStore.ts`)
- [x] XProfileCard component (displays X PFP, name, followers)
- [x] XLoginButton component

### Dual-Hashtag Tracking System
- [x] Primary hashtag: `#HiveAI` (required in ALL campaigns)
- [x] Secondary hashtag: `#<ProjectTag>` (unique per campaign)
- [x] Tracking rule: `post.includes("#HiveAI") AND post.includes(projectTag)`
- [x] Nitter-based tracking engine (`lib/engine/hashtag-tracker.ts`)
- [x] Tracking API (`/api/tracking?tag=ProjectTag`)
- [x] Post validation endpoint
- [x] MSP calculation from engagement metrics

### Campaign System
- [x] Campaign types (`lib/types/auth.ts`)
- [x] Campaign store (`lib/stores/useCampaignStore.ts`)
- [x] Mock campaigns data (`lib/mock/campaigns.json`)
- [x] CampaignCard component (join/leave, mini leaderboard)
- [x] CampaignLeaderboard component (full rankings)
- [x] Everyone starts at rank 0 (no pre-existing standings)
- [x] Profile page updated with X auth + campaigns

### Environment Variables
```bash
X_CLIENT_ID=your_client_id
X_CLIENT_SECRET=your_client_secret
X_REDIRECT_URI=http://localhost:3000/api/auth/x/callback
```

## Phase 7: Future Backend Integration (Later)

- [ ] Automated post tracking cron job
- [ ] Data normalization pipeline
- [ ] Real-time MSP updates
- [ ] AI summarization integration
- [ ] Vector embeddings
- [ ] Impressions harvesting
- [ ] Notification system for campaign milestones

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Animation | Framer Motion, react-spring |
| Visualization | react-force-graph, Three.js |
| Particles | tsparticles |
| Charts | Recharts |
| Icons | Lucide React |

## Design System

### Colors
- **Primary:** Solar Amber `#F59E0B` / `#FBBF24`
- **Accent:** Cyan `#06B6D4` / `#22D3EE`
- **Background:** Deep Black `#0A0A0F` / `#111118`
- **Glow:** Amber glow, Cyan glow
- **Text:** White / Gray-400

### Motion Rules
- Everything breathes (subtle pulse)
- Nodes pulse on data changes
- Edges glow when active
- Cards hover with depth
- Numbers tick-animate
- Sparks float in background

---

---

## 8. State Management Strategy

| Library | Purpose |
|---------|--------|
| **Zustand** | Lightweight global UI state (theme, zoom, animation level, selected nodes) |
| **React Query** | Async data fetching + caching (tweets, accounts, narratives) |

### Global State Stores
```typescript
// stores/useHiveStore.ts
- selectedNode: Node | null
- hoveredNarrative: string | null
- zoomLevel: number
- animationIntensity: 'low' | 'medium' | 'high'
- theme: 'dark' (always)
- connectedNodes: string[]
```

### React Query Keys
```typescript
['tweets', filters]
['accounts', category]
['narratives', timeframe]
['network', depth]
['projects', sort]
```

---

## 9. Animation Performance Standards

| Rule | Limit |
|------|-------|
| Particle count | < 400 particles |
| Force graph nodes | < 200 nodes |
| Concurrent animations | < 15 simultaneous |
| Frame budget | 16ms (60fps) |

### Performance Guidelines
- Use `requestAnimationFrame` only for graph/canvas components
- Offload heavy visualizations to WebGL (Three.js)
- Respect `prefers-reduced-motion` media query
- Debounce hover interactions (100ms)
- Virtualize long lists (> 50 items)
- Lazy load off-screen components

---

## 10. Component Architecture

```
/components/
├── hive/                    # Animated Hive primitives
│   ├── HiveNode.tsx
│   ├── HiveClusterGraph.tsx
│   ├── HiveGlowCard.tsx
│   ├── HivePulseNumber.tsx
│   ├── HiveSparkline.tsx
│   ├── HiveOrbitMenu.tsx
│   └── HiveParticleField.tsx
├── data/                    # Data display components
│   ├── TrendCard.tsx
│   ├── InfluencerCard.tsx
│   ├── ProjectCard.tsx
│   └── TweetPreview.tsx
├── ui/                      # shadcn/ui primitives
│   ├── Button.tsx
│   ├── Input.tsx
│   └── ...
└── layout/
    ├── Navbar.tsx
    └── PageTransition.tsx

/lib/
├── motion/                  # Reusable animation presets
│   └── variants.ts
├── stores/                  # Zustand stores
│   └── useHiveStore.ts
├── hooks/                   # Custom hooks
│   └── useHiveInteraction.ts
└── mock/                    # Mock data
```

---

## 11. Reusable Animation Presets

```typescript
// lib/motion/variants.ts
export const fadeIn = { ... }
export const slideUp = { ... }
export const scaleIn = { ... }
export const pulseGlow = { ... }
export const orbit = { ... }
export const breathe = { ... }
export const staggerContainer = { ... }
```

Usage:
```tsx
<motion.div variants={fadeIn} initial="hidden" animate="visible">
```

---

## 12. Glow Theming System

### CSS Glow Classes
```css
.glow-amber { box-shadow: 0 0 20px #fbbf24AA, 0 0 40px #f59e0b55; }
.glow-cyan { box-shadow: 0 0 20px #22d3eeAA, 0 0 40px #06b6d455; }
.glow-purple { box-shadow: 0 0 20px #a78bfaAA, 0 0 40px #8b5cf655; }
```

### Tailwind Extensions
```typescript
dropShadow: {
  'amber-glow': '0 0 10px #fbbf24',
  'cyan-glow': '0 0 10px #22d3ee',
  'purple-glow': '0 0 10px #a78bfa',
}
```

---

## 13. Component Interaction Map (Living Ecosystem)

### Cross-Component Communication

```
┌─────────────────────────────────────────────────────────────┐
│                    HIVE INTERACTION FLOW                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [HiveClusterGraph] ──click node──▶ Updates:                │
│      │                              • TrendingNarrativeList │
│      │                              • InfluencerTable       │
│      │                              • ActivityFeed          │
│      │                                                      │
│      └──hover node──▶ Highlights:                           │
│                       • Connected edges glow                │
│                       • Related cards pulse                 │
│                                                              │
│  [TrendingNarratives] ──hover──▶ Highlights:                │
│      │                           • Graph nodes              │
│      │                           • Connected influencers    │
│      │                                                      │
│      └──click──▶ Filters:                                   │
│                  • Graph view                               │
│                  • Tweet feed                               │
│                                                              │
│  [InfluencerCard] ──click──▶ Actions:                       │
│                              • Zoom to mindshare cluster    │
│                              • Populate scorecards          │
│                              • Filter activity feed         │
│                                                              │
│  [ProjectCard] ──hover──▶ Shows:                            │
│                           • Mention velocity animation      │
│                           • Connected influencers glow      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### State Flow
```
User Action → Zustand Store → All Subscribed Components Re-render
                    ↓
            Animation Triggers
                    ↓
            Visual Feedback (glows, pulses, zooms)
```

---

---

## 14. Global Animation System (Motion Controller)

Controls the entire hive's animation state as one organism:

```typescript
// lib/stores/useHiveMotion.ts
- mood: 'calm' | 'alert' | 'excited' | 'critical'
- pulseSpeed: 'slow' | 'normal' | 'fast'
- marketState: 'growth' | 'volatility' | 'hype' | 'fear' | 'neutral'
- glowIntensity: 0-1
- rippleIntensity: 0-1
- particleDensity: 0-1
```

### Market State Colors
| State | Color | Emoji |
|-------|-------|-------|
| Growth | Green | 🟢 |
| Volatility | Amber | 🟡 |
| Hype | Pink | 🔥 |
| Fear | Red | 🔴 |
| Neutral | Cyan | ⚪ |

---

## 15. Sound Design Layer

Subtle UX sounds using Web Audio API:
- **Node pulse** → Light ping
- **Connection** → Soft electric crack
- **Hover** → Airy whoosh
- **Page transition** → Spatial swipe
- **Notification** → Alert chime

Sound is OFF by default, user can toggle in settings.

---

## 16. Real-Time Effect Engine

Components for dynamic visual effects:
- `HiveHexagonGrid` → Breathing honeycomb overlay
- `HiveActivityFeed` → Live notification stream
- Random node flickers
- Glow waves sweeping across screen
- Mouse-following particles
- Hover expansion ripples

---

## 17. Live Activity Layer (Mocked)

Auto-generating notifications:
- 🐝 "New wave detected"
- 🐝 "Narrative cluster expanding"
- 🐝 "Influencer gained +12.3%"
- 🐝 "Sentiment spike detected"
- 🐝 "Viral content alert"

---

## 18. Hive Persona (Voice of the Hive)

AI-like personality component that:
- Generates insights based on market state
- Shows confidence percentages
- Displays thinking animation
- Rotates observations automatically

---

## 19. Onboarding Animation

Spectacular 6-second landing sequence:
1. Screen is dark
2. Particles gather to center
3. Glowing hexagon appears
4. Cracks form in hexagon
5. Swarm emerges outward
6. UI fades in

---

## 20. Theme Variants

| Theme | Primary | Secondary | Description |
|-------|---------|-----------|-------------|
| **Prime** | Amber | Cyan | Original hive aesthetic |
| **Shadow** | Purple | Magenta | Night mode |
| **Lumina** | Gold | White | Clarity mode |
| **Matrix** | Green | Emerald | Terminal aesthetic |

---

## 21. Settings Panel

Control center for all hive effects:
- Sound toggle + volume
- Theme selector
- Mood selector
- Market state selector
- Glow intensity slider
- Particle density slider
- Global pulse toggle
- Breathing effect toggle
- Reduced motion toggle

---

---

## 22. Narrative Economy v3 — Living Attention Economy

> A living attention economy with project-funded narratives and creator-driven distribution. The Fortnite of narrative intelligence.

---

### 22.1 Core Loop (Simple + Scalable)

**Step 1 — Projects Infuse Money**
Projects (crypto, AI, SaaS, etc.) allocate budget into Narrative Funding Pools.

Example:
```
Narrative: "AI Agents Take Over Research"
├─ Project X infuses 5,000 HC
├─ Project Y adds 2,500 HC
└─ Project Z adds 1,500 HC
Total Pool: 9,000 HiveCredits
```

**Step 2 — Creators Amplify Narratives**
Creators earn **Mindshare Points (MSP)** by:
- Posting content & threads
- Sharing insights
- Creating videos/memes
- Leading discussions
- Bringing real engagement

> MSP reflects **impact**, not volume.

**Step 3 — Periodic Reward Distribution**

| Leaderboard | Period | Weight |
|-------------|--------|--------|
| 🔥 Weekly | 7 days | 45% |
| 🔥 Monthly | 30 days | 30% |
| 🔥 Yearly | 365 days | 20% |
| ⭐ All-Time | Rolling | 5% |

Why this works:
- Fresh opportunities weekly (newcomers can win)
- Big monthly/yearly prestige
- All-time = legacy score

**Step 4 — Fixed, Transparent Reward Curve**

| Rank | Share |
|------|-------|
| #1 | 30% |
| #2 | 15% |
| #3 | 10% |
| #4–10 | 25% (shared) |
| #11–50 | 20% (shared) |

Always predictable. Always fair.

---

### 22.2 Anti-Spam & Integrity System

Mindshare is **not** generated by posting — it's generated by **impact**:

| Signal | Description |
|--------|-------------|
| Unique engagement | New users reached, new impressions |
| Comment quality | Comments from unique accounts |
| Creator reputation | Multiplier based on history |
| Narrative relevance | How well content matches narrative |
| Virality | Rate of growth |

> 🔥 Posting alone = 0 MSP. Only impact gives MSP.

---

### 22.3 Creator Profiles (Refined)

**Leaderboard Tabs (4):**
- Weekly / Monthly / Yearly / All-Time
- Each shows: rank, total MSP, rewards earned

**Career Stats:**
| Stat | Description |
|------|-------------|
| Total MSP Lifetime | Cumulative mindshare |
| Narratives Amplified | Count of narratives contributed to |
| Avg. Tier per Week | Consistency metric |
| Best Rank Achieved | Peak performance |
| Current Streak | Consecutive active days |
| Conversion Score | Engagement efficiency |

---

### 22.4 Glow Tiers (Updated)

| Tier | Name | Description | Colors |
|------|------|-------------|--------|
| T1 | **Prime** | New creators | Cyan / Amber |
| T2 | **Lumina** | Verified contributors | Gold / White |
| T3 | **Echelon** | Rising influencers | Purple / Blue |
| T4 | **Apex** | Top 100 creators | Magenta / Neon |
| T5 | **Overmind** | Legendary | Radiant shifting gradient |

**Tier Effects:**
- Profile aura intensity
- Node glow in mindshare map
- Higher MSP multiplier
- Unique animations
- Overmind users have orbiting particles

---

### 22.5 Narrative Pools — Fully Refined

Each narrative displays:
| Field | Description |
|-------|-------------|
| Title | Narrative name |
| Description | What it's about |
| Funding Total | Sum of all project contributions |
| Project Contributors | List of sponsors |
| Time Left | Countdown to reward distribution |
| Leaderboards | Same 4 tabs |
| Activity Heatmap | Creator engagement over time |
| Momentum Score | Growth velocity |
| Sentiment Score | Positive/negative ratio |

**Bonuses:**
- Early amplification bonus
- Long-form contribution bonus
- High-value commentary bonus
- Narrative combo chains (tying multiple narratives)

---

### 22.6 Mindshare Cluster (Social Graph) — Updated

Real-time visualization:
- **Creator nodes** pulse when generating mindshare
- **Narrative nodes** glow when receiving funding
- **Constellations** form between collaborating creators
- **Tier colors** change node appearance
- **Overmind users** have orbiting particles
- **Project nodes** have hexagonal "shields"

> It feels alive.

---

### 22.7 Hive Treasury & Economy Stability

**MVP:** HiveCredits are off-chain credits (safe, simple).

**Future Upgrades:**
- Fully on-chain ERC-20 or ERC-6551 profiles
- DAO-managed narrative pools
- Bridgeable on Solana, Base, or TON

---

### 22.8 MVP Requirements (Clear & Light)

| Table | Purpose |
|-------|---------|
| `creators` | Profile data, tier, stats |
| `narratives` | Pool info, funding, metadata |
| `mindshare_events` | Activity log, MSP calculations |
| `leaderboard_snapshots` | Periodic rankings |
| `funding_ledger` | Project contributions |

That's it. Five tables.

---

### 22.9 Monetization Strategy

**Revenue Streams:**
| Stream | Description |
|--------|-------------|
| Narrative Pool Fees | Projects pay to open pools |
| Boosting Fees | Promote narratives higher |
| Creator Premium | Perks for paying creators |
| Placement Campaigns | Leaderboard sponsorships |
| Reputation Verification | Verified creator badges |

> Projects pay → Creators earn → Hive grows

---

### 22.10 Why This Crushes Kaito AI

| Kaito | Hive AI |
|-------|---------|
| Research tool | Living market of attention |
| Reads data | Redistributes attention as currency |
| Static | Gamified, social, animated |
| Passive | Creator-driven, economy-based |

> Kaito cannot replicate this without reinventing itself.
> **Hive becomes the Fortnite of narrative intelligence.**

---

### 22.11 Data Models (v3)

```typescript
// Glow Tier
type GlowTier = 'prime' | 'lumina' | 'echelon' | 'apex' | 'overmind'

// Creator Profile
interface CreatorProfile {
  id: string
  handle: string
  avatar?: string
  glowTier: GlowTier
  mspLifetime: number
  mspWeekly: number
  mspMonthly: number
  mspYearly: number
  narrativesAmplified: number
  avgTierPerWeek: number
  bestRankAchieved: number
  currentStreak: number
  conversionScore: number
  creditsEarned: number
  weeklyRank?: number
  monthlyRank?: number
  yearlyRank?: number
  allTimeRank?: number
}

// Narrative Pool
interface NarrativePool {
  id: string
  title: string
  description: string
  fundingTotal: number
  sponsors: { projectId: string; name: string; amount: number }[]
  distributionDate: Date
  momentumScore: number
  sentimentScore: number
  leaderboard: LeaderboardEntry[]
}

// Mindshare Event
interface MindshareEvent {
  id: string
  creatorId: string
  narrativeId: string
  mspEarned: number
  engagementType: 'post' | 'thread' | 'video' | 'meme' | 'discussion'
  uniqueReach: number
  viralityScore: number
  timestamp: Date
}

// Leaderboard Entry
interface LeaderboardEntry {
  creatorId: string
  rank: number
  msp: number
  creditsEarned: number
  period: 'weekly' | 'monthly' | 'yearly' | 'alltime'
}
```

---

---

## 23. Phase 3 — Advanced Features Roadmap

### 23.1 Narrative Page (Full Page for Each Narrative Pool)
Core hub for creator-narrative interaction:
- Narrative funding status (progress bar, total, sponsors)
- Creator ranking inside this narrative
- Live activity feed (recent amplifications)
- Momentum graph (real-time pulse)
- Sentiment wave visualization
- Funding sponsors showcase
- "Amplify Now" CTA actions
- Time remaining until distribution

### 23.2 Creator Missions (Daily / Weekly Tasks)
Progression + engagement loops:
| Mission Type | Example | Reward |
|--------------|---------|--------|
| Daily | "Amplify 3 narratives today" | 50 XP |
| Daily | "Complete 2 high-value comments" | 30 XP |
| Weekly | "Reach 10k total MSP this week" | 500 XP |
| Monthly | "Unlock Tier Lumina" | Badge + Cosmetic |
| Special | "First to amplify new narrative" | Rare Badge |

Mission categories:
- Amplification missions
- Engagement missions
- Streak missions
- Tier progression missions
- Discovery missions (find emerging narratives)

### 23.3 Dynamic Tier Glow System (Live Visuals)
Tier-specific animations:
| Tier | Visual Effect |
|------|---------------|
| Prime | Soft pulsing glow, subtle breathing |
| Lumina | Gold spokes radiating outward |
| Echelon | Fractal hologram edges, geometric patterns |
| Apex | Orbiting particles, energy trails |
| Overmind | Radiant swarm aura, shifting gradients |

Profile becomes a holographic identity badge.

### 23.4 Project Dashboard (B2B Platform)
Where projects manage their narrative economy:
- Create new narratives
- Infuse funding (add credits)
- Track creator performance
- Boost narratives (paid promotion)
- Cost-per-mindshare analytics
- ROI tracking
- Creator discovery tools

### 23.5 Mindshare Engine (Backend Spec)
Core MSP calculation:
```
MSP = (reach × engagement × relevance × credibility × velocity) × tierMultiplier
```

| Factor | Weight | Description |
|--------|--------|-------------|
| Reach | 0.25 | Unique users reached |
| Engagement | 0.25 | Likes, RTs, quotes, replies |
| Relevance | 0.20 | Content-to-narrative match score |
| Credibility | 0.15 | Creator reputation multiplier |
| Velocity | 0.15 | Speed of engagement growth |

Additional mechanics:
- Decay function: MSP decays 10% per day after 7 days
- Anti-spam: Same content = 0 MSP, bot detection
- Normalization: Scaled per timeframe
- Early bonus: +50% MSP for first 24h of narrative

### 23.6 Social Graph v2 (Collaborations & Constellations)
Advanced visualization:
- Creator-to-creator energy lines (collaboration strength)
- Narrative influence heatmaps
- Constellations of top creators (clusters)
- Swarm movements for active periods
- Hexagonal territory ownership
- Real-time pulse propagation

### 23.7 UI/UX Polish Pass
Standardization:
- Glass hexagon cards
- Consistent spacing system
- Animation presets library
- Hive pattern overlays
- Component variants (glow levels)
- Mobile-first responsive refinements
- Loading states + skeletons
- Error boundaries with hive aesthetics

### 23.8 AI Hive Persona v2
Evolved personality system:
- Real insights per page context
- Narrative forecasts
- Dying trend warnings
- "Creator Guidance Mode"
- Personality slider: Calm → Oracle → Overmind
- Voice variations per market state
- Proactive recommendations

---

---

## Phase 3 Implementation Summary ✅

### New Core Screens
1. **Narrative Detail Page** (`/narrative/[id]`)
   - Funding breakdown with sponsor strip
   - Top amplifiers leaderboard (narrative-specific)
   - Momentum pulse graph with velocity
   - Live activity feed
   - Distribution countdown timer
   - Quick actions (Post/Share/Analyze)

2. **Missions Dashboard** (`/missions`)
   - Tabs: All / Daily / Weekly / Monthly / Special
   - Animated progress bars
   - XP + Credits + Badges + Cosmetics rewards
   - Reset timers (daily/weekly)
   - States: Locked / Active / Completed

3. **Dynamic Tier Glow System** (`HiveTierBadge`)
   - Prime → soft cyan pulse
   - Lumina → radiant gold spokes
   - Echelon → rotating fractal hex edges
   - Apex → orbiting particles
   - Overmind → full swarm aura + gradient waves

### Files Added
- `app/narrative/[id]/page.tsx`
- `app/missions/page.tsx`
- `lib/types/missions.ts`
- `lib/mock/missions.json`
- `components/hive/HiveTierBadge.tsx`

### Files Updated
- `Navbar.tsx` — Missions link, streamlined routing
- `app/narratives/page.tsx` — Funded pools section
- `plan.md` + `project.md` — Documentation

---

## 24. Phase 4 — Platform Completion

### 24.1 Project Dashboard (B2B Funding Portal)
Route: `/projects/dashboard`

Features:
- Create new narratives
- Infuse funding (add HiveCredits)
- Track creator performance
- View cost-per-mindshare analytics
- Boost narratives (paid promotion)
- ROI tracking dashboard
- Creator discovery tools

### 24.2 Mindshare Engine (Backend Spec)
Core formula:
```
MSP = (reach × engagement × relevance × credibility × velocity) × tierMultiplier × earlyBonus
```

Components:
- Decay function (10% per day after 7 days)
- Anti-spam heuristics
- Normalization per timeframe
- Early amplification bonus (+50% first 24h)
- Reward weight calculations
- Distribution algorithms

### 24.3 Social Graph v2
Enhancements:
- Creator-to-creator energy lines
- Constellation mode (top creator clusters)
- Narrative influence heatmaps
- Swarm movements for active periods
- Hexagonal territory ownership
- Real-time pulse propagation

### 24.4 UI/UX Polish Pass
Refinements:
- Glass hexagon cards
- Consistent spacing system
- Animation presets library
- Loading skeletons
- Error boundaries
- Premium micro-interactions

### 24.5 Hive Persona v2
AI-driven features:
- Context-aware insights per page
- Narrative forecasts
- Dying trend warnings
- Creator guidance mode
- Personality slider (Calm → Oracle → Overmind)

---

## Current Status

**Phase:** 6 — X Authentication & Campaign Tracking ✅
**Next Step:** Phase 7 — Backend Integration (Cron Jobs, Real-time Updates)

---

## 25. Bug Fixes & Improvements (Dec 2024)

### 25.1 Narratives Page Fixes

#### Issue 1: "View All Funded Pools" Button Links to Self
**Location:** `app/narratives/page.tsx` line 158
**Problem:** Button links to `/narratives` which is the current page
**Fix:** Create a dedicated `/narratives/pools` page OR scroll to show all pools

#### Issue 2: Trending Topics Not Clickable to Funded Pools
**Location:** `app/narratives/page.tsx` lines 173-282
**Problem:** Trending topics (clusters) are not linked to their associated funded narrative pools
**Fix:** 
- Add `narrativeId` field to clusters.json to map clusters → narratives
- Make trending topic cards clickable, linking to `/narrative/[narrativeId]`
- Show which funded pool the topic belongs to

### 25.2 Hive Leaderboard Improvements

#### Issue 3: No Toggle for Top 10/30/50/100
**Location:** `app/leaderboards/page.tsx`
**Problem:** Leaderboard shows all creators without limit toggle
**Fix:**
- Add `LEADERBOARD_LIMITS = [10, 30, 50, 100]` constant
- Add toggle buttons like narrative page has
- Default to Top 10
- Track MSP across ALL narratives (global leaderboard)

#### Issue 4: Clarify Global vs Narrative Leaderboard
**Problem:** Hive leaderboard should aggregate MSP across all campaigns/narratives
**Current:** Uses mock `creators.json` data with pre-set ranks
**Fix:** 
- Ensure leaderboard aggregates from all campaigns
- Add "Global" label to distinguish from per-narrative leaderboards

### Implementation Plan

| Task | File | Status |
|------|------|--------|
| Fix "View All" button | `app/narratives/page.tsx` | ✅ Done |
| Add cluster→narrative mapping | `lib/mock/clusters.json` | ✅ Done |
| Make trending topics clickable | `app/narratives/page.tsx` | ✅ Done |
| Add leaderboard size toggle | `app/leaderboards/page.tsx` | ✅ Done |
| Default to Top 10 | `app/leaderboards/page.tsx` | ✅ Done |
| Add "Global" label | `app/leaderboards/page.tsx` | ✅ Done |

---

## 26. Creator Profile Stats Plan (Dec 2025)

### Objective
Expose the full CreatorProfile metrics (streaks, narratives amplified, conversion score, credits, glow tier progress, period ranks, etc.) on `/profile`, instead of just four aggregate counters.

### Scope & Dependencies
- Current sources: `/api/user` (Supabase participations) and `lib/mock/creators.json` (rich mock stats powering leaderboards).
- Missing pieces: `/api/user` does not return CreatorProfile fields, and the Profile UI has no sections to render them.

### Plan
1. **Audit data flow (✅ Done)** — catalogued every CreatorProfile field, mapped each to its data source (Supabase participations + derived calculations).
2. **Design UI & data mapping (✅ Done)** — hero stats row + Career Overview card + Performance/Streak/Rewards cards, with fallbacks for unauthenticated state.
3. **Implementation (✅ Done)** — extended `/api/user` to return full CreatorProfile (glowTier, mspWeekly/Monthly/Yearly/Lifetime, streak, conversionScore, creditsEarned, narrativesAmplified), updated `useUserCampaignData` hook, and rendered new cards on `app/profile/page.tsx`.
4. **Validation** — manual QA for authenticated vs unauthenticated users and docs updates once complete.

### Open Questions
- Should missing stats fall back to `lib/mock/creators.json`, or must all values be live from Supabase?
- Should streaks/conversion score be computed server-side or derived client-side from participation history?

> After the audit produces the field matrix, revisit steps 2–3 with the user for confirmation before coding.

---

## 27. Hive Leaderboard Narrative Filters (Dec 2025)

### Objectives
1. Maintain "Global" Hive leaderboard as default.
2. Allow filtering leaderboard by specific funded narratives.
3. Ensure "View Top Amplifiers" buttons on narrative pages deep-link into `/leaderboards` with the narrative filter preselected.
4. Fix the "Top 10/30/50/100" toggle so it actually updates the displayed rows.

### Data & Dependencies
- Current leaderboard uses mock `creators.json`. Need narrative metadata per creator (e.g., `narrativesAmplified` array linking to `lib/mock/narratives.json`).
- Need URL query params (e.g., `?narrative=narrative-003&size=50`) to keep filters shareable.

### Implementation Plan
1. **Data prep** — extend `lib/mock/creators.json` to include `narratives` array referencing narrative IDs; add helper to map narrative IDs → names.
2. **Leaderboard filters** — add narrative selector (default `Global`, plus each funded narrative) and read URL query params using `useSearchParams`.
3. **Size toggle fix** — ensure state updates are respected (e.g., by memoizing `sortedCreators` with `[activePeriod, leaderboardSize, selectedNarrative]`).
4. **Deep links** — update `app/narrative/[id]/page.tsx` CTA to link to `/leaderboards?narrative=<id>`.
5. **Copy updates** — header subtitle should reflect active filter (e.g., "MSP for Meme Liquidity Wars").
6. **Validation** — confirm new query params work client-side, toggles update rows, and linking from narrative detail page lands on filtered leaderboard.

### Status
- In Progress: Data review & sizing toggle investigation
- Pending: Filter UI, narrative data wiring, CTA updates

---
### Completed
- ✅ Project structure created
- ✅ Next.js 14 with App Router
- ✅ Tailwind CSS with cyber-hive theme
- ✅ Framer Motion animations
- ✅ Animated Hive components
- ✅ Mock data layer
- ✅ Particle background effects
- ✅ Global Motion Controller
- ✅ Sound Design Layer
- ✅ Hexagon Grid Overlay
- ✅ Live Activity Feed
- ✅ Hive Persona Component
- ✅ Onboarding Animation
- ✅ Theme Variants System
- ✅ Settings Panel
- ✅ Narrative Economy v3 spec (Section 22)
- ✅ Economy types (`lib/types/economy.ts`)
- ✅ Mock creators data (`lib/mock/creators.json`)
- ✅ Mock narratives data (`lib/mock/narratives.json`)
- ✅ Creator Profile page (`/profile`)
- ✅ Leaderboards page (`/leaderboards`)
- ✅ 5-tier Glow system (Prime → Lumina → Echelon → Apex → Overmind)
- ✅ Navbar updated with Leaderboards + Profile + Missions links
- ✅ Narrative detail page (`/narrative/[id]`)
- ✅ Missions page (`/missions`)
- ✅ Mission types (`lib/types/missions.ts`)
- ✅ Mock missions data (`lib/mock/missions.json`)
- ✅ HiveTierBadge component with dynamic animations
- ✅ Narratives page updated with funded pools links
- ✅ Project Dashboard B2B (`/projects/dashboard`)
- ✅ Mock funding data (`lib/mock/projects-funding.json`)
- ✅ Mindshare Engine v1.0 (`lib/engine/mindshare-engine.ts`)
- ✅ MSP calculation formulas + anti-spam + decay
- ✅ Reward distribution algorithms
- ✅ Social Graph v2 / Constellations (`/graph/constellations`)
- ✅ Graph types (`lib/types/graph.ts`)
- ✅ Constellation data hook (`lib/hooks/useConstellationData.ts`)
- ✅ ConstellationGraph component (force-directed layout)
- ✅ GraphControls component (filters, search)
- ✅ Mock constellation data with 35 nodes, 45+ edges, 9 clusters
- ✅ Motion presets library (`lib/motion/presets.ts`)
- ✅ Reduced motion hook (`lib/hooks/usePrefersReducedMotion.ts`)
- ✅ Glass card CSS utilities in globals.css
- ✅ Soft glow + transition utilities in Tailwind config
- ✅ HiveGlowCard upgraded with presets + accessibility
- ✅ Skeleton loading states CSS
- ✅ Focus states for accessibility
- ✅ PageTransitionWrapper with AnimatePresence
- ✅ Layout updated with skip link + page transitions
- ✅ Navbar refactored with presets + stagger mobile menu
- ✅ Leaderboards refactored with motion presets
- ✅ Open Graph metadata added
- ✅ Hive Persona v2 system complete
- ✅ Persona types (`lib/types/persona.ts`)
- ✅ Prompt templates + safety rules (`lib/persona/prompts.ts`)
- ✅ Confidence scoring + anti-hallucination (`lib/persona/utils.ts`)
- ✅ Audit logger (`lib/persona/audit.ts`)
- ✅ PersonaService API (`/api/persona`)
- ✅ PersonaCard component (inline insights)
- ✅ AskHiveModal component (interactive chat)
- ✅ X OAuth 2.0 authentication (`/api/auth/x`)
- ✅ XProfileCard + XLoginButton components
- ✅ Dual-hashtag tracking system (`#HiveAI` + `#ProjectTag`)
- ✅ Nitter-based tracking engine (`lib/engine/hashtag-tracker.ts`)
- ✅ Tracking API (`/api/tracking`)

---

## 28. Closed Beta Test — Connected Accounts System (Dec 2025)

### Objective
Run a real-world test with 2-4 missions/projects and 20-30 X accounts to validate the entire tracking pipeline end-to-end. All data must be live from Supabase—no hardcoded values.

### Architecture

#### Connected Accounts Table
```sql
-- supabase/migrations/0004_connected_accounts.sql
CREATE TABLE connected_accounts (
  id UUID PRIMARY KEY,
  owner_user_id TEXT NOT NULL,      -- Primary user's X ID
  x_user_id TEXT NOT NULL,          -- Connected account's X ID
  handle TEXT NOT NULL,             -- @username
  display_name TEXT NOT NULL,
  profile_image_url TEXT,
  followers_count BIGINT DEFAULT 0,
  connected_at TIMESTAMPTZ DEFAULT now(),
  active BOOLEAN DEFAULT true,
  UNIQUE(owner_user_id, x_user_id)
);
-- Max 3 active accounts per user enforced by trigger
```

#### Data Flow
```
User Auth → /api/user → connectedAccounts[]
                ↓
         useAuthStore.connectedAccounts
                ↓
    API calls with ?filterByConnected=true
                ↓
    /api/posts/recent, /api/influencers/top
    filter by user_id IN (connectedAccountIds)
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/accounts/connect` | GET | List user's connected accounts |
| `/api/accounts/connect` | POST | Connect new X account (max 3) |
| `/api/accounts/connect` | DELETE | Disconnect an account |
| `/api/posts/recent?filterByConnected=true` | GET | Posts from connected accounts only |
| `/api/influencers/top?filterByConnected=true` | GET | Influencers from connected accounts only |

### Files Created/Modified

| File | Change |
|------|--------|
| `supabase/migrations/0004_connected_accounts.sql` | New table + triggers |
| `lib/supabase/types.ts` | ConnectedAccount type |
| `lib/supabase/connected-accounts.ts` | CRUD helpers |
| `lib/types/auth.ts` | ConnectedXAccount interface |
| `lib/stores/useAuthStore.ts` | connectedAccounts state + helpers |
| `app/api/user/route.ts` | Returns connectedAccounts array |
| `app/api/accounts/connect/route.ts` | Account management API |
| `app/api/posts/recent/route.ts` | filterByConnected support |
| `app/api/influencers/top/route.ts` | filterByConnected support |
| `lib/supabase/posts.ts` | userIds filter option |

### Beta Test Checklist

- [ ] Run migration `0004_connected_accounts.sql` in Supabase
- [ ] Create 2-4 test campaigns in `campaigns` table
- [ ] Connect 20-30 test X accounts via `/api/accounts/connect`
- [ ] Verify tracking ingestion records posts to `post_events`
- [ ] Verify participant stats increment correctly
- [ ] Verify `/api/posts/recent?filterByConnected=true` returns only connected accounts' posts
- [ ] Verify `/api/influencers/top?filterByConnected=true` returns only connected accounts
- [ ] Verify Dashboard, Missions, Leaderboards pages display live data
- [ ] Verify no hardcoded/mock data appears on any page

### Success Criteria
1. All 20-30 accounts tracked in real-time
2. MSP calculated and stored per post
3. Leaderboard ranks update automatically
4. UI shows only data from connected accounts when filtered
5. Zero mock data in production views

---

## 29. Codebase Audit — Mock Data Usage (Dec 2025)

### Mock Files in `lib/mock/`
| File | Purpose | Status |
|------|---------|--------|
| `accounts.json` | Influencer profiles | Replace with `/api/influencers/top` |
| `campaigns.json` | Campaign definitions | Replace with Supabase `campaigns` table |
| `clusters.json` | Narrative clusters | Keep for UI scaffolding until live data pipeline |
| `creators.json` | Leaderboard creators | Replace with Supabase `participants` aggregation |
| `missions.json` | Mission definitions | Keep until missions table created |
| `narratives.json` | Funded narrative pools | Keep until narratives table created |
| `network.json` | Graph visualization | Keep for graph UI |
| `network-constellations.json` | Constellation graph | Keep for graph UI |
| `projects.json` | Solana projects | Keep until projects table created |
| `projects-funding.json` | B2B funding data | Keep until funding table created |
| `tweets.json` | Activity feed | Replace with `/api/posts/recent` |

### Pages Using Mock Data

| Page | Mock Import | Replacement Strategy |
|------|-------------|---------------------|
| `app/page.tsx` (Dashboard) | `tweets.json`, `accounts.json`, `clusters.json`, `network.json` | Wire to `/api/posts/recent`, `/api/influencers/top`; keep clusters/network for UI |
| `app/leaderboards/page.tsx` | `creators.json`, `narratives.json` | Wire to Supabase participants aggregation |
| `app/narratives/page.tsx` | `clusters.json`, `narratives.json` | Keep until narratives table |
| `app/narrative/[id]/page.tsx` | `narratives.json` | Keep until narratives table |
| `app/missions/page.tsx` | `missions.json` | Keep until missions table |
| `app/influencers/page.tsx` | `accounts.json` | Wire to `/api/influencers/top` |
| `app/projects/page.tsx` | `projects.json` | Keep until projects table |
| `app/projects/dashboard/page.tsx` | `projects-funding.json` | Keep until funding table |
| `app/graph/page.tsx` | `network.json` | Keep for visualization |

### Priority Replacements (Immediate)

1. **Dashboard Activity Feed** (`app/page.tsx`)
   - Currently: `tweetsData` from mock
   - Replace with: `useSWR('/api/posts/recent?filterByConnected=true')`

2. **Dashboard Top Influencers** (`app/page.tsx`)
   - Currently: `accountsData` from mock
   - Replace with: `useSWR('/api/influencers/top?filterByConnected=true')`

3. **Influencers Page** (`app/influencers/page.tsx`)
   - Currently: `accountsData` from mock
   - Replace with: `useSWR('/api/influencers/top?limit=50')`

4. **Leaderboards Page** (`app/leaderboards/page.tsx`)
   - Currently: `creatorsData` from mock
   - Replace with: Supabase participants query with MSP aggregation

### Deferred (Requires New Tables)

| Feature | Required Table | Status |
|---------|---------------|--------|
| Missions | `missions`, `mission_progress` | Design pending |
| Narratives | `narratives`, `narrative_funding` | Design pending |
| Projects | `projects` | Design pending |
| Graph | Derived from participants/posts | Keep mock for now |

### Next Steps
1. Wire Dashboard to live APIs (priority)
2. Wire Influencers page to live API
3. Create Supabase aggregation queries for leaderboards
4. Design and create missions/narratives tables for future sprints

---

## 30. Project Lens — Ecosystem Integrations (Dec 2025)

### Objective
Transform Project Lens from a campaign tracker into a portal to three external ecosystems: **Play Solana**, **Indie.fun**, and **Moddio**. Each panel surfaces read-only data and allows specific user actions—but **no narrative generation, paid prompts, or mission UI** on this page.

### ✅ Compliance Rules (ENFORCED)
| Rule | Status |
|------|--------|
| No `/api/narratives/*` imports on Lens page | ✅ Verified |
| No `createNarrative` or generation mutations | ✅ Verified |
| No NarrativeComposer modal | ✅ Verified |
| No mission progress UI | ✅ Verified |
| Indie Digest only allows View/Save/Share | ✅ Implemented |
| Moddio only writes to `automation_logs` | ✅ Implemented |

### Architecture

#### Database Tables (Migration 0016)
```sql
-- automation_logs: Moddio/Play Solana automation runs
CREATE TABLE automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('indie_fun', 'moddio', 'play_solana')),
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  result JSONB,
  run_by TEXT,
  run_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- workspace_bookmarks: Saved devlogs/projects
CREATE TABLE workspace_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  source TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- integration_cache: API response caching
CREATE TABLE integration_cache (
  key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
```

#### API Routes
| Route | Method | Purpose | Cache TTL |
|-------|--------|---------|-----------|
| `/api/integrations/play-solana` | GET | Solana games, on-chain events, agent recommendations | 5 min |
| `/api/integrations/indie-fun` | GET | Trending devlogs | 15 min |
| `/api/integrations/indie-fun` | POST | Save devlog to bookmarks | — |
| `/api/integrations/moddio` | GET | UGC projects + automation logs | 10 min |
| `/api/integrations/moddio` | POST | Trigger automation run | — |

#### Server Utilities
- `lib/server/fetchWithCache.ts` — Supabase cache + in-memory fallback
- `lib/server/rateLimit.ts` — Token bucket rate limiter (replace with Redis in prod)

#### React Query Hooks (`lib/hooks/useIntegrations.ts`)
```typescript
usePlaySolanaStats()       // 5 min stale
useIndieDigest()           // 15 min stale
useSaveDevlogMutation()    // Invalidates indie-fun queries
useModdioAutomation()      // 10 min stale
useTriggerAutomationMutation() // Invalidates moddio queries
```

### UI Design System

#### Global Panel Structure
- 3-column responsive grid
- Cards: `rounded-xl`, 16–20px padding, soft shadows
- Skeleton loaders for all async data
- Consistent Lucide iconography

#### Panel 1: Solana Pulse (Cyan Accent)
- **Stats ribbon**: Active games, total players, TVL, on-chain events
- **Game cards**: Name, player count, TVL chip, tags, quests
- **On-chain timeline**: Event descriptions with timestamps
- **Interactions**: View only (links out to campaign pages where narratives belong)

#### Panel 2: Indie Digest (Purple Accent)
- **Devlog cards**: Title, author, tags, summary, published date
- **Allowed actions**: View (external link), Save (bookmark), Share (system share)
- **Forbidden**: No generation, no paid prompts, no narrative creation
- **Visual style**: Editorial, clean, more whitespace

#### Panel 3: Moddio Automation Lab (Amber Accent)
- **Project cards**: Name, genre, player count, automation ideas
- **Run Auto-Test button**: Queues job to `automation_logs`
- **Automation logs feed**: Status (queued/running/success/failed), timestamps
- **Visual style**: Dev-console aesthetic, structured layout

### Files Created/Modified

| File | Change |
|------|--------|
| `supabase/migrations/0016_project_lens_tables.sql` | New tables |
| `lib/supabase/types.ts` | Added `AutomationLog`, `WorkspaceBookmark`, `IntegrationCache` types |
| `lib/server/fetchWithCache.ts` | Created caching utility |
| `lib/server/rateLimit.ts` | Created rate limiter |
| `app/api/integrations/play-solana/route.ts` | GET endpoint |
| `app/api/integrations/indie-fun/route.ts` | GET + POST endpoints |
| `app/api/integrations/moddio/route.ts` | GET + POST endpoints |
| `lib/hooks/useIntegrations.ts` | React Query hooks for all integrations |
| `app/projects/page.tsx` | Rebuilt with 3 ecosystem panels |

### Implementation Status

| Task | Status |
|------|--------|
| Supabase migration for tables | ✅ Complete |
| API routes scaffolded | ✅ Complete |
| Caching + rate limiting utilities | ✅ Complete |
| React Query hooks | ✅ Complete |
| Project Lens UI rebuilt | ✅ Complete |
| Compliance audit (no narrative entrypoints) | ✅ Verified |

### Future Enhancements
- [ ] Replace mock data with real Play Solana RPC calls
- [ ] Implement Indie.fun scraping (Playwright microservice)
- [ ] Implement Moddio scraping
- [ ] Add Playwright worker for automation job execution
- [ ] Replace in-memory rate limiter with Redis/Upstash
- [ ] Add Supabase RLS policies for bookmarks/logs

---

## 31. Project Lens — Live Explorer Mode (Dec 2025)

### Objective
Transform Project Lens into a **live browser/explorer** where users can directly access and interact with Play Solana, Indie.fun, and Moddio inside HiveAI — like a built-in web browser with platform-specific theming.

### Why Live Explorer?
- **Static panels are boring** — users want to explore the actual platforms
- **No 404 errors** — clicking "View" on a devlog shouldn't lead to broken mock URLs
- **Immersive experience** — feels like you're inside the ecosystem, not just reading about it
- **Real-time content** — always shows the latest from each platform

### Architecture

#### Platform Configuration
```typescript
const PLATFORMS = {
  'play-solana': {
    id: 'play-solana',
    name: 'Play Solana',
    url: 'https://www.playsolana.com',
    icon: Gamepad2,
    color: 'cyan',
    gradient: 'from-cyan-500 to-purple-500',
  },
  'indie-fun': {
    id: 'indie-fun',
    name: 'Indie.fun',
    url: 'https://indie.fun',
    icon: FileText,
    color: 'purple',
    gradient: 'from-purple-500 to-pink-500',
  },
  'moddio': {
    id: 'moddio',
    name: 'Moddio',
    url: 'https://www.modd.io',
    icon: Bot,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-500',
  },
}
```

### UI Components

#### 1. Platform Selector (Landing State)
- 3-column grid of platform cards
- Each card shows:
  - Animated gradient icon
  - Platform name + description
  - Live indicator (pulsing green dot)
  - URL preview (monospace)
  - "Launch Explorer" button
- Clicking a card opens the browser view

#### 2. Browser Chrome (Active State)
- **Traffic lights**: Close (red), Minimize (yellow), Fullscreen (green)
- **Navigation**: Back, Forward, Refresh, Home buttons
- **URL bar**: Shows current URL with loading indicator
- **Platform badge**: Gradient badge showing active platform
- **Actions**: Open external, Fullscreen toggle, Close

#### 3. Iframe Container
- Full-height embedded iframe (70vh default, 100vh fullscreen)
- Loading overlay with platform-themed animation
- Sandbox permissions for safe browsing
- Responsive to fullscreen toggle

#### 4. Quick Switch Tabs
- Horizontal tab bar below browser
- One-click switching between platforms
- Active platform highlighted with gradient

### Features

| Feature | Description |
|---------|-------------|
| **Live browsing** | Real websites embedded via iframe |
| **Browser controls** | Back, forward, refresh, home navigation |
| **Fullscreen mode** | Immersive full-viewport experience |
| **Platform theming** | Each platform has unique gradient/color |
| **Loading states** | Animated loading overlay per platform |
| **Quick switching** | Tab bar for instant platform changes |
| **External link** | Open current page in new browser tab |

### Iframe Security
```html
<iframe
  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
/>
```

### Known Limitations
1. **X-Frame-Options**: Some sites block iframe embedding — users can click "Open External" to view in new tab
2. **Cross-origin navigation**: Cannot track URL changes inside iframe due to browser security
3. **Authentication**: Users must log in separately on each platform

### Files Modified
| File | Change |
|------|--------|
| `app/projects/page.tsx` | Complete rewrite as live explorer |
| `components/hive/HiveGlowCard.tsx` | Added `onClick` prop support |

### Implementation Status
| Task | Status |
|------|--------|
| Platform selector UI | ✅ Complete |
| Browser chrome with controls | ✅ Complete |
| Iframe embedding | ✅ Complete |
| Fullscreen mode | ✅ Complete |
| Quick switch tabs | ✅ Complete |
| Loading states | ✅ Complete |
| HiveGlowCard onClick support | ✅ Complete |

### Removed Features (Moved to Future)
The previous static panel approach with mock data has been replaced. The following features are deferred:
- Mock game/devlog/project cards (replaced by live iframe)
- Bookmark/save functionality (requires auth integration with each platform)
- Automation trigger buttons (requires Playwright worker)

---

## 32. Project Lens — Iframe Blocking Detection & Fallbacks (Dec 2025)

### Problem
Many sites send `X-Frame-Options: DENY` or `Content-Security-Policy: frame-ancestors` headers that prevent iframe embedding. Without detection, users see a blank iframe with no feedback.

### Solution
1. **Server-side check endpoint** (`/api/proxy/check`) that fetches target URL headers
2. **Client-side blocking detection** before rendering iframe
3. **Graceful fallback UI** when embedding is blocked

### API Route: `/api/proxy/check`

```typescript
GET /api/proxy/check?url=<encoded_url>

Response:
{
  "ok": true,
  "blocked": true|false,
  "reason": "X-Frame-Options: DENY" | null,
  "headers": { ... }
}
```

**Security Features:**
- Rate limiting (10 req/min per IP)
- Domain whitelist (only allowed platforms can be checked)
- SSRF protection via hostname validation

**Whitelisted Domains:**
- `playsolana.io`
- `indie.fun`, `www.indie.fun`
- `modd.io`, `www.modd.io`

### Client-Side Flow

```
User clicks platform → checkEmbeddability(url) → /api/proxy/check
                                                      ↓
                                              blocked: true?
                                                      ↓
                                    YES: Show fallback overlay
                                    NO: Render iframe, show loading
```

### Fallback UI Components

When a site blocks embedding, users see:
1. **Warning icon** with platform gradient
2. **Explanation text** ("This site blocks embedding")
3. **Block reason** (technical detail in monospace)
4. **Primary CTA**: "Open [Platform] in New Tab"
5. **Secondary CTA**: "Copy URL"
6. **URL display** for reference

### Files Created/Modified

| File | Change |
|------|--------|
| `app/api/proxy/check/route.ts` | New endpoint for header inspection |
| `app/projects/page.tsx` | Added blocking detection + fallback UI |

### Implementation Details

**Blocking Detection Logic:**
```typescript
// X-Frame-Options
const blockedByXFO = /deny|sameorigin/i.test(xFrameOptions)

// CSP frame-ancestors
const blockedByCSP = csp.includes("'none'") || 
  (!csp.includes('*') && !csp.includes('localhost'))
```

**State Management:**
```typescript
const [isBlocked, setIsBlocked] = useState(false)
const [blockReason, setBlockReason] = useState<string | null>(null)
```

### Future Enhancements

- [ ] **Proxy renderer** (admin-only) that strips blocking headers
- [ ] **PostMessage bridge** for cooperating partner sites
- [ ] **Bookmark sync** via URL bar tracking (since cross-origin iframe URL is inaccessible)
- [ ] **Redis rate limiting** for production
- [ ] **Expanded whitelist** management via admin panel

---

## 33. Project Lens — Inline Mirror + Top-Level Actions Bridge (Dec 2025)

### Problem
Indie.fun blocks iframe embedding AND requires Phantom wallet for actions. Wallets break inside iframes due to:
- `window.solana` injection fails
- Popup blockers
- Transaction signing flows
- Redirect-based OAuth

### Solution: Inline Mirror Architecture
Instead of fighting iframe restrictions, we **mirror** the platform's content inline and open wallet actions in top-level windows.

```
┌─────────────────────────────────────────────────────┐
│  Project Lens (HiveAI)                              │
│  ┌───────────────────────────────────────────────┐  │
│  │  IndieFunMirror Component                     │  │
│  │  - Featured projects grid                     │  │
│  │  - Stats bar                                  │  │
│  │  - Tabs (Featured/Trending/New)               │  │
│  │  - "Create Project" → opens indie.fun/create  │  │
│  │  - "Connect Wallet" → opens indie.fun         │  │
│  └───────────────────────────────────────────────┘  │
│                         │                           │
│                         ▼                           │
│              window.open(indie.fun)                 │
│                         │                           │
│                         ▼                           │
│              User completes wallet action           │
│                         │                           │
│                         ▼                           │
│              postMessage / redirect back            │
└─────────────────────────────────────────────────────┘
```

### Why This Works Everywhere
| Scenario | Status |
|----------|--------|
| Indie.fun blocks iframes | ✅ Works |
| Phantom refuses in iframe | ✅ Works |
| CSP is strict | ✅ Works |
| No domain whitelist | ✅ Works |
| Legal concerns | ✅ No HTML rewriting |

### Implementation

#### Platform Config Flag
```typescript
const PLATFORMS = {
  'indie-fun': {
    useMirror: true,  // Uses inline mirror
    // ...
  },
  'play-solana': {
    useMirror: false, // Uses iframe
    // ...
  },
}
```

#### IndieFunMirror Component
**Location:** `components/explorer/IndieFunMirror.tsx`

**Features:**
- Hero section with gradient branding
- "Create Project" + "Connect Wallet" buttons (open top-level)
- Stats bar (Projects, Creators, Funded, This Week)
- Tabs: Featured / Trending / New
- Project cards with thumbnails, tags, likes, comments
- Pending action indicator when waiting for wallet flow
- PostMessage listener for return events
- Built-in quick switch for platform navigation

#### Wallet Action Flow
```typescript
const openIndieFun = (path: string, action?: string) => {
  const returnUrl = encodeURIComponent(`${window.location.origin}/projects?indie_return=true`)
  const url = `https://indie.fun${path}?ref=hiveai&return=${returnUrl}`
  
  if (action) setPendingAction(action)
  window.open(url, '_blank', 'noopener,noreferrer')
}
```

#### PostMessage Listener
```typescript
useEffect(() => {
  const handler = (e: MessageEvent) => {
    if (e.data?.type === 'indie:project-created') {
      refreshProjectState(e.data.projectId)
      setPendingAction(null)
    }
  }
  window.addEventListener('message', handler)
  return () => window.removeEventListener('message', handler)
}, [])
```

### Files Created/Modified

| File | Change |
|------|--------|
| `components/explorer/IndieFunMirror.tsx` | New inline mirror component |
| `app/projects/page.tsx` | Added `useMirror` flag, conditional rendering |

### User Experience

1. User clicks "Indie.fun" in Project Lens
2. Sees beautiful inline mirror with projects, stats, actions
3. Clicks "Create Project" → new tab opens to indie.fun/create
4. User connects Phantom, creates project in the new tab
5. Returns to HiveAI → mirror refreshes with new project
6. Feels like integrated experience, but wallet worked perfectly

### Industry Precedent
This is the same strategy used by:
- **Stripe Dashboard** (Plaid integration)
- **Notion** (GitHub integration)
- **Discord** (Coinbase Wallet)
- **Vercel Analytics** (external embeds)
- **Web3Auth** (wallet connections)
- **Replit** (embedded previews)
