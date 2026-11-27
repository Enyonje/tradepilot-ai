# TradePilot AI

Global-first agentic commerce research and operations platform starter.

TradePilot is an independent application. It has its own frontend, API, database, AI gateway and deployment configuration. It has no Nexus Core dependency.

## Current foundation

- React + Vite + TypeScript premium commerce dashboard
- Express + TypeScript API
- OpenAI → Gemini → Groq provider fallback gateway
- Provider health and usage metadata endpoints
- Deterministic profit and ROI calculator
- Initial agent registry and product opportunity API
- PostgreSQL / Prisma data model
- Docker Compose for PostgreSQL and Redis
- Global-market primitives: ISO currency, country, marketplace and shipping fields

This is a working foundation, not a finished commerce business. Marketplace credentials, supplier contracts, tax rules, shipping rates and store permissions must be configured before live commerce actions.

## Requirements

- Node.js 20+
- npm 10+
- Docker Desktop (recommended for PostgreSQL and Redis)

## Setup

```bash
cp .env.example .env
docker compose up -d
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Frontend: http://localhost:5173  
API health: http://localhost:4000/api/health

If you are on Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

## AI failover

Set one or more provider keys in `.env`. The default order is OpenAI, Gemini, then Groq. If a provider is unconfigured, unavailable, rate-limited, or times out, the gateway tries the next configured provider. Authentication and invalid-request errors are treated as permanent for that provider and are logged before trying the next provider. Provider failures are returned in normalized metadata.

Never expose provider keys in frontend environment variables. Only `VITE_` variables are bundled into the browser.

## Global commerce design

Product and opportunity records include target country, currency, marketplace and estimated landed cost. Do not assume one fee schedule or tax rate works globally. Before live listings or purchases, implement country- and marketplace-specific fee, tax, customs, shipping and consumer-protection rules.

## API routes

- `GET /api/health`
- `GET /api/ai/providers`
- `POST /api/ai/chat`
- `POST /api/profit/calculate`
- `GET /api/agents`
- `GET /api/markets`
- `GET /api/opportunities?country=US&status=DISCOVERED`
- `POST /api/discovery/import` — import up to 100 normalized candidate records
- `GET /api/suppliers?country=US`
- `POST /api/suppliers`
- `PATCH /api/suppliers/:id/verification`


## Important safety defaults

- No autonomous purchasing in this starter.
- No automatic publishing to marketplaces.
- Product opportunities are research records, not verified investment advice.
- Discovery import currently accepts normalized records; marketplace/supplier feed connectors are the next integration step.
- Supplier verification is a manual review flag, not independent proof of supplier legitimacy.
- Profit estimates are only as accurate as the fees, shipping, tax, returns and currency data supplied.
- Add human approval, per-order spend caps, idempotency and audit logs before enabling financial actions.

## Next build milestones

1. Real product-data connectors and supplier catalog ingestion.
2. Historical sold-price and demand evidence.
3. Country / marketplace fee and landed-cost engines.
4. Supplier verification and compliance workflows.
5. Draft listings and store connectors.
6. Order routing and fulfillment with approval controls.
7. Authentication and tenant isolation.
8. End-to-end integration tests.

## Commerce research connectors (new)

Optional server-side connectors are available for CJdropshipping product search, Google Trends via SerpApi, and eBay sold comps via Trawl. See `docs/commerce-connectors.md` for environment variables, endpoints, evidence caveats and provider documentation. `GET /api/integrations` reports credential configuration. A configured key is not proof of provider account health. No connector places orders or publishes listings.
