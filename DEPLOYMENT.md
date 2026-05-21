# QuizFlow AI — Deployment & Azure Guide

This document describes how to ship QuizFlow-AI from local development to Azure: Git workflow, CI on `develop`, PostgreSQL, hosting the API and web app, and operational concerns (uploads, secrets, Stripe).

**Stack reference:** monorepo with `pnpm`, `apps/api` (Express + Prisma), `apps/web` (Next.js 14), local PostgreSQL **16** via `docker-compose.yml`.

---

## Table of contents

1. [Finish `main` and push](#1-finish-main-and-push)
2. [`develop` branch: tests + CI](#2-develop-branch-tests--ci)
3. [Azure PostgreSQL (Flexible Server)](#3-azure-postgresql-flexible-server)
4. [Deploy the API (`apps/api`)](#4-deploy-the-appsapi-to-azure)
5. [Deploy the Web (`apps/web`)](#5-deploy-the-appsweb-to-azure)
6. [File uploads and `UPLOAD_DIR`](#6-file-uploads-and-upload_dir)
7. [Post-deploy verification](#7-post-deploy-verification)
8. [Ongoing Git flow](#8-ongoing-git-flow)
9. [Local vs Azure for PostgreSQL](#9-local-vs-azure-for-postgresql)

---

## 1. Finish `main` and push

1. **Review changes**  
   From repo root: `git status`  
   Confirm only intended files; never commit real `.env` files or secrets.

2. **Run checks locally**  
   - `pnpm install` (if needed)  
   - `pnpm type-check`  
   - `pnpm build`  
   - `pnpm lint` (if configured)  
   Fix anything that fails.

3. **Commit**  
   ```bash
   git add -A
   git commit -m "Describe your change in one clear sentence."
   ```

4. **Push `main`**  
   ```bash
   git push origin main
   ```  
   If the remote branch is new: `git push -u origin main`.

5. **Tag (optional)**  
   ```bash
   git tag -a v0.1.0 -m "First deployable baseline"
   git push origin v0.1.0
   ```

---

## 2. `develop` branch: tests + CI

### 2.1 Create and use `develop`

```bash
git checkout main && git pull origin main
git checkout -b develop
git push -u origin develop
```

In GitHub:

- Protect **`main`** (require PR, optional reviews, required status checks).
- Optionally set **default branch** to `develop` for day-to-day work.

### 2.2 Recommended test stack

| Layer | Suggestion |
|--------|------------|
| **API unit** | Vitest (or Jest) — pure helpers, validation, small modules without DB. |
| **API integration** | Vitest + **supertest** against the real Express app; real Postgres in CI. |
| **Web** | Vitest + React Testing Library; E2E (Playwright) can be a separate workflow later. |

**Integration DB in CI:** GitHub Actions **service container** with **Postgres 16** (matches `docker-compose.yml`), or Testcontainers (heavier).

### 2.3 Suggested layout

- Unit: `apps/api/src/**/*.test.ts` or `apps/api/tests/unit/`
- Integration: `apps/api/tests/integration/`

**Root `package.json` (examples to add):**

```json
"test": "pnpm --filter @quizflow/api test",
"test:integration": "pnpm --filter @quizflow/api test:integration"
```

**`apps/api/package.json` (examples):**

```json
"test": "vitest run",
"test:watch": "vitest"
```

Install in `apps/api`: `vitest`, `@vitest/coverage-v8`, `supertest`, `@types/supertest` as needed.

**Local integration run:**

1. `docker compose up -d`  
2. Use a separate DB name (e.g. `quizflow_test`) in `DATABASE_URL`  
3. `pnpm --filter @quizflow/api exec prisma migrate deploy`  
4. Run integration tests; mock **OpenAI** so CI never burns credits.

### 2.4 `.github/workflows/develop-ci.yml`

Create this file on `develop` when tests exist. Goals: on `push` / `pull_request` to `develop` → install, type-check, migrate test DB, run tests.

```yaml
name: Develop CI

on:
  push:
    branches: [develop]
  pull_request:
    branches: [develop]

jobs:
  ci:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: quizflow_ci
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U postgres -d quizflow_ci"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 10

    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/quizflow_ci
      JWT_ACCESS_SECRET: ci-test-access-secret-at-least-32-characters-long
      JWT_REFRESH_SECRET: ci-test-refresh-secret-at-least-32-characters-long

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 8.15.4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - run: pnpm type-check

      - run: pnpm --filter @quizflow/api exec prisma migrate deploy

      # Enable when tests are wired:
      # - run: pnpm lint
      # - run: pnpm test
```

**Secrets:** Prefer GitHub **Actions variables** or **repository secrets** for `CI_DATABASE_URL` / JWT test strings instead of inline secrets if policy requires it.

**Branch protection:** On `develop`, require the **CI** check to pass before merge.

---

## 3. Azure PostgreSQL (Flexible Server)

Use **Azure Database for PostgreSQL – Flexible Server** for staging/production. Keep **Docker Compose Postgres** only on your machine for local dev.

### 3.1 Prerequisites

- Azure subscription with **Owner** or **Contributor** on a resource group.
- Pick a **region** (use the same for DB and apps for latency).
- Naming examples: `rg-quizflow-prod`, `psql-quizflow-prod`.

### 3.2 Resource group (Portal)

1. Azure Portal → **Resource groups** → **Create**.
2. Name (e.g. `rg-quizflow-prod`), region → **Review + create**.

### 3.3 Flexible Server (Portal)

1. **Create a resource** → **Azure Database for PostgreSQL** → **Flexible server**.
2. **Basics**
   - Subscription, resource group.
   - Server name: globally unique (e.g. `psql-quizflow-prod`).
   - Region: same as apps.
   - **PostgreSQL version: 16** (align with `postgres:16-alpine` in `docker-compose.yml`).
   - Workload: **Development** for first iteration, or **Production** for HA from day one.
   - Compute/storage: start small (e.g. Burstable B1ms/B2s), scale later.
3. **Authentication**
   - PostgreSQL authentication; admin user + **strong password** (store safely).
4. **Networking**
   - Early: public access + firewall rules is common.
   - Tighten later: **private endpoint** / VNet only; allow only app outbound IPs.
   - Optional: your current public IP for `psql` / Prisma from laptop.
5. **Review + create** and wait for completion.

### 3.4 Application database

Portal → server → **Databases** → create `quizflow` (or use SQL `CREATE DATABASE quizflow;`).

### 3.5 `DATABASE_URL` for Prisma

```text
postgresql://ADMIN_USER:URL_ENCODED_PASSWORD@HOST.postgres.database.azure.com:5432/quizflow?sslmode=require
```

- Use **`sslmode=require`** (or stricter) for Azure.
- URL-encode special characters in the password.

Test from your machine (firewall must allow your IP):

```bash
# Example: from repo root, temporarily set DATABASE_URL then:
pnpm --filter @quizflow/api exec prisma migrate deploy
```

### 3.6 Hardening (before real traffic)

- Restrict firewall; remove overly broad rules.
- Confirm **backup retention** on the server.
- Store `DATABASE_URL` in **Azure Key Vault** (or App Service settings), never in git.

---

## 4. Deploy the API (`apps/api`) to Azure

**Option A — Azure App Service (Linux, Node)** — straightforward without containerizing first.

### 4.1 Build and start (typical)

From monorepo root in deployment:

```bash
pnpm install --frozen-lockfile
pnpm --filter @quizflow/api build
```

Start command (verify path after `tsc` in `apps/api`):

```bash
node apps/api/dist/server.js
```

Use **Node 20.x** to match CI.

### 4.2 Create App Service (Portal)

1. **Create a resource** → **Web App** → **Publish: Code**, **Runtime: Node 20 LTS**, **Linux**.
2. Region aligned with Postgres; pick an **App Service plan** (e.g. small SKU to start).
3. **Deployment Center**: connect **GitHub** and branch (`main` or `develop`), or use your own workflow with `azure/webapps-deploy`.

### 4.3 Application settings (environment variables)

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Azure Postgres URL with `sslmode=require` |
| `NODE_ENV` | `production` |
| `PORT` | Often provided by platform (e.g. `8080`); server must read `process.env.PORT` |
| `API_URL` | Public HTTPS base of the API (used in QTI URLs, etc.) |
| `WEB_URL` | Public HTTPS origin of the Next.js app |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | New long random values for production |
| `OPENAI_API_KEY` | Production key when live |
| `STRIPE_*` | Test keys for staging; **live** keys only in production |
| `CORS_ORIGIN` | Exact web origin, e.g. `https://your-web.azurewebsites.net` |
| `UPLOAD_DIR` | See [§6 File uploads](#6-file-uploads-and-upload_dir) — default local path is not durable on App Service |

See also `apps/api/.env.example` for the full list used locally.

### 4.4 Stripe webhooks

Stripe Dashboard → Webhooks → endpoint URL on your API (match Express routes), set `STRIPE_WEBHOOK_SECRET` from the signing secret.

---

## 5. Deploy the Web (`apps/web`) to Azure

**Options:**

| Option | Notes |
|--------|--------|
| **Azure Static Web Apps** | Good for static / certain Next.js setups; verify Next.js 14 App Router support for your features. |
| **Azure App Service** (Node) | `pnpm --filter @quizflow/web build` + `next start` (or standalone output). |
| **Vercel** (web only) | Common pattern when API stays on Azure. |

**Web env (see `apps/web/.env.example`):**

- `NEXT_PUBLIC_API_URL` — must match how axios is configured (your client uses `baseURL: `${API_URL}/api`` — usually set to the API **origin** without `/api`, e.g. `https://quizflow-api.azurewebsites.net`).

Rebuild after changing `NEXT_PUBLIC_*` variables.

---

## 6. File uploads and `UPLOAD_DIR`

The API stores uploads and generated QTI under **`UPLOAD_DIR`** (default `./uploads` in `apps/api/.env.example`). On **Azure App Service**, the default filesystem is **ephemeral** unless you add persistent storage.

**Recommended approaches:**

1. **Azure Files** — mount a share (e.g. `/home/quizflow/uploads`) and set `UPLOAD_DIR` to that path; point `express.static` / QTI paths accordingly.
2. **Azure Blob Storage** — store blobs by key; larger code change but best for scale and multi-instance.

Until storage is persistent, **uploads and downloads can break** after restart or scale-out.

---

## 7. Post-deploy verification

1. Open API health or a simple route if you expose one.
2. From production web: **register**, **login**, **upload** a small PDF, **generate quiz**, **download QTI**.
3. Confirm **CORS** (browser network tab) if the web and API are on different origins.
4. **App Service → Log stream** (or Application Insights) for errors (SSL, env, 500s).
5. Stripe: use **test mode** on staging before switching live keys.

---

## 8. Ongoing Git flow

1. Branch from `develop`: `git checkout develop && git pull && git checkout -b feature/short-name`.
2. Open **PR → `develop`**; CI must pass.
3. Promote to production: **PR `develop` → `main`**, then deploy `main` (or use deployment slots: staging slot on `develop`, swap to production).
4. **Migrations:** run `prisma migrate deploy` against the target database as part of the release pipeline; prefer backward-compatible migrations for zero-downtime.

---

## 9. Local vs Azure for PostgreSQL

| Environment | PostgreSQL |
|---------------|------------|
| **Local dev** | **Docker Compose** (`docker-compose.yml`, Postgres 16) — keep as-is. |
| **Azure staging / production** | **Azure Database for PostgreSQL Flexible Server** (same major version when possible). |
| **Postgres inside Docker on Azure** | Possible for experiments; you own backups, HA, patching. **Not recommended** for production unless you have strong ops reasons. |

**Summary:** Docker locally for the database; **managed Flexible Server** in Azure for cloud databases. Docker on Azure is still fine for **running the API container** if you choose Container Apps / AKS — that is separate from where Postgres runs.

---

## Related repo commands

| Command | Purpose |
|---------|---------|
| `pnpm db:up` | Start local Postgres (`docker compose up -d`) |
| `pnpm db:down` | Stop local Postgres |
| `pnpm db:migrate` | `prisma migrate deploy` against `DATABASE_URL` |
| `pnpm db:seed` | Seed script (dev only) |

---

## Changelog

- Initial version: Git + `develop` CI template + Azure Postgres + App Service notes + uploads warning.
