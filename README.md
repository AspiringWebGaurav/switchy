# Switchy

Real-time mode control for your websites and applications. Switch between live, maintenance, and custom modes instantly — no code changes, no redeployments.

## What is Switchy?

Switchy is a SaaS platform that gives you a remote control for your app's behavior. Create a project, set a mode, and your app checks with Switchy on every load to know how to behave.

**Key features:**
- One-click mode switching (Live / Maintenance / Custom)
- Works with any tech stack — React, Vue, plain HTML, mobile
- Sub-100ms response time with Redis caching
- Rate-limited and production-ready
- Embeddable script or direct API integration

## Tech Stack

- **Next.js 16** — App Router, Turbopack, React Compiler
- **Firebase** — Authentication (Google) + Firestore
- **Upstash Redis** — Rate limiting + decision caching
- **Tailwind CSS v4** — Styling
- **Framer Motion** — Animations
- **Zod** — Validation

## Getting Started

```bash
# 1. Clone and install
git clone https://github.com/your-username/switchy.git
cd switchy
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Fill in your Firebase and Upstash Redis credentials

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to get started.

## Project Structure

```
src/
├── app/              # Pages + API routes (App Router)
│   ├── api/v1/       # REST API (auth, projects, policy, decide)
│   ├── docs/         # Documentation page
│   ├── (auth)/       # Login page
│   └── (dashboard)/  # Dashboard + project control center
├── components/       # UI components
│   ├── shared/       # Navbar, Logo, Providers, Modals
│   ├── landing/      # Landing page hero
│   ├── dashboard/    # Project cards, create modal
│   └── project/      # Mode toggle, custom config, integration panel
├── lib/              # Core logic
│   ├── firebase/     # Client + Admin SDK
│   ├── redis/        # Upstash Redis client
│   ├── services/     # Auth, Project, Policy, Decision services
│   ├── validators/   # Zod schemas
│   └── utils/        # Keys, response helpers, rate limiting
├── hooks/            # useAuth hook
├── config/           # Constants + default policies
└── types/            # TypeScript interfaces
```

## Modes

| Mode | Behavior |
|------|----------|
| **Live** | App runs normally. Default for new projects. |
| **Maintenance** | Shows a maintenance overlay to all visitors. |
| **Custom** | Configurable message, button text, and redirect URL. |

## Integration

### Script Tag (Easiest)

Add to your HTML:

```html
<script src="https://your-domain.com/switchy.js?key=YOUR_KEY&project=YOUR_PROJECT_ID"></script>
```

### API (Full Control)

```
GET /api/v1/decide?projectId=YOUR_PROJECT_ID&key=YOUR_KEY
```

Response:

```json
{
  "status": "ok",
  "data": {
    "mode": "maintenance",
    "message": "We're updating things. Back soon!",
    "buttonText": "Go Home",
    "redirect": "https://example.com"
  }
}
```

## Environment Variables

See `.env.example` for the full list:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase Client SDK config |
| `FIREBASE_*` | Firebase Admin SDK (server-only) |
| `UPSTASH_REDIS_*` | Upstash Redis REST credentials |
| `NEXT_PUBLIC_APP_URL` | Your app's base URL |

## License

This is proprietary software. All rights reserved. See [LICENSE](./LICENSE) for details.
