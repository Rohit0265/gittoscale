# GitToScale — Supabase Setup & Deployment Guide

This guide walks through configuring Supabase Authentication and managed PostgreSQL for GitToScale, applying migrations, running locally, and deploying to production.

---

## 1. Create a Supabase Project

1. Go to [database.new](https://database.new) or log in to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New project**.
3. Set your project details:
   - **Name**: `gitoscale` (or your preferred name)
   - **Database Password**: Generate a secure password and save it safely.
   - **Region**: Choose a region close to your primary users or backend deployment.
4. Click **Create new project** and wait ~2 minutes for provisioning to complete.

---

## 2. Configure Authentication in Supabase

1. In your project dashboard, navigate to **Authentication** -> **Providers** -> **Email**.
2. Ensure **Enable Email provider** is turned **ON**.
3. (Optional) For initial development, you can toggle **Confirm email** off to test immediately without verifying inbox links, or leave it on for production verification.
4. Go to **Authentication** -> **URL Configuration**:
   - **Site URL**:
     - Local development: `http://localhost:5173`
     - Production: `https://app.gittoscale.tech`
   - **Redirect URLs** (Add each of the following):
     - `http://localhost:5173/**`
     - `http://localhost:5173/auth/callback`
     - `https://app.gittoscale.tech/**`
     - `https://app.gittoscale.tech/auth/callback`
     - `https://gittoscale.tech/**`

---

## 3. Apply the Database Migration

You can apply the migration via the Supabase Dashboard SQL Editor or via the Supabase CLI.

### Option A: Using the Supabase Dashboard SQL Editor (Fastest)

1. Navigate to **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open [`supabase/migrations/20261028000000_auth_and_history.sql`](./supabase/migrations/20261028000000_auth_and_history.sql) in this repository and copy its entire contents.
4. Paste the SQL into the Supabase SQL Editor and click **Run** (or `Cmd/Ctrl + Enter`).
5. Verify output shows `Success. No rows returned`.

### Option B: Using the Supabase CLI

```bash
# Link your local project to Supabase
npx supabase link --project-ref your-project-id

# Push migrations to remote database
npx supabase db push
```

### What this migration creates:
- **`public.profiles`**: Stores user identity, full name, email, avatar URL. Automatically synced via a trigger on `auth.users`.
- **`public.architecture_history`**: Stores prompt, title, generation configuration, architecture nodes/edges JSONB, execution status, and timestamps.
- **`public.repository_history`**: Stores imported GitHub repository URL, owner, repo name, metadata, code scan results, and architecture graph JSONB.
- **Row-Level Security (RLS)**: Strictly limits queries to `auth.uid() = user_id`, completely preventing cross-tenant data leaks.
- **Updated_at Triggers**: Auto-updates timestamps on record updates.

---

## 4. Retrieve API Credentials

In the Supabase Dashboard, go to **Project Settings** (gear icon) -> **API**:
1. Copy **Project URL** (e.g. `https://xyzabc.supabase.co`).
2. Under **Project API keys**:
   - Copy the **`anon` `public`** key (used by frontend and backend token verification).
   - Copy the **`service_role` `secret`** key (keep confidential, used by backend server operations).

---

## 5. Configure Local Environment Variables

Create `.env` in the root (or populate `frontend/.env` and `backend/.env`):

### Frontend (`frontend/.env`):
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Optional: if backend is hosted separately
# VITE_API_URL=http://localhost:3000
```

### Backend (`backend/.env`):
```bash
PORT=3000
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI Provider Configuration
LLM_PROVIDER=gemini
LLM_MODEL=gemini-3.1-flash-lite
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 6. Run the Application Locally

```bash
# Install dependencies
npm install

# Build backend and frontend
npm run build --workspace=backend
npm run build --workspace=frontend

# Start development servers
npm run dev
```

The frontend will run at `http://localhost:5173` and the backend at `http://localhost:3000`.

---

## 7. Verifying End-to-End Authentication & Workflows

### 1. Route Protection & Signup Redirect
- Visit `http://localhost:5173/app` or `http://localhost:5173/history` without logging in.
- Verify you are redirected to `/signup?redirect=...`.
- Verify you can switch between `/signup` and `/signin`.

### 2. Resume Prompt Generation Workflow
- Return to the landing page `http://localhost:5173/` while unauthenticated.
- Enter a prompt (e.g. *"Microservices architecture for video streaming"*).
- Press Enter or click **GENERATE AI**.
- Verify you are redirected to `/signup` with a notification banner showing your pending prompt.
- Create an account or sign in.
- Verify the system immediately redirects to `/app`, generates the architecture, displays the canvas, and saves the result in `architecture_history`.

### 3. Resume GitHub Repository Import Workflow
- Open the landing page while unauthenticated.
- Click **Import GitHub Repo** and enter a repository (e.g. `https://github.com/facebook/react`).
- Click **Import & Scan**.
- Verify you are redirected to `/signup` with the pending repository banner.
- Sign up or log in.
- Verify the repository scan automatically resumes, displays the architecture graph, and saves to `repository_history`.

### 4. History Dashboard
- Click the **History** button in the header or visit `/history`.
- Verify tabs for **Prompt Architectures** and **GitHub Repositories**.
- Click **Open in Canvas** on any entry — verify it loads the exact nodes and edges in the simulator.
- Verify searching and status filtering.

### 5. Logo & Navigation Bug Fix
- In the playground (`/app`), click the **GitToScale** logo in the top-left corner.
- Verify the landing page appears AND the browser URL updates to `/`.
- Press browser **Back** — verify it returns to `/app`.
- Press browser **Forward** — verify it returns to `/`.

