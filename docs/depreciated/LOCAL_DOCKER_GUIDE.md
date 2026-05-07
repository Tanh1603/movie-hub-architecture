# 🐳 Local Docker Development Guide

This guide explains how to run MovieHub locally using Docker.

## 📋 Prerequisites

1. **Docker Desktop** installed and running
2. **Node.js 20+** and npm (for frontend development)

---

## 🚀 Quick Start

### Step 1: Start Backend (Docker)

```bash
docker compose up -d
```

This automatically uses `docker-compose.yml` + `docker-compose.override.yml` and:

- ✅ Starts all databases (PostgreSQL × 4, Redis)
- ✅ Builds and starts all backend services
- ✅ **Runs database migrations and synthetic seeds automatically**

### Step 2: Start Frontend (Native with hot reload)

In a **new terminal**:

```bash
npm run dev:web
# or: npx nx serve web
```

---

## 🌐 Access Points

| Service          | URL                            |
| ---------------- | ------------------------------ |
| **Frontend**     | http://localhost:4200          |
| **API Gateway**  | http://localhost:4000/api      |
| **Swagger Docs** | http://localhost:4000/api/docs |

---

## 📦 Commands

```bash
# Start backend
docker compose up -d

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f api-gateway
docker compose logs -f movie-service

# Rebuild after code changes
docker compose up -d --build

# Stop services
docker compose down

# Stop and remove all data (fresh start)
docker compose down -v
```

---

## 🌱 Synthetic Seed Data

The Docker setup uses the extensive **synthetic seed data** from `synthetic_seed_data/` folder:

### Seed Execution Order

```
1. movie-service  → Creates ~50 movies, genres, releases
        ↓
2. cinema-service → Creates cinemas, halls, seats, showtimes (needs movies)
        ↓
3. booking-service → Creates bookings, tickets, payments (needs showtimes)
```

### Generated Data Summary

| Service     | Data Created                                                   |
| ----------- | -------------------------------------------------------------- |
| **Movie**   | ~50 Movies, 18 Genres, MovieReleases                           |
| **Cinema**  | 2 Cinemas, 6 Halls, ~700 Seats, ~200 Showtimes                 |
| **Booking** | 600 Bookings, Tickets, Payments, Concessions, Loyalty accounts |
| **User**    | Roles, Permissions, Staff (uses service-level seed)            |

### Booking Data Distribution

- 70% Completed
- 20% Pending
- 10% Cancelled

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (localhost:4200)                     │
│                    npm run dev:web (native)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DOCKER                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              API Gateway (localhost:4000)                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│         │              │              │              │           │
│         ▼              ▼              ▼              ▼           │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐      │
│  │  User    │   │  Movie   │   │  Cinema  │   │ Booking  │      │
│  │  :4001   │   │  :4002   │   │  :4003   │   │  :4004   │      │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘      │
│       │              │              │              │             │
│       ▼              ▼              ▼              ▼             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐      │
│  │ Postgres │   │ Postgres │   │ Postgres │   │ Postgres │      │
│  │  :5435   │   │  :5436   │   │  :5437   │   │  :5438   │      │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘      │
│                                                                  │
│                        Redis (:6379)                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Configuration Files

| File                          | Purpose                                    |
| ----------------------------- | ------------------------------------------ |
| `docker-compose.yml`          | Base configuration                         |
| `docker-compose.override.yml` | Dev overrides (synthetic seeding)          |
| `synthetic_seed_data/`        | Extensive test data                        |
| `apps/<service>/.env`         | Service configuration                      |
| `apps/web/.env`               | Frontend config (points to localhost:4000) |

---

## 📊 Direct Database Access

| Database | Port | Database Name     | Credentials       |
| -------- | ---- | ----------------- | ----------------- |
| User     | 5435 | movie_hub_user    | postgres/postgres |
| Movie    | 5436 | movie_hub_movie   | postgres/postgres |
| Cinema   | 5437 | movie_hub_cinema  | postgres/postgres |
| Booking  | 5438 | movie_hub_booking | postgres/postgres |

Example connection:

```
postgresql://postgres:postgres@localhost:5436/movie_hub_movie
```

---

## 🐛 Troubleshooting

### Seed errors / Foreign key constraints

The seeds have dependencies:

- `cinema-service` needs movies from `movie-service`
- `booking-service` needs showtimes from `cinema-service`

If you see errors, try:

```bash
docker compose down -v  # Remove all data
docker compose up -d    # Fresh start
```

### "No movies found" / "No showtimes found"

Wait for dependent services to complete seeding. Check logs:

```bash
docker compose logs -f movie-service
docker compose logs -f cinema-service
```

### Services fail health checks

The first build takes a long time. Check if services are still seeding:

```bash
docker compose logs -f booking-service
```

### Port conflicts

```bash
# Windows
netstat -ano | findstr :4000
```

---

## 📝 NPM Scripts

```bash
npm run docker:up        # docker compose up -d
npm run docker:up:build  # docker compose up -d --build
npm run docker:down      # docker compose down
npm run docker:logs      # docker compose logs -f
npm run docker:clean     # docker compose down -v
npm run dev:web          # nx serve web (frontend)
```
