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

## Cadangan & pemulihan

- The app dumps the database every day around 02:00 WIB (`pg_dump --format=custom`) to `/data/uploads/.backups` on the `uploads` volume and keeps the newest 14. An ADMIN can run one by hand and download dumps or a `.tar.gz` of all photos at **/admin/cadangan**. Download both weekly and keep them in a restricted company Drive folder: they contain merchant personal data.
- Hostinger VPS backups/snapshots cover the whole server as a second layer.

Restore a database dump (overwrites current data), from the VPS terminal:

```sh
docker cp hausjo-db-YYYYMMDD-HHMM.dump hausjo-db-1:/tmp/restore.dump
docker exec hausjo-db-1 pg_restore -U hausjo -d hausjo --clean --if-exists --no-owner /tmp/restore.dump
```

Restore photos: `docker cp` the archive into `hausjo-app-1` and extract it into `/data/uploads` with `tar -xzf`.

## Admin accounts

The first admin comes from `INITIAL_ADMIN_EMAIL`/`INITIAL_ADMIN_PASSWORD`. Everyone else is added at **/admin/tim** (ADMIN role) and gets a one-time temporary password by email and on screen; they must set their own on first login. Roles: Pemeriksa (review), Aktivasi & pengiriman (bank IDs, sticker, shipping), Admin (everything + team + backups).

## Region dropdowns

`public/wilayah/` holds province → kota/kabupaten → kecamatan → kelurahan/desa lists with postal codes (38 provinces, 514 cities, 7,285 districts, 83,762 villages; Kepmendagri 2025, MIT-licensed data by cahyadsn). To refresh after a new decree, clone `cahyadsn/wilayah` and `cahyadsn/wilayah_kodepos` and run
`python3 scripts/build-wilayah.py <wilayah>/db/wilayah.sql <wilayah_kodepos>/json/wilayah_kodepos.min.json public/wilayah`.

## KTP OCR (Google Cloud Vision)

Set `OCR_PROVIDER=google` and `OCR_API_KEY` (API key restricted to the Cloud Vision API) in the Docker project's environment. On upload of the e-KTP photo during signup, `src/lib/ocr.ts` calls Vision `DOCUMENT_TEXT_DETECTION` and `src/lib/ktp-parse.ts` reads NIK, nama, tempat/tgl lahir, jenis kelamin, alamat (with RT/RW, kel., kec., city), agama and pekerjaan from the word positions. Any error or timeout falls back to manual typing. Confidence below 90 or a merchant edit is flagged to reviewers. Photos are shrunk to 1600 px in the browser before upload.
