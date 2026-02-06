# Put it on my tab

Track tabs. Split bills. Stay friends. A bill-splitting app for groups.

## Tech stack

- **Frontend:** React, Vite, TypeScript, React Router
- **Backend:** Express, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** JWT (optional login; guest mode supported)

## Prerequisites

- Node.js 18+
- PostgreSQL

## Setup

1. Clone and install dependencies:
  ```bash
   npm install
   cd client && npm install && cd ..
   cd server && npm install && cd ..
  ```
2. Create `server/.env`:
  ```
   DATABASE_URL="postgresql://joyce:password@localhost:5432/mytab_app"
   JWT_SECRET="your-secret-key"
   COOKIE_SECRET="your-cookie-secret"
  ```
   Adjust `DATABASE_URL` for your PostgreSQL user and database.
3. For receipt scanning, add `google-credentials.json` to `server/` (see [Google Cloud Vision](https://cloud.google.com/vision/docs/setup)).
4. Run migrations:
  ```bash
   cd server
   npx prisma migrate dev
  ```

## Development

Run both client and server (use two terminals):

```bash
# Terminal 1 – frontend (Vite dev server on http://localhost:5173)
cd client && npm run dev

# Terminal 2 – backend (API on http://localhost:3000)
cd server && npm run dev
```

### Database

Connect to the database:

```bash
psql -U joyce -h localhost -d mytab_app
```

Prisma Studio (browse data):

```bash
cd server && npx prisma studio
```

### Schema changes

```bash
cd server
npx prisma migrate dev --name migration_name
npx prisma generate
```

Hard reset (development only):

```bash
npx prisma migrate reset
```

## Deployment

### Frontend (Vercel)

- Set **Root Directory** to `client`
- Add env var: `VITE_API_URL` = your backend URL (e.g. `https://yourapp.railway.app`)

### Backend + database (Railway or Render)

**1. Create a PostgreSQL database**

- **Railway:** New Project → Add PostgreSQL. Copy the `DATABASE_URL`.
- **Render:** New → PostgreSQL. Copy the Internal Database URL (or External for Railway).

**2. Deploy the backend**

- **Railway:** New Project → Add service → Deploy from GitHub. Set **Root Directory** to `server`. Add env vars:
  - `DATABASE_URL` (from step 1)
  - `JWT_SECRET` (random string)
  - `COOKIE_SECRET` (random string)
  - `FRONTEND_URL` = your Vercel URL (e.g. `https://yourapp.vercel.app`)
- **Render:** New → Web Service → Connect repo. Root Directory: `server`. Build: `npm run build`. Start: `npm start`. Add the same env vars.

**3. Run migrations**

```bash
cd server
DATABASE_URL="your-production-database-url" npx prisma migrate deploy
```

**4. Update frontend**

- In Vercel, set `VITE_API_URL` to your backend URL. Redeploy the frontend.

## Features

- Create and join groups via invite link
- Add expenses with even, amount-based, or percentage splits
- View balances and settlements
- Optional login for cross-device sync; guest mode supported
- Export expenses to Excel

## Roadmap

- **Balance tab:** Click on user to see all expenses and settlements
- **Expense tab:** View full expense details (split amounts, date, etc.)
- **Edit expenses**
- **Search bar**
- **Itemized breakdown**

