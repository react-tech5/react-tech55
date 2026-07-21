# react.tech 🟢

A SaaS platform connecting clients with real commenters for authentic social media engagement.

## Deployment steps (GitHub → Supabase → Vercel)

### 1️⃣ GitHub
```bash
cd reacttech
git init
git add .
git commit -m "Initial commit"
```
Create a new repository on github.com (Private), then:
```bash
git remote add origin https://github.com/USERNAME/reacttech.git
git branch -M main
git push -u origin main
```

### 2️⃣ Supabase
1. Create a new project on supabase.com (choose a region close to your users).
2. Open **SQL Editor**, paste the full content of `supabase/schema.sql`, and click **Run**.
   This single file contains everything: all tables, business logic, duplicate-image detection,
   automatic client reporting, staff roles, SLA, referrals, and security policies.
3. Paste the full content of `supabase/auth-trigger.sql` and click **Run** — this makes sign-up
   on `/signup` automatically create the right profile (client or commenter) for each new user.
4. Go to **Authentication → URL Configuration** and set your **Site URL** to your live Vercel domain
   (needed so password-reset emails link back to the right place).
5. Go to **Storage** and create a new bucket named `screenshots`.
6. (Optional) Enable the `pg_cron` extension under Database → Extensions, then run the scheduling
   line found at the bottom of the SQL file to automate daily checks.
7. From **Project Settings → API**, copy and save:
   - Project URL
   - anon public key

### 3️⃣ Vercel
1. Go to vercel.com → **Add New Project** → select your GitHub repository.
2. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OWNER_ACCESS_CODE` → set this to your own private password (this is what protects your admin/revenue dashboard — never share it, never commit it to GitHub)
   - `SUPABASE_SERVICE_ROLE_KEY` → **required** for the admin dashboard to show real data. Get it from Supabase → Settings → API Keys → "Secret keys" section (starts with `sb_secret_...`). This key is powerful — it is only ever used server-side inside `/api/admin/*` routes, never sent to the browser.
3. Click **Deploy** — your site goes live in about a minute.

### 🔐 Accessing your private admin dashboard
Go to `yoursite.com/owner-access` and enter the code you set as `OWNER_ACCESS_CODE`.
This unlocks `/dashboard/admin` — a fully Arabic dashboard showing **real, live data** pulled
directly from your database: registered clients, commenters, exact payouts, and full history
with dates for each one (click "التفاصيل" on any row). Without the correct code, that page
redirects away automatically. A small, unlabeled link to this page also sits in the homepage footer.

### 👤 Client & commenter accounts
- New users sign up at `/signup` (choosing "client" or "commenter")
- They sign in at `/login`
- If they forget their password: `/forgot-password` → they get an email with a reset link →
  clicking it takes them to `/reset-password` to set a new one
- This all runs on Supabase's built-in email service (Auth), no extra setup needed beyond
  step 4 above (Site URL)

## Run locally
```bash
npm install
cp .env.example .env.local   # then fill in your keys
npm run dev
```

## Pricing summary

| Client plan | Price | Comments |
|---|---|---|
| Starter | $149/mo | 100 |
| Growth | $370/mo | 300 |
| Pro | $730/mo | 600 |

| Commenter plan | Price | Commission/comment |
|---|---|---|
| Starter | $19/mo | $0.20 |
| Pro | $35/mo | $0.40 |
| Elite | $69/mo | $0.60 |

Flat fees: $6 withdrawal processing (min. $30 withdrawal) · $17 plan upgrade · $0.50 fast delivery · $0.30 custom keywords

Note: prices are grossed up ~11% above the base amount to absorb PayPal's processing and currency-conversion fees, so your net payout always lands where intended regardless of payment method.
