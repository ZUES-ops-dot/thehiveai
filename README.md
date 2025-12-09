# 🐝 HIVE AI

> An animated, living Solana social intelligence hive.

![Hive AI](https://img.shields.io/badge/Solana-Social_Intelligence-amber?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge)

## Overview

Hive AI is a living, animated, multi-node brain that visualizes the X (Twitter) Solana ecosystem as a glowing, evolving swarm. The front-end features:

- 🌟 **Glowing hive nodes** with pulse animations
- 🔗 **Animated network connections** between entities
- ✨ **Floating particles** in the background
- 🎨 **Reactive background gradients**
- 🚀 **Smooth page transitions**
- 🖱️ **Hover motion everywhere**

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **Tailwind CSS** | Utility-first styling |
| **Framer Motion** | Animations & transitions |
| **shadcn/ui** | UI component primitives |
| **tsparticles** | Ambient particle effects |
| **Recharts** | Data visualization |
| **Lucide React** | Icon system |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Development

The app runs at `http://localhost:3000`

## Project Structure

```
hive-ai/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Dashboard (Hive Overview)
│   ├── mindshare/         # Mindshare Network
│   ├── narratives/        # Narratives Explorer
│   ├── influencers/       # Influencer Analyzer
│   ├── projects/          # Project Lens
│   └── graph/             # Full Hive Graph
├── components/
│   ├── hive/              # Animated Hive Components
│   │   ├── HiveNode.tsx
│   │   ├── HiveGlowCard.tsx
│   │   ├── HivePulseNumber.tsx
│   │   ├── HiveSparkline.tsx
│   │   ├── HiveClusterGraph.tsx
│   │   └── HiveParticleField.tsx
│   ├── data/              # Data Display Components
│   │   ├── TrendCard.tsx
│   │   ├── InfluencerCard.tsx
│   │   ├── ProjectCard.tsx
│   │   └── TweetPreview.tsx
│   └── layout/
│       └── Navbar.tsx
├── lib/
│   ├── utils.ts           # Utility functions
│   └── mock/              # Mock data (JSON)
│       ├── tweets.json
│       ├── accounts.json
│       ├── projects.json
│       ├── clusters.json
│       └── network.json
└── tailwind.config.ts     # Tailwind + theme config
```

## Core Pages

### 🏠 Dashboard
The animated "hive command center" featuring:
- Hive Cluster Map with glowing nodes
- Trending Narratives panel
- Influencer Heatboard
- Activity Feed with tweet animations

### 🧠 Mindshare
Living swarm visualization of:
- Influencer nodes
- Project connections
- Trending narratives
- Interactive force graph

### 🔥 Narratives Explorer
Animated storyline of emerging Solana narratives with:
- Pulsing tags
- Growth indicators
- Keyword clouds
- Sentiment analysis

### 🌟 Influencer Analyzer
Track key voices with:
- Animated profile cards
- Engagement metrics
- Virality scores
- Category filters

### 💠 Project Lens
Monitor Solana projects:
- Mention velocity
- Sentiment gauges
- Social velocity sparklines

### 🧬 Hive Graph
Full-screen network visualization with:
- Interactive nodes
- Animated connections
- Zoom controls

## Design System

### Colors
- **Primary:** Solar Amber `#F59E0B`
- **Accent:** Cyan `#06B6D4`
- **Secondary:** Purple `#8B5CF6`
- **Background:** Deep Black `#0A0A0F`

### Animations
All animations use Framer Motion with these patterns:
- **Pulse:** Breathing glow effects
- **Float:** Subtle vertical movement
- **Orbit:** Circular motion paths
- **Shimmer:** Gradient sweeps

## Deployment & Tracking Setup

### Environment Variables

Create a `.env.local` file with:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# X OAuth (Twitter Developer Portal)
X_CLIENT_ID=your_x_client_id
X_CLIENT_SECRET=your_x_client_secret
X_REDIRECT_URI=https://your-domain.com/api/auth/x/callback

# Auth
AUTH_SECRET=random_32_char_string

# Tracking (for GitHub Actions cron)
CRON_SECRET=random_secret_for_cron_auth

# Optional
INVITE_REWARDS_CAMPAIGN_ID=uuid_of_invite_campaign
```

### GitHub Actions Setup (Required for Tracking)

The X post tracking runs via GitHub Actions (not Vercel cron) to avoid rate limits.

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Add these repository secrets:
   - `APP_URL`: Your deployed app URL (e.g., `https://hiveai-six.vercel.app`)
   - `CRON_SECRET`: Same value as `CRON_SECRET` in your Vercel env vars

The tracking workflow runs every 15 minutes and:
- Fetches posts from Nitter instances
- Validates dual-hashtag posts (#HiveAI + #ProjectTag)
- Calculates MSP and updates leaderboards
- Has retry logic and health monitoring

### Workflows

| Workflow | Schedule | Purpose |
|----------|----------|---------|
| `tracking-cron.yml` | Every 15 min | Fetch and process X posts |
| `nitter-health.yml` | Every 6 hours | Monitor Nitter instance availability |

## Future Development

- [x] ~~Backend integration with Nitter scraping~~
- [x] ~~X OAuth authentication~~
- [ ] Real-time data streams
- [ ] AI-powered narrative detection
- [ ] Wallet tracking integration
- [ ] Alert system

## License

MIT License - Built for the Solana community 🚀
