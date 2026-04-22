# MMS — План реалізації до MVP

> Синхронізовано з ТЗ v2.1 (2026-04-20). Дата складання плану: 2026-04-21.
> ТЗ: `C:\Users\user\Downloads\TZ_Maintenance_System.md`

Робота поділена на **два послідовні етапи**:
1. **Етап А — Бекенд** (цей репо `mms-backend-ai`), далі
2. **Етап Б — Фронтенд** (новий репо `mms-frontend-ai`, створюється перед стартом Б).

---

## ЕТАП А — Бекенд (`mms-backend-ai`)

| # | Задача | Оцінка | Залежить від |
|---|--------|--------|--------------|
| A1 | ✅ **Comment model + API** | — | — (зроблено 2026-04-19) |
| A2 | **SystemSettings model + API** (singleton, admin) | 2 год | — |
| A3 | ✅ **AuditLog model + middleware + API** (TTL з SystemSettings, 2026-04-22 — інтеграції у контролери відкладено на A4-A8) | — | — |
| A4 | **Socket.io server** (JWT-handshake, кімнати, events `fault:*`) | 0.5-1 день | — |
| A5 | **Cron**: `IN_RITARDO` (кожні 5 хв) + реплан (00:30) | 0.5 дня | A2 |
| A6 | **Email-сервіс** (nodemailer + Handlebars + тригери) | 0.5 дня | A2 |
| A7 | **Seed-скрипт** + **docker-compose** (Mongo + MailHog) | 0.5 дня | A6 |
| A8 | **Message model + API** + socket events + email для direct | 1 день | A4, A6 |
| A9 | **Backend тести** (Vitest + supertest + mongodb-memory-server, ≥70%) | 1.5-2 дні | A1-A8 |

**Разом бек:** ≈ 6-7 робочих днів

---

## ЕТАП Б — Фронтенд (`mms-frontend-ai`)

| # | Задача | Оцінка | Залежить від |
|---|--------|--------|--------------|
| B0 | **Форк** `sistema_di_manutenzione-frontend` → `mms-frontend-ai` з чистою git-історією | 1 год | — |
| B1 | **WebSocket-клієнт** (`lib/socket.ts` + hook + інтеграція з TanStack Query) | 0.5 дня | A4 |
| B2 | **Safety page** (`/safety`) — коментарі UI + real-time | 0.5 дня | A1, B1 |
| B3 | **Admin pages**: `/admin/system-settings`, `/admin/logs-audit`, верифікація `/admin/{users,plants,notifications}` | 1 день | A2, A3 |
| B4 | **Manager page** (`/manager`) — 3 вкладки, фільтри, real-time, підсвітка `IN_RITARDO`, CSV-експорт | 1.5 дня | A4, B1 |
| B5 | **Maintenance-worker** — календар, слот-грід, модалка, `Prendi in carico` race-guard | 1.5 дня | A2, B1 |
| B6 | **Operator page** (`/operator`) — верифікація autosave, чистка toast'ів | 0.5 дня | — |
| B7 | **Messaging UI** — `/inbox`, `/inbox/[userId]`, `/announcements`, бейдж непрочитаних | 1.5 дня | A8, B1 |
| B8 | **Frontend E2E** (Playwright) — основний флоу + Messaging | 1 день | B1-B7 |

**Разом фронт:** ≈ 7-8 робочих днів

---

## Разом MVP: ≈ 13-15 робочих днів

### Контрольні точки (демо + узгодження)
- після **A4** — бек-ядро real-time готове
- після **A8** — увесь бек готовий, Swagger повний, можна форкати фронт
- після **B3** — admin panel повністю працює
- після **B7** — фіча-комплектність
- після **B8** — MVP

### Post-MVP (нагадати після закриття MVP)
- **Вкладення файлів у `Message`** (фото/PDF) — підтверджено 2026-04-20 відкласти; реалізація за аналогією з `Fault.images` через Cloudinary.
