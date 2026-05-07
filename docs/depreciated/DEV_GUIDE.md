# 🚀 Local Development Guide (Infrastructure-Only)

This project is configured to run **databases and infrastructure in Docker**, while the **application services run locally** on your host machine. This provides the best balance of stability and fast hot-reloading.

## 🏁 Quick Start

### 1. Start Infrastructure

Start the databases and Redis via Docker Compose:

```powershell
npm run docker:up:infra
```

### 2. Initialize Data (One-Time Setup)

Synchronize all database schemas and populate them with synthetic seed data:

```powershell
# Sync schemas + Run seeds
npx nx run-many -t prisma:push --all && npm run seed:synthetic:all
```

### 3. Start Applications (Development Mode)

Run all microservices and the API Gateway with hot-reloading:

```powershell
npm run dev:all
```

---

## 🏗️ Production Mode (Local Host)

If you want to run the services in production mode locally (without hot-reloading):

### Start All Backend Services

Runs all microservices and the API Gateway using production configurations:

```powershell
npm run start:prod:backend
```

### Start Frontend (Web)

Runs the Next.js frontend in production mode:

```powershell
npm run start:prod:web
```

---

## 🛠️ Common Commands

| Task             | Command                                           |
| :--------------- | :------------------------------------------------ |
| **Start DBs**    | `npm run docker:up:infra`                         |
| **Stop DBs**     | `npm run docker:down`                             |
| **Reset Data**   | `npm run seed:synthetic:all`                      |
| **Sync Schemas** | `npx nx run-many -t prisma:push --all`            |
| **Clean Docker** | `npm run docker:clean` (Deletes all volumes/data) |

## 📝 Configuration Note

- **Environment Variables**: Local `.env` files in each `apps/*` folder are pre-configured to point to `localhost`.
- **Port Mapping (Host Local vs Docker)**:
  - **API Gateway**: `3000` (When running locally) vs `4000` (When running in Docker).
    - _Note: Since you are running locally for hot-reload, always use port `3000`._
  - **Web (Frontend)**: `4200`
  - **Microservices**: `3001-3004`
  - **Postgres DBs**: `5435-5438` (Mapped from Docker to localhost)

## 🌐 Web App Connectivity

I have updated `apps/web/.env` to point to `http://localhost:3000/api/v1`. If you switch back to running everything via `docker compose up` (full stack in Docker), you will need to update the `web` environment variables to use port `4000`.
