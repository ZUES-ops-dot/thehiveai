# Hive AI -- Animated Solana Network Visualization

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3.x-38B2AC?logo=tailwindcss&logoColor=white)
![Radix UI](https://img.shields.io/badge/Radix-UI-161618)
![License](https://img.shields.io/badge/license-MIT-green)

> A living, animated visualization of the Solana ecosystem rendered as a glowing hive of nodes -- pulse animations, reactive backgrounds, smooth transitions, and motion-everywhere UX. Built to make ecosystem mapping feel alive.

**[Live Demo](#)** · **[Stack](#tech-stack)** · **[Quick Start](#quick-start)**

---

## What problem this solves

Most ecosystem maps are static infographics that age the day they ship. Hive AI treats the Solana ecosystem as a living organism: nodes pulse, connections glow as activity flows, and the layout reacts to user focus. The goal is to make the network feel **observed in real time**, not photographed once.

## Highlights

- **Animated hive nodes** -- pulse animations driven by actual network activity
- **Reactive connections** -- edges glow and animate when entities interact
- **Floating particle system** -- `tsparticles` background layer for ambient motion
- **Reactive gradient backgrounds** -- color shifts respond to scroll position and active section
- **Motion everywhere** -- Framer Motion-driven hover, page-transition, and entrance animations
- **Radix-based primitives** -- accessible dialogs, dropdowns, tabs, tooltips, scroll-areas
- **Dark-first design** -- tuned for OLED panels and ambient lighting

## Tech stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.x |
| Styling | Tailwind CSS 3.x with custom theme |
| Components | Radix UI (avatar, dropdown, progress, tabs, tooltip, scroll-area, separator, slot) |
| Animation | Framer Motion + `tsparticles` |
| Icons | Lucide React |
| Deploy target | Vercel |

## Quick Start

```bash
git clone https://github.com/ZUES-ops-dot/thehiveai.git
cd thehiveai
npm install
npm run dev
```

Open <http://localhost:3000>.

> Note: prefers-reduced-motion is not yet fully implemented.

### Build for production

```bash
npm run build
npm start
```

## Project structure

```
app/                Next.js App Router pages
components/         Hive node, connection edge, particle layer, UI primitives
lib/                Network layout helpers, animation easing curves
public/             Static assets, hero imagery
styles/             Global CSS + Tailwind config
```

## Roadmap

See [Issues](https://github.com/ZUES-ops-dot/thehiveai/issues) -- real-time on-chain data binding, mobile gesture support, configurable hive themes, accessibility polish for reduced-motion preferences.

## License

MIT -- see [LICENSE](LICENSE).
