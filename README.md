# GitToScale 🚀

> **The Next-Generation Interactive Cloud Architecture Platform**  
> *AI-Powered Architecture Synthesis, Real-Time Distributed Traffic Simulation, GitHub Code-to-Diagram Scanning, and Live Team Collaboration.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![React Flow](https://img.shields.io/badge/React_Flow-12.0-ff0072?style=flat-square)](https://reactflow.dev/)
[![Express](https://img.shields.io/badge/Express-4.19-lightgrey?style=flat-square&logo=express)](https://expressjs.com/)
[![Neon PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-00e599?style=flat-square&logo=postgresql)](https://neon.tech/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![Yjs](https://img.shields.io/badge/CRDT-Yjs_WebSockets-ff7700?style=flat-square)](https://yjs.dev/)
[![Polar](https://img.shields.io/badge/Payments-Polar.sh-blueviolet?style=flat-square)](https://polar.sh/)
[![Vitest](https://img.shields.io/badge/Tests-Vitest_138_Passed-yellow?style=flat-square&logo=vitest)](https://vitest.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

---

## 📖 Table of Contents

1. [Overview](#-overview)
2. [Why GitToScale?](#-why-gittoscale)
3. [Key Features](#-key-features)
   - [1. Interactive Architecture Canvas & Traffic Simulation](#1-interactive-architecture-canvas--traffic-simulation)
   - [2. AI System Design Architect & Recommender](#2-ai-system-design-architect--recommender)
   - [3. GitHub Repository Code-to-Architecture Scanner](#3-github-repository-code-to-architecture-scanner)
   - [4. Real-Time Collaborative Design Meetings (Yjs + WebSockets)](#4-real-time-collaborative-design-meetings-yjs--websockets)
   - [5. Community Feed & Architecture Sharing](#5-community-feed--architecture-sharing)
   - [6. Polar Subscription & Monetization System](#6-polar-subscription--monetization-system)
   - [7. Telemetry, Admin Moderation & Notifications](#7-telemetry-admin-moderation--notifications)
4. [Mathematical Simulation Model](#-mathematical-simulation-model)
5. [System Architecture](#-system-architecture)
6. [Technology Stack](#-technology-stack)
7. [API Reference](#-api-reference)
8. [Environment Configuration](#-environment-configuration)
9. [Getting Started & Local Development](#-getting-started--local-development)
10. [Testing & Verification](#-testing--verification)
11. [License](#-license)

---

## 🌟 Overview

**GitToScale** is an end-to-end cloud architecture modeling, simulation, and collaboration platform designed for distributed systems engineers, software architects, engineering leaders, and DevOps professionals.

Unlike traditional static diagramming tools (such as Lucidchart, Visio, or Excalidraw) that represent systems as inert boxes and arrows, **GitToScale turns architecture diagrams into living, executable topological models**. It calculates request propagation, detects throughput bottlenecks, estimates latency degradation under varying load, automatically extracts architectures from GitHub repositories, leverages multi-tier AI LLMs for deep architectural synthesis, and facilitates live collaborative design sessions using conflict-free replicated data types (CRDTs).

---

## 💡 Why GitToScale?

| Traditional Diagramming Tools | GitToScale |
| :--- | :--- |
| **Static drawing canvases**: Boxes and arrows carry no runtime semantic meaning. | **Executable DAGs**: Every node possesses capacity, worker counts, base latency, and queue limits. |
| **Manual guesswork for capacity planning**: Spreadsheets and back-of-napkin calculations. | **Analytical traffic simulation**: Instantly simulates flash sales, query surges, and cascading failovers. |
| **Manual diagram creation from code**: Time-consuming manual reverse engineering. | **Automated GitHub repository scanning**: Analyzes Docker, K8s, package manifests, and code dependencies to generate topologies. |
| **Isolated review meetings**: Screen-sharing drawings over video calls. | **Live collaborative design rooms**: Low-latency Yjs presence, cursor tracking, role control (Host/Editor/Viewer), and canvas locking. |
| **Generic design notes**: Non-standard documentation. | **7-Phase AI System Design Architect**: Produces enterprise RFC-grade reports, data models, API specs, and failover topologies. |

---

## ✨ Key Features

### 1. Interactive Architecture Canvas & Traffic Simulation

- **High-Performance Vector Canvas**: Built on `@xyflow/react` (React Flow) featuring smooth panning, zooming, minimap, auto-layout tree formatting, and responsive grid alignment.
- **Dynamic Node Topologies**: Support for API Gateways, Load Balancers, Microservices, Caching layers (Redis/Memcached), Relational & NoSQL Databases (PostgreSQL, MongoDB), Message Brokers (Kafka, RabbitMQ), Object Storage (S3/R2), and Serverless Functions.
- **Visual Health & Utilization States**:
  - `Normal` (Green): Operating comfortably within provisioned throughput ($<80\%$).
  - `Warning` (Amber): Operating near capacity saturation ($\ge 80\%$).
  - `Overloaded` (Red pulsing alert): Incoming arrival rate exceeds maximum fleet capacity ($\lambda > \mu$).
  - `Disabled` (Muted gray): Temporarily bypassed to test failover routing.
- **Component Inspector**: Real-time property tuning without restarting:
  - Worker count & horizontal scaling fleet size.
  - Processing capacity per second per worker ($\text{req/s}$).
  - Baseline latency ($\text{ms}$) & Queue size ($Q_{\max}$).
  - Overflow policies: Drop Excess, Queue & Degrade, Reject 429.
  - Directed edge traffic multipliers (e.g., $1 \times$ HTTP request $\to$ $3 \times$ DB queries).
- **Automated Bottleneck Ranker**: Identifies and ranks constrained microservices with diagnostic explanations detailing load vs. capacity, queue accumulation, and drop counts.
- **Baseline Comparison Engine**: Snapshot a current topology as a baseline, test scaling adjustments, and view delta differentials across throughput, latency, and drop rates.
- **Diagram Export**: One-click export to Mermaid (`.mmd`), Markdown architectural reports (`.md`), raw JSON topologies (`.json`), PNG, and SVG.

---

### 2. AI System Design Architect & Recommender

- **Natural Language to Architecture**: Describe any project idea (e.g., *"Design an Uber-like ride-hailing backend with real-time geospatial tracking and payment processing"*) and GitToScale synthesizes a complete DAG with services, queues, databases, and multipliers.
- **Multi-Tier Fault-Tolerant LLM Engine**: Automatic cascading failover ensures zero downtime:
  1. **Tier 1**: Mercury-3 (Inception Labs) — High-speed reasoning model.
  2. **Tier 2**: Google Gemini 2.5 Flash — Cloud architectural synthesis.
  3. **Tier 3**: Groq Llama 3.3 70B Versatile — High-throughput open-weights fallback.
  4. **Tier 4**: Deterministic Expert System Synthesizer — 100% offline rule-based fallback.
- **7-Phase System Design Deep-Dive**: Generates production-ready technical architecture reports:
  - Phase 1: Functional & Non-Functional Requirements (SLAs, 99.99% availability).
  - Phase 2: Capacity Estimation (DAU, QPS, Storage, Network Bandwidth).
  - Phase 3: High-Level Architecture DAG & Flow Boundaries.
  - Phase 4: Data Schema & Storage Architecture (Sharding, Partitioning, Replication).
  - Phase 5: Deep-Dive Component Design & Latency Optimization.
  - Phase 6: Bottlenecks, Single Points of Failure (SPOFs) & Resiliency.
  - Phase 7: Observability, Metrics, Distributed Tracing & Security.
- **AI Architect Chat with Live Context**: Interactive conversational sidebar that inspects your active playground canvas in real-time, answers design questions, explains trade-offs, and streams token-by-token responses via Server-Sent Events (SSE).

---

### 3. GitHub Repository Code-to-Architecture Scanner

- **Public & Private Repository Scanning**: Inspect any public GitHub repository or connect via GitHub Personal Access Token to map private codebases.
- **Static Dependency & Manifest Inventory**:
  - Analyzes `package.json`, `requirements.txt`, `Pipfile`, `go.mod`, `pom.xml`, `build.gradle`, `Cargo.toml`.
  - Interprets `docker-compose.yml`, `Dockerfile`, and Kubernetes configurations.
  - Detects background workers, database drivers, cache clients, messaging libraries, and internal gateways.
- **View Modes**:
  - **Basic View**: Clean high-level service topology for team presentations.
  - **Detailed View**: Hierarchical nested submodules (`parentId`) exposing internal controllers, background worker pipelines, and storage drivers.
- **Direct Simulation Integration**: Automatically passes the analyzed graph into the simulation engine with zero manual data mapping.

---

### 4. Real-Time Collaborative Design Meetings (Yjs + WebSockets)

- **CRDT-Powered Canvas Sync**: Powered by **Yjs** and `y-websocket` for conflict-free real-time synchronization with zero canvas jitter.
- **Role-Based Access Control**:
  - **Host**: Complete administrative control; can assign roles, lock the canvas, kick participants, and end meetings.
  - **Editor**: Full interactive canvas editing, node movement, connection creation, and parameter tuning.
  - **Viewer**: Read-only presence; can view live movements and interact in chat without altering diagram state.
- **Live Ephemeral Presence**:
  - Live cursor tracking with assigned user colors from an 8-tone palette.
  - Presence badges, participant rosters, and live indicator pills.
- **Integrated Meeting Chat**:
  - Real-time in-room text chat persisted to Neon PostgreSQL.
  - Instant shareable invitation URLs (`/meeting/:id` and `/collab/:id`).

---

### 5. Community Feed & Architecture Sharing

- **Public Architectural Feed**: Discover, inspect, and fork production architectures shared by other software engineers.
- **Rich Media Snapshots**: Automatic canvas rendering and snapshot upload to **Cloudflare R2 Object Storage**.
- **Social Interactions**: Like, bookmark, view counters, and follow developers.
- **Developer Profiles**: Customizable profile pages with usernames, bios, avatar images, custom banners, and saved design collections.

---

### 6. Polar Subscription & Monetization System

- **Dual-Tier Plan Structure**:
  - **Free Plan**:
    - **3 AI-generated architecture designs** (prompts, repo scans, system reports).
    - **3 live collaborative meetings** hosted.
    - **100% UNLIMITED manual architecture creation and editing** (users are never blocked from manual diagramming).
    - Unlimited joining of collaborative meetings hosted by other team members.
  - **GitToScale Pro ($29/month)**:
    - **Unlimited** AI-assisted architecture generations.
    - **Unlimited** AI Architect interactive chat.
    - **Unlimited** live collaborative meetings.
    - **Unlimited** repository imports and scans.
    - Priority GPU processing queue & dedicated architect support.
- **Polar.sh Integration**:
  - Polar custom checkout sessions with automatic customer metadata passing.
  - Cryptographic webhook verification supporting **Svix Standard Webhooks** (`webhook-id`, `webhook-timestamp`, `webhook-signature`) and direct HMAC-SHA256 signatures.
  - Webhook event handlers for `order.created`, `subscription.created`, `subscription.active`, `subscription.updated`, `subscription.canceled`, and `subscription.revoked`.
  - Backend source of truth: frontend payments cannot be faked or spoofed.
  - Seamless authentication redirect: unauthenticated users clicking Upgrade preserve their purchase state, sign in, and resume checkout automatically.

---

### 7. Telemetry, Admin Moderation & Notifications

- **Distributed Request Telemetry**: Automatic injection of `X-Trace-Id` and `Server-Timing` headers across all endpoints.
- **Slow Trace Profiler**: Tracks API latency, identifies child spans, and logs slow requests (`/api/telemetry/slow-traces`).
- **Admin Moderation Center**:
  - Superuser access for configured administrators (`ADMIN_EMAILS`).
  - Search users, inspect warnings, and enforce 3-strike warning escalations leading to automatic account suspension.
  - Real-time user banning, unbanning, and moderation audit logs.
- **Automated Transactional Emails**:
  - Dispatches welcome onboarding emails via **Resend** (`re_...`).
- **Telegram Administrator Alerts**:
  - Dual Telegram bot failover (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_TOKEN1`) sending instant alerts to channel administrators upon new user signups.

---

## 🧮 Mathematical Simulation Model

GitToScale executes a deterministic analytical rate propagation model over Directed Acyclic Graphs (DAGs):

```mermaid
flowchart LR
    A["Client Traffic (λ)"] --> B["API Gateway (μ_gw)"]
    B -->|Multiplier m_1| C["Auth Service (μ_auth)"]
    B -->|Multiplier m_2| D["Order Service (μ_order)"]
    D -->|Multiplier m_3| E["PostgreSQL DB (μ_db)"]
```

### 1. Effective Fleet Capacity ($\mu$)
For any node $v$ with worker count $W_v$ and individual worker capacity $C_v$:
$$\mu_v = W_v \times C_v \quad (\text{requests per second})$$

### 2. Traffic Flow Propagation ($\lambda$)
- For root load generators:
  $$\lambda_{\text{root}} = \text{incomingTrafficRate}$$
- For downstream services $v$, offered arrival rate is the sum of completed throughputs from all direct upstream predecessors $u \in \text{Upstream}(v)$ scaled by edge multipliers $m_{u \to v}$:
  $$\lambda_v = \sum_{u \in \text{Upstream}(v)} \left( T_u \times m_{u \to v} \right)$$

### 3. Completed Throughput ($T$)
The actual processed throughput cannot exceed the provisioned fleet capacity:
$$T_v = \min(\lambda_v, \mu_v)$$

### 4. Deterministic Queuing & Drop Model
When arrival rate exceeds capacity ($\lambda_v > \mu_v$), excess rate accumulates:
$$\Delta_v = \max(0, \lambda_v - \mu_v)$$
- Accumulated queue depth over duration $D$:
  $$Q_v = \min\left(Q_{\max, v}, \, \Delta_v \times D\right)$$
- Rejected requests (Dropped packets / HTTP 503/429):
  $$\text{Drops}_v = \max\left(0, \, (\Delta_v \times D) - Q_{\max, v}\right)$$

### 5. Latency Approximation
Under sub-saturation load ($\lambda_v < \mu_v$), latency incorporates baseline processing delay and an analytical $M/M/1$ queuing component:
$$L_v = L_{\text{base}, v} + \frac{1}{\mu_v - \lambda_v}$$
When $\lambda_v \ge \mu_v$, the service is marked as **Overloaded / Degraded** with unbounded queue growth.

---

## 🏗️ System Architecture

```text
┌───────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER                               │
│  React 18 + Vite · React Flow Canvas · Tailwind CSS · Yjs CRDT Client     │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │ HTTP / SSE / WebSockets
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                          EXPRESS.JS BACKEND API                           │
│                                                                           │
│  ├── /api/simulate        Topological DAG analytical simulation engine    │
│  ├── /api/recommend       7-Phase AI Architect & recommender              │
│  ├── /api/chat            Streaming AI Chat with canvas context (SSE)     │
│  ├── /api/repository      Static code & Docker/K8s dependency scanner     │
│  ├── /api/meetings        Yjs collaborative rooms & WebSocket server      │
│  ├── /api/feed            Social feed, user profiles & bookmarking        │
│  ├── /api/payment         Polar checkouts & Svix webhook verification     │
│  ├── /api/admin           User moderation & 3-strike escalation           │
│  └── /api/telemetry       Distributed trace profiling (X-Trace-Id)        │
└─────────┬───────────────────────────┬───────────────────────────┬─────────┘
          │                           │                           │
          ▼                           ▼                           ▼
┌──────────────────┐        ┌──────────────────┐        ┌───────────────────┐
│ NEON POSTGRESQL  │        │  SUPABASE AUTH   │        │   POLAR BILLING   │
│ • Subscriptions  │        │ • Google OAuth   │        │ • Pro checkout    │
│ • Usage quotas   │        │ • GitHub OAuth   │        │ • Webhook events  │
│ • Meeting rooms  │        │ • Email/Password │        │ • Subscriptions   │
│ • History & Feed │        │ • Session JWT    │        │ • Customer portal │
└──────────────────┘        └──────────────────┘        └───────────────────┘
          │                           │                           │
          ▼                           ▼                           ▼
┌──────────────────┐        ┌──────────────────┐        ┌───────────────────┐
│  CLOUDFLARE R2   │        │  RESEND + TG     │        │ MULTI-TIER LLMS   │
│ • Canvas images  │        │ • Welcome emails │        │ • Mercury-3       │
│ • Design videos  │        │ • Telegram bot   │        │ • Gemini 2.5 Flash│
│ • Avatars & art  │        │   signup alerts  │        │ • Groq Llama 3.3  │
└──────────────────┘        └──────────────────┘        └───────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 18, TypeScript, Vite |
| **Interactive Canvas** | `@xyflow/react` (React Flow), custom SVG bezier curves, Minimap |
| **Styling & Motion** | Tailwind CSS, Framer Motion, Lucide React icons, Radix UI |
| **Real-time Sync (CRDT)** | Yjs (`yjs`), `y-websocket`, WebSockets (`ws`), Socket.io |
| **Charts & Visualization** | Recharts (Time-series throughput & queue analytics) |
| **Markdown Rendering** | `react-markdown`, `remark-gfm` |
| **Backend Framework** | Node.js (v20+), Express.js, TypeScript, TSX |
| **Validation & Schema** | Zod v3 |
| **Database** | Neon Serverless PostgreSQL (`@neondatabase/serverless`) |
| **Authentication** | Supabase Auth (`@supabase/supabase-js`) + Local mock tokens |
| **Payment Provider** | Polar.sh (REST API, Checkouts, Svix Standard Webhooks) |
| **Object Storage** | Cloudflare R2 (S3-compatible API via `@aws-sdk/client-s3`) |
| **Email & Alerts** | Resend API, Telegram Bot API |
| **Testing** | Vitest, Supertest (138 integration and unit tests) |

---

## 🔌 API Reference

### 1. Simulation & Core Engine
- `GET /api/health` — Service health check and uptime.
- `GET /api/architecture` — Returns default microservices architecture fixture.
- `GET /api/scenarios` — Returns predefined capacity scenarios (Normal, Spike, DB Pressure, Flash Sale, Scale-Out).
- `POST /api/simulate` — Validates topology, executes analytical simulation, and outputs bottleneck ranks and time-series metrics.

### 2. AI Architecture & Chat
- `POST /api/recommend` — Generates a full cloud architecture DAG from a project description.
- `POST /api/recommend/design-report` — Generates the comprehensive 7-Phase RFC architectural report.
- `POST /api/chat/message` — Real-time AI Architect chat message; supports SSE streaming with `stream=true`.
- `POST /api/chat/save` & `GET /api/chat/history` — Persists and retrieves chat conversations up to 200 messages.

### 3. Repository Scanning
- `POST /api/repository/analyze` — Scans local directories or remote GitHub repos (public or private via personal access tokens) and extracts service graphs.
- `GET /api/repository/user-repos` — Lists connected GitHub user repositories for one-click analysis.

### 4. Collaborative Meetings
- `POST /api/meetings` — Creates a new collaborative meeting room (enforces plan quotas).
- `GET /api/meetings/:id` — Fetches meeting room state and active participants.
- `POST /api/meetings/:id/join` — Joins an existing meeting as Editor or Viewer (unrestricted).
- `PATCH /api/meetings/:id/role` — Host promotes/demotes participant role (Host, Editor, Viewer).
- `PATCH /api/meetings/:id/lock` — Host toggles canvas edit lock.
- `DELETE /api/meetings/:id/participants/:userId` — Host removes a participant.
- `POST /api/meetings/:id/end` — Host terminates the meeting session.
- `GET /api/meetings/:id/messages` — Retrieves meeting chat log.

### 5. Payments & Subscriptions (Polar)
- `GET /api/payment/status` — Retrieves authenticated user's plan, usage counts, and expiration date.
- `POST /api/payment/create-checkout` — Generates a Polar checkout URL for upgrading to Pro.
- `POST /api/payment/webhook` — Receives and verifies cryptographically signed Polar webhooks.
- `POST /api/payment/mock-complete` — Completes mock checkout in local/test sandbox environments.

### 6. Social Feed & User Profiles
- `GET /api/feed` — Fetches community architecture posts with pagination.
- `POST /api/feed` — Shares a new architecture diagram and snapshot to the feed.
- `POST /api/feed/:id/like` — Toggles like on an architecture post.
- `POST /api/feed/:id/bookmark` — Toggles bookmark on an architecture post.
- `GET /api/feed/profile/:id` — Retrieves developer profile, stats, and published designs.
- `PATCH /api/feed/profile` — Updates user profile (name, username, avatar, banner, bio).

### 7. Telemetry & Administration
- `GET /api/telemetry/stats` — Overall backend request counts and latency percentiles.
- `GET /api/telemetry/slow-traces` — Detailed trace waterfall for slow requests.
- `GET /api/admin/check` — Validates administrator privileges.
- `GET /api/admin/users` — Lists registered users and warnings.
- `POST /api/admin/warn` — Issues a warning with 3-strike auto-suspension.
- `POST /api/admin/suspend` & `POST /api/admin/unsuspend` — Manages account suspensions.

---

## 🔐 Environment Configuration

Create a `.env` file in the `backend/` directory (or use root `.env`):

```bash
# Server Port
PORT=3000

# Frontend URL (for CORS and Polar redirects)
FRONTEND_URL=http://localhost:5173

# Database (Neon Serverless PostgreSQL)
DATABASE_URL=postgresql://user:password@ep-sample-pooler.aws.neon.tech/neondb?sslmode=require

# Supabase Authentication
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# AI LLM Provider Configuration
LLM_PROVIDER=mercury
MERCURY_API_KEY=sk_...
MERCURY_BASE_URL=https://api.inceptionlabs.ai/v1
MERCURY_MODEL=mercury-3

GEMINI_API_KEY=AIzaSy...
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile

# Cloudflare R2 Object Storage (For Design Snapshots)
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=gittoscale
R2_PUBLIC_URL=https://pub-sample.r2.dev
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com

# Transactional Email (Resend)
RESEND_API_KEY=re_...

# Telegram Signup Alerts
TELEGRAM_BOT_TOKEN=123456789:ABC...
TELEGRAM_CHAT_ID=1699434761
TELEGRAM_BOT_TOKEN1=987654321:XYZ...
TELEGRAM_CHAT_ID1=1699434761

# Polar Payment Configuration
POLAR_ACCESS_TOKEN=polar_live_... (or polar_sand_...)
POLAR_ORGANIZATION_ID=your_org_id
POLAR_PRODUCT_ID=prod_...
POLAR_WEBHOOK_SECRET=whsec_...
POLAR_SERVER=sandbox  # 'sandbox' or 'production'

# Administration
ADMIN_EMAILS=admin@gitoscale.com,lead@gittoscale.tech
```

---

## 🚀 Getting Started & Local Development

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended).
- **npm**: v9.0.0 or higher.
- *(Optional)* PostgreSQL / Neon database (system automatically falls back to high-fidelity in-memory storage if database credentials are not supplied).

### 1. Installation
Clone the repository and install all workspace dependencies:
```bash
git clone https://github.com/your-username/gitoscale.git
cd gitoscale
npm install
```

### 2. Run in Development Mode
Launch both the backend API and frontend Vite development server concurrently:
```bash
npm run dev
```
- **Frontend App**: `http://localhost:5173`
- **Backend API Server**: `http://localhost:3000`
- **API Health Check**: `http://localhost:3000/api/health`

### 3. Production Build
Compile both the backend TypeScript server and frontend Vite bundle:
```bash
npm run build
```

Run the production server:
```bash
npm start
```

---

## 🧪 Testing & Verification

GitToScale maintains a comprehensive automated test suite powered by **Vitest** and **Supertest**, covering traffic propagation, simulation accuracy, AI failover, collaborative Yjs sockets, and payment webhook verification.

Run the test suite across all 17 test suites:
```bash
npm test
```

### Test Coverage Highlights
- ✅ **Simulation Accuracy**: Verified acyclic topological sorting, capacity calculations, queue accumulation, and drop math.
- ✅ **Polar Subscriptions**: Verified free tier quotas (3 AI designs, 3 meetings), unconstrained manual diagram editing, 403 plan-limit rejection payloads, and cryptographic Svix webhook verification.
- ✅ **Real-Time Collaboration**: Verified room creation, WebSocket join handshakes, Yjs CRDT message propagation, host role transfers, and canvas locking.
- ✅ **Repository Scanning**: Verified static manifest analysis across Docker Compose, Node, Go, Python, and Java codebases.
- ✅ **Multi-Tier AI LLM Failover**: Verified seamless failover from Mercury-3 $\to$ Gemini $\to$ Groq $\to$ offline expert synthesizer.

