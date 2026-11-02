# HausJo Soundbox App

Merchant onboarding web app for **hausjo.co.id**: Soundbox QRIS and QRIS signup in 3 steps, the merchant app home (bank account, Soundbox order, SN scan) and the admin back-office (review, bank routing, QRIS sticker, Sheet QRIS export).

Spec: "HausJo Web App v1 Spec" (Claude doc). Prototype: "HausJo Onboarding Prototype" canvas.

## Stack

- Next.js 15 (App Router, TypeScript), one codebase for site, merchant app, admin and API
- PostgreSQL 16 via Prisma
- Private file storage on a Docker volume (`/data/uploads`) for KTP, selfie, store photos and QRIS stickers
- Email through SMTP (Gmail App Password for beta)
- Caddy for HTTPS on `beta.hausjo.co.id`

## How it is built and deployed

1. Every push to `main` runs **.github/workflows/build.yml**, which builds the Docker image (this is also the type check) and publishes it to `ghcr.io/andrewwilliamlie/hausjo-soundbox-app`.
2. The Hostinger VPS (KVM 2, Jakarta) runs `docker-compose.yml` with Docker Manager: database, app and Caddy.
3. Secrets (`DB_PASSWORD`, `SESSION_SECRET`, `SMTP_PASS`, `INITIAL_ADMIN_PASSWORD`, …) are set as environment variables of the Docker project on the server, never committed. See `.env.example`.

## Local development

```bash
cp .env.example .env   # fill in values
npm install
npx prisma db push
npm run dev
```
