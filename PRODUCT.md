# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Software engineers, system architects, and technical leads modeling microservice topologies, simulating traffic spikes, and pinpointing capacity bottlenecks before deploying to production. Secondary audiences include engineering students and candidates practicing distributed system design.

## Product Purpose
GitToScale is an interactive system design playground and capacity planner. It empowers engineers to visualize distributed system architectures, simulate high-throughput traffic scenarios, and discover performance bottlenecks, queue saturation, and cascading service failures in real time.

## Positioning
Combines instant analytical queueing simulation (M/M/m/K mathematical network models) with automated codebase/Docker Compose repository ingestion and an interactive ReactFlow canvas. Unlike black-box stress-testing or static diagram tools, GitToScale provides immediate, zero-credential feedback on throughput, latency, queue saturation, and constrained services.

## Operating Context
- Web-based browser workbench with responsive split-pane layout: collapsible left sidebar (traffic controls & component hierarchy), central interactive canvas (ReactFlow architecture diagram), and collapsible right inspector/analysis panel (bottleneck rankings & dynamic timeseries charts).
- Dual workflow entry from landing page: sample e-commerce test site vs. GitHub/local repository ingestion with LLM-assisted architecture extraction.
- Dark and Light mode support with instant switching across the entire product.

## Capabilities and Constraints
- Two-mode architecture canvas: Basic View (high-level services and datastores) and Detailed View (code-level controllers, middleware, and models).
- Analytical simulation engine calculating arrival rate, service rate, utilization, queue lengths, latency, and drop rates without running actual live infrastructure.
- Interactive node and edge manipulation: add services/caches/databases/gateways, adjust worker counts, capacity per second, baseline latency, queue overflow policies (drop vs. reject), and downstream call multipliers.
- Preconfigured traffic scenarios: normal traffic, flash sale, downstream failure, database write spike, cache stampede.
- Baseline comparison snapshots to evaluate before/after architectural changes.
- Repository import with LLM discovery, Docker Compose parsing, and customizable API keys.

## Brand Commitments
- Name: GitToScale / System Design Playground
- Clean, high-density developer tool aesthetics with Inter typography, Tailwind CSS, Lucide icons, and slate/indigo theme accents.
- Full light and dark theme consistency across headers, sidebars, canvas, modals, and landing page.

## Evidence on Hand
- Working production web application in `frontend/` (React 18, TypeScript, Tailwind CSS, Vite, @xyflow/react).
- Simulation backend in `backend/` with verified Vitest analytical queueing network test suite.
- Preloaded 8-node e-commerce test architecture and scenario suite.

## Product Principles
1. Instant Analytical Feedback: Zero waiting for cloud spins or heavy load generators; calculate microservices capacity in milliseconds.
2. Architecture Grounded in Code: Bridge the gap between static architecture diagrams and real repository structure.
3. High Information Density & Visual Clarity: Clear, glanceable bottleneck badges, utilization metrics, and queue indicators.
4. Seamless Workflow Control: Easily collapsible panels, light/dark themes, and intuitive canvas interaction.

## Accessibility & Inclusion
- High contrast status indicators (emerald for normal, amber for warning, red for overloaded).
- Semantic button labels, accessible contrast in both light and dark themes, keyboard focusable controls, and clear text hierarchy.

