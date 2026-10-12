# System Design Playground — Traffic Simulator

An interactive web application and analytical traffic simulator for visualizing microservices architectures and evaluating capacity planning bottlenecks.

Built with **React**, **TypeScript**, **Tailwind CSS**, **React Flow (`@xyflow/react`)**, **Express.js**, **Zod**, and **Vitest**.

---

## 1. Features

- **Interactive Architecture Canvas**: Draggable nodes, connected dynamic bezier arrows with live flow rate badges, zoom/pan/fit-to-view controls, and light Excel-like grid canvas.
- **Custom Visual States**: Distinct visual status indicators on every node:
  - `Normal`: Operating comfortably within effective capacity (green)
  - `Warning`: Operating at $\ge 80\%$ utilization (amber)
  - `Overloaded`: Offered arrival rate exceeds effective capacity (red, pulsing alert)
  - `Disabled`: Excluded from execution and traffic routing (muted slate)
- **Component Inspector**: Real-time inspection and editing of node properties (worker count, capacity per second, baseline latency, queue size, overflow policy) and outgoing request multipliers.
- **Predefined Architecture**: E-commerce microservices fixture consisting of:
  - Client / Load Generator
  - API Gateway
  - Auth Service
  - Product Service
  - Order Service
  - Payment Service
  - Redis Cache
  - PostgreSQL Database
- **Predefined Scenarios**:
  1. *Normal Traffic*: Baseline load (800 req/s), zero bottlenecks.
  2. *Traffic Spike*: 2,500 req/s surge stressing gateway and order pipelines.
  3. *Database Pressure*: High query multiplier and reduced DB capacity (1 worker @ 400 req/s), demonstrating database bottlenecks.
  4. *Flash Sale*: Extreme load (4,000 req/s) saturating multiple services.
  5. *Scale-Out Fleet*: Horizontal worker fleet scale-out resolving flash sale bottlenecks.
- **Ranked Bottlenecks Diagnosis**: Automated ranking of constrained services with clear diagnostic explanations showing load vs capacity, queue sizes, and drop counts.
- **Time-Series Charts**: Grounded analytical model samples displaying offered vs completed throughput and queue/drop accumulation over the configured duration.
- **Scenario Baseline Comparison**: Snapshot your current setup as a baseline and compare deltas against modified worker/capacity fleets.

---

## 2. Project Architecture

Monorepo structure:

```text
system-design-playground/
├── backend/
│   ├── src/
│   │   ├── fixtures/           # Fixture loader
│   │   ├── routes/             # Health, architecture, scenarios, simulate
│   │   ├── simulation/         # Engine, types, queue, latency, validation
│   │   ├── app.ts              # Express setup & error handling
│   │   └── index.ts            # Server entrypoint
│   └── tests/                  # Unit and integration test suite
├── frontend/
│   ├── src/
│   │   ├── components/         # Canvas, Header, Inspector, BottleneckList, Charts
│   │   ├── services/           # Axios API client
│   │   ├── App.tsx             # Root dashboard
│   │   └── main.tsx            # React entrypoint
│   └── vite.config.ts          # Vite config with backend proxy
├── fixtures/
│   ├── architecture.json       # Synthetic e-commerce graph fixture
│   └── scenarios.json          # Predefined scenarios fixture
├── package.json                # Monorepo workspaces & scripts
└── README.md
```

---

## 3. Simulation Model & Assumptions

The simulator implements a deterministic analytical rate propagation model across Directed Acyclic Graphs (DAGs):

1. **Effective Capacity**:
   $$\mu = \text{capacityPerSecond} \times \text{workerCount}$$
2. **Traffic Propagation**:
   - For root load generator: offered arrival rate $\lambda = \text{incomingTrafficRate}$.
   - For downstream nodes: offered arrival rate is the sum of upstream completed throughput multiplied by edge multipliers:
     $$\lambda_v = \sum_{u \in \text{Upstream}(v)} (\text{throughput}_u \times \text{multiplier}_{u \to v})$$
3. **Completed Throughput**:
   $$\text{throughput}_v = \min(\lambda_v, \mu_v)$$
4. **Deterministic Queue Model**:
   - Excess rate: $\Delta = \max(0, \lambda_v - \mu_v)$
   - Queue accumulation: $Q = \min(Q_{\max}, \Delta \times \text{durationSeconds})$
   - Rejection / Drops: $\text{Drops} = \max(0, (\Delta \times \text{durationSeconds}) - Q_{\max})$
5. **Latency Estimation**:
   - Baseline processing latency combined with an M/M/1-derived queuing approximation below saturation. When overloaded ($\lambda > \mu$), latency is marked degraded/unbounded due to queue accumulation.

> **Limitations**: This is an analytical capacity planning model, not a discrete-event or stochastic packet simulation. It does not reproduce operating system thread scheduling, cache hit variance, network packet loss, or GC pauses.

---

## 4. API Endpoints

- `GET /api/health` — Server health check and version.
- `GET /api/architecture` — Returns the default synthetic e-commerce architecture fixture.
- `GET /api/scenarios` — Returns the 5 predefined capacity planning scenarios.
- `POST /api/simulate` — Validates input parameters via Zod, performs topological DAG cycle checks, and calculates propagation metrics, bottlenecks, and time-series samples.

---

## 5. Getting Started

### Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)

### Installation
```bash
npm install
```

### Development
Run both frontend and backend concurrently in development:
```bash
npm run dev
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`

### Running Tests
Run the comprehensive Vitest unit and integration test suite:
```bash
npm test
```

### Production Build
Build both backend and frontend:
```bash
npm run build
```

Run production backend (serves API and compiled frontend bundle):
```bash
npm start
```
