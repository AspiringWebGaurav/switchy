# Switchyy

Real-time mode control for websites and applications. Switch between live, maintenance, and custom modes instantly — no code changes, no redeployments.

## About

Switchyy is a SaaS platform that provides remote control for your app's behavior. Create a project, set a mode, and your app checks with Switchyy on every load to know how to behave.

### Features

- **One-click mode switching** — Live, Maintenance, Custom, and 20+ preset modes
- **Universal compatibility** — Works with React, Vue, Next.js, Nuxt, Svelte, Astro, Angular, plain HTML
- **Real-time updates** — SSE-powered instant mode changes across all connected clients
- **Sub-100ms response** — Redis-cached decisions for lightning-fast responses
- **Smart search** — Fuzzy framework matching with Trie-based autocomplete
- **Beautiful overlays** — Customizable maintenance pages with blur effects

### Supported Modes

| Mode | Description |
|------|-------------|
| Live | App runs normally (default) |
| Maintenance | Shows maintenance overlay |
| Custom | Configurable message, button, redirect |
| Coming Soon | Pre-launch landing |
| Beta | Beta access mode |
| Incident | Service disruption notice |
| + 15 more | Holiday, Vacation, Deploying, etc. |

### Tech Stack

- Next.js 16 (App Router, Turbopack)
- Firebase (Auth + Firestore)
- Upstash Redis
- Tailwind CSS v4
- Framer Motion

---

## ⚠️ Proprietary Software

**This repository is for reference only.**

Unauthorized copying, modification, distribution, or use of this software is strictly prohibited under the terms of the [LICENSE](./LICENSE).

### Prohibited Actions

- ❌ Cloning or forking for personal/commercial use
- ❌ Self-hosting or deploying your own instance
- ❌ Copying code or architecture
- ❌ Reverse engineering

### Permitted

- ✅ Viewing code for educational reference
- ✅ Using the official hosted service (when available)

---

© 2024-2026 Switchyy. All rights reserved.
