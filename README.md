# Put it on my tab

Track tabs. Split bills. Stay friends. A bill-splitting app for groups.

**[Live app](mytabapp.vercel.app)**

## Tech stack

- **Frontend:** React, Vite, TypeScript, React Router (deployed on Vercel)
- **Backend:** Express, TypeScript (deployed on Railway/Render)
- **Database:** PostgreSQL with Prisma ORM (Neon, Railway, or Render)
- **Auth:** JWT with optional login; guest mode supported

## Features

- Create and join groups via invite link
- Add expenses with even, amount-based, or percentage splits
- View balances and settlements; click a member to see itemized breakdown
- Optional login for cross-device sync; guest mode supported
- Export expenses and balance breakdown to Excel

## Local development

### Prerequisites

- Node.js 18+
- PostgreSQL

### Setup

1. Clone and install dependencies:
  ```bash
   cd client && npm install && cd ..
   cd server && npm install && cd ..
  ```
2. Create `server/.env`:
  ```
   DATABASE_URL="postgresql://user:password@localhost:5432/mytab_app"
   JWT_SECRET="your-secret-key"
   COOKIE_SECRET="your-cookie-secret"
  ```
3. Run migrations:
  ```bash
   cd server
   npx prisma migrate dev
  ```

### Run

```bash
# Terminal 1 – frontend (http://localhost:5173)
cd client && npm run dev

# Terminal 2 – backend (http://localhost:3000)
cd server && npm run dev
```

### Database

```bash
# Connect
psql -U joyce -h localhost -d mytab_app

# Prisma Studio
cd server && npx prisma studio
```

### Schema changes

```bash
cd server
npx prisma migrate dev --name migration_name
npx prisma generate
```

## Deployment


| Component | Platform            | Root Dir | Key env vars                                                  |
| --------- | ------------------- | -------- | ------------------------------------------------------------- |
| Frontend  | Vercel              | `client` | `VITE_API_URL` (backend URL)                                  |
| Backend   | Railway/Render      | `server` | `DATABASE_URL`, `JWT_SECRET`, `COOKIE_SECRET`, `FRONTEND_URL` |
| Database  | Neon/Railway/Render | —        | —                                                             |


**Backend build:** `npm run build` · **Start:** `npm start`

**Migrations (production):**

```bash
cd server
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

Use **internal** DB URL when backend and DB are on the same platform; use **public** when they’re on different platforms or when running migrations from your machine.

## Roadmap

- Edit expenses
- Search bar
- Itemized breakdown enhancements

