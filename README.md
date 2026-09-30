# Vertex Management - Frontend (UI)

Next.js 15 (App Router) + TypeScript + Tailwind CSS v4. Standalone UI on **port 3000** that
talks to the backend API only through `NEXT_PUBLIC_API_URL`.

## Run

```bash
npm install
```

`.env.local` (already created):

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_CURRENCY=Rs
```

Start the backend first (port 5000), then:

```bash
npm run dev
```

Open http://localhost:3000 and sign in (admin@vertex.com / admin123).

## Pages

| Route | Admin | Teacher |
|-------|-------|---------|
| /dashboard | company overview, fee due list, partners | fee due list, own share, balance, students |
| /students, /students/new, /students/:id | manage students, record payments | view own students |
| /teachers, /teachers/:id | manage teachers, pay their share | own account page |
| /partners, /partners/:id | all fee-share partners, balances, payouts | - |
| /expenses | company running costs | - |
| /trading | trading income and its split | - |
| /loans | money taken from the company and paid back | - |
| /schedule, /schedule/:id | time grid, by-day and Availability views; add classes, assign students | own classes with student contact numbers |
| /payments | all fee payments | own students' payments |
| /payouts | pay teachers, history | own payouts |
| /subjects | manage courses | - |
| /finance | company account | - |
| /settings | change password, edit class time slots | change password |

## Structure

```
src/lib/api.ts             the only file that calls the backend (base URL from env)
src/lib/auth-context.tsx   login state (token in localStorage)
src/lib/types.ts           API response types
src/app/login              sign in
src/app/(dashboard)/       all authenticated pages + sidebar layout
src/components/ui          buttons, inputs, cards, tables, dialogs
src/components/students    student form, payment dialog, tables
src/components/teachers    teacher form, payout dialog, earnings summary
src/components/charts      monthly bar chart
```

## Note

`npm run dev` and `npm run build` both write to the `.next` folder. Do not run a build while the dev
server is running; if pages start returning 500 errors, stop the dev server, delete `.next`, and start it again.

## Deploy on Vercel

Live: https://vertexmanagement.vercel.app (backend: https://vertex-management-backend.vercel.app)

- Framework preset: Next.js (auto). Root directory: this repo.
- Environment variable: `NEXT_PUBLIC_API_URL=https://vertex-management-backend.vercel.app/api`
  (`.env.production` already carries this default; the Vercel setting wins if both exist).
- The backend must list the frontend origin in its `CORS_ORIGIN`.
- After changing the API URL, redeploy: it is baked into the build.

## Production build elsewhere

```bash
npm run build
```

```bash
npm start
```
