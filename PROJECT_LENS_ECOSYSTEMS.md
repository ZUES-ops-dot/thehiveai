# Project Lens  Ecosystem Integrations Spec

This document defines the three external ecosystems that power Project Lens. Each section outlines purpose, data ingestion, API structure, UI placement, and allowed user actions (no paid prompts anywhere).

## 1. Play Solana  Gameplay Intelligence
**Goal**
Turn real Solana gameplay activity into narrative fuel and expose live ecosystem signals to users inside Lens.

**Data Sources**
- RPC endpoints
- Game-specific APIs
- Quest feeds
- Curated on-chain event streams

**API**
- GET /api/integrations/play-solana
- Cached for 510 minutes

**Response Fields**
`	s
{
  games: Array<{
    id: string
    name: string
    players: number
    tvl: number
    quests: string[]
    tags: string[]
  }>
  onChainEvents: Array<{
    id: string
    type: string
    description: string
    occurredAt: string
  }>
  agentRecommendations: Array<{
    id: string
    title: string
    description: string
    action: string
  }>
  lastUpdated: string
}
`

**UI  Solana Pulse Panel**
- Headline stats (total players, aggregate TVL)
- Game cards with quests + agent recommendations
- Mini on-chain events timeline

**Allowed Actions**
- Auto-Test  links to automation workflow
- Join Narrative  navigates to campaign page (not created here)
- View Wallet Impact  opens existing wallet modal

**Notes**
- No missions displayed on Project Lens
- Automation logs stored in utomation_logs table, not shown here

---

## 2. Indie.fun  Devlog Discovery
**Goal**
Surface trending indie devlogs without allowing any generation or narrative actions.

**Data Sources**
- Scraped Indie.fun trending + devlog pages
- Cached 1560 minutes

**API**
- GET /api/integrations/indie-fun
- Optional POST /api/integrations/indie-fun/save (bookmark)

**Response Fields**
`	s
{
  devlogs: Array<{
    id: string
    title: string
    author: string
    tags: string[]
    url: string
    summary: string
    publishedAt: string
    source: string
  }>
  lastUpdated: string
}
`

**UI  Indie Digest Panel**
- Slider or list of devlogs with metadata
- Per-item actions:
  - View Devlog  open url in new tab
  - Save  bookmark mutation (stored per user)
  - Share  copy link / 
avigator.share

**Compliance (VERY IMPORTANT)**
-  No Generate Review
-  No Narrative Pitch
-  No LLM-powered features
-  View / Save / Share only
- No cost-triggering prompts allowed here, ever

---

## 3. Moddio  Automation Lab
**Goal**
Demonstrate Hives agent automation on UGC games (auto-test, auto-analysis, etc.).

**Data Sources**
- Moddio discovery pages
- Internal automation logs

**API**
- GET /api/integrations/moddio (cached 10 minutes)
- POST /api/integrations/moddio (trigger automation run)

**Response Fields**
`	s
{
  projects: Array<{
    id: string
    name: string
    genre: string
    players: number
    automationIdeas: string[]
  }>
  automationLogs: Array<AutomationLog>
  lastUpdated: string
}
`
*(AutomationLog fetched from utomation_logs table.)*

**UI  Moddio Automation Lab**
- Project cards with automation ideas
- Run Auto-Test button  calls POST, creates optimistic log entry
- Automation log list with status chips (Queued, Running, Success, Failed), timestamps, and links to detailed results

**Logging**
Every automation run writes a row to utomation_logs.

---

## Implementation Notes
- React Query hooks: usePlaySolanaStats, useIndieDigest, useModdioAutomation
- Shared caching utilities, shared rate limiting, common fetch helper with retries
- Project Lens remains mission-free: no XP/MSP progress UI, no mission triggers shown
