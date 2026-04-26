# MMS backend (`mms-backend-ai`)

Sistema di Manutenzione — backend (Express 5 + MongoDB + Socket.io).

## Quick start (dev)

Prereqs: Node 20+, Docker Desktop.

```bash
# 1. Install deps
npm install

# 2. Copy env template
cp .env.example .env   # then edit secrets if needed

# 3. Boot infra (Mongo + MailPit)
docker compose up -d

# 4. Seed demo data (idempotent — safe to re-run)
npm run seed

# 5. Run the API
npm run dev
```

Endpoints:

- API: <http://localhost:3030>
- Swagger: <http://localhost:3030/api-docs/>
- AdminJS: <http://localhost:3030/admin>
- MailPit UI (caught emails): <http://localhost:8025>

### Seeded credentials (dev only)

| Role               | Email                | Password / Code   |
| ------------------ | -------------------- | ----------------- |
| admin              | admin@mms.local      | `Password123!`    |
| manager            | manager@mms.local    | `Password123!`    |
| maintenanceWorker  | worker@mms.local     | `Password123!`    |
| safety             | safety@mms.local     | `Password123!`    |
| operator           | operator@mms.local   | code `OP00001`    |

`npm run seed` refuses to run when `NODE_ENV=production`.

### Useful commands

```bash
docker compose down       # stop containers (data persists)
docker compose down -v    # stop + wipe Mongo volume
docker compose logs -f    # tail logs
```

## Plan

See [`PLAN_MVP.md`](./PLAN_MVP.md) for the A1–A9 / B0–B8 roadmap.
