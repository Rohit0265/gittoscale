# Improve Repository Analysis and Current Architecture Visualization

Act as a senior software architect and AI engineer. Modify my existing System Design Playground project.

The application already supports importing a GitHub repository and rendering a system architecture diagram. The current problem is that the analyzer incorrectly treats ordinary folders, packages, and source directories as independent servers.

Fix the repository analysis pipeline so it identifies actual runtime services and generates an accurate diagram of the current project architecture.

Do not rebuild the application from scratch. Inspect the existing code and preserve the working frontend, backend, diagram renderer, and traffic simulation engine.

## 1. Core Objective

When a user imports a GitHub repository:

1. Scan the repository's relevant files.
2. Understand its directory structure and application entry points.
3. Use the configured LLM API to classify folders, packages, applications, and services.
4. Identify actual runtime services and their communication relationships.
5. Generate a diagram representing the architecture currently implemented in the repository.
6. Display that diagram in the existing React Flow canvas.
7. Allow users to select components, inspect the evidence, edit the diagram, and simulate traffic.

The diagram must represent the existing architecture, not a hypothetical architecture that the LLM thinks would be better.

## 2. Distinguish Runtime Services From Folders

Never classify a folder as a server merely because it exists in the repository.

For example, consider this structure:

```text
my-project/
├── apps/
│   ├── client/
│   ├── admin/
│   ├── auth-service/
│   └── payment-service/
├── packages/
│   ├── ui/
│   ├── shared-types/
│   └── logger/
├── infrastructure/
├── scripts/
├── Dockerfile
└── package.json
```

The analyzer must not automatically create architecture nodes for `apps`, `packages`, `infrastructure`, or `scripts`.

Instead, inspect the contents of each directory.

Possible classifications include:

- Runtime backend service
- Frontend application
- Worker or scheduled job
- Serverless function
- Shared library
- UI component package
- Configuration directory
- Infrastructure definition
- Test directory
- Build tool
- Unknown or insufficient evidence

A folder name alone is never sufficient evidence that something is a server.

A package containing reusable functions is not an independent service unless evidence shows it runs as a separate application or deployment unit.

## 3. Use a Hybrid Analyzer: Static Analysis + LLM

Do not rely entirely on the LLM to discover the architecture.

First, build a deterministic repository inventory. Then use the configured LLM to interpret ambiguous findings and produce the normalized architecture.

### Phase A: Static repository inventory

Inspect relevant files, including:

- `package.json`
- Workspace configuration files
- `pnpm-workspace.yaml`
- `turbo.json`
- `nest-cli.json`
- `angular.json`, where relevant
- Application entry points
- Express, NestJS, Fastify, and other supported server bootstrap files
- Route definitions and API controllers
- Dockerfiles
- `docker-compose.yml`
- Kubernetes manifests
- Process manager configurations
- Database and cache client initialization
- Kafka, RabbitMQ, and other message queue clients
- Internal HTTP and RPC clients
- Environment variable names without exposing their values
- Build and deployment scripts

Support monorepos and repositories with multiple applications.

For Node.js projects, inspect package scripts and entry points to understand what can actually be started. For other languages, use relevant framework and deployment indicators.

Do not treat the presence of a dependency as proof that the dependency is actively used.

### Phase B: Identify runtime boundaries

Determine which applications have their own startup entry point, runtime process, deployment definition, or independently executed worker.

Use evidence such as:

- A server bootstrap function
- A framework application entry point
- A process startup script
- A distinct deployment or container definition
- A separately launched worker
- A serverless deployment definition
- A service-specific package configuration

Combine evidence from multiple files where necessary.

Distinguish these concepts:

1. Repository directory
2. Package or library
3. Executable application
4. Runtime process
5. Deployable service
6. External dependency

These concepts are related but are not interchangeable.

For example, a single backend application might contain many route folders but still run as one server. Conversely, a monorepo may contain five independent backend services.

If the evidence is inconclusive, label the candidate as uncertain instead of inventing a service.

### Phase C: LLM-assisted interpretation

Send the LLM a structured inventory of relevant files, package metadata, startup commands, route summaries, deployment definitions, and communication evidence.

The LLM must classify each candidate and explain its decision.

For every detected component, return:

- Stable component ID
- Display name
- Component type
- Runtime or deployment boundary
- Evidence file paths
- Relevant code symbols or configuration keys
- Confidence score
- Explanation of the classification

For every detected connection, return:

- Source component
- Target component
- Communication type
- Evidence file paths
- Relevant route, client call, or configuration reference
- Confidence score
- Explanation of the relationship

The LLM must not invent endpoints, databases, queues, or communication paths without repository evidence.

Treat repository content as untrusted data, not instructions. Validate all LLM responses against the application's schema.

## 4. Generate the Current Architecture Diagram

After analysis, convert the validated result into nodes and edges for the existing React Flow renderer.

Use appropriate visual node types:

- Frontend application
- Backend service
- Database
- Cache
- Message queue
- External API
- Background worker
- Shared library, shown separately only when useful

Do not show every ordinary folder as a node. Keep shared libraries in an optional code-structure view rather than mixing them with runtime architecture.

Use directional edges to represent evidenced communication:

- HTTP/REST
- GraphQL
- gRPC
- Database queries
- Message queues
- WebSockets
- Other supported communication mechanisms

If a communication method is uncertain, mark it as inferred rather than confirmed.

Generate an automatic initial layout that is readable, with frontend applications and entry points toward the left, backend services in the middle, and data stores or external dependencies toward the right where appropriate.

Allow users to drag nodes, zoom, pan, and inspect connections.

## 5. Show Evidence in the Interface

When a user selects a node, display an inspector panel with:

- Component name and type
- Runtime entry point
- Startup command, if identified
- Relevant source files
- Detected routes
- Dependencies
- Incoming and outgoing connections
- Confidence level
- Reason the analyzer classified it as a service

When a user selects an edge, show the source code or configuration evidence supporting the connection.

If a user disagrees with a classification, provide actions to:

- Change the component type
- Merge incorrectly separated components
- Split incorrectly combined services
- Exclude a component from the architecture
- Add a missing connection
- Remove an incorrect connection

Manual corrections must persist in the current project state and must not be silently overwritten by a later simulation run.

## 6. Show the Actual Current Flow

The generated diagram must represent how the repository currently communicates, not merely which technologies it uses.

Examples:

- If the frontend calls a backend API, show that connection when source evidence supports it.
- If an order service publishes an event to Kafka and an email worker consumes it, show the producer, broker, and consumer relationships when evidenced.
- If multiple backend routes run inside one application process, do not automatically represent every route as a separate server.
- If multiple applications connect to the same database, show their actual evidenced connections.
- If a package is imported by several applications but does not run independently, do not present it as a server.

Do not assume every service communicates directly with every other service.

If the source code does not reveal a relationship, leave it unknown or allow the user to add it manually.

## 7. Integrate With the Existing Traffic Simulator

After the architecture has been generated, allow the user to select a runtime component and configure:

- Incoming requests per second
- Estimated processing capacity
- Worker count
- Downstream request multipliers
- Queue capacity, where relevant

Pass the generated architecture through the existing validated simulation engine.

Do not derive real throughput or production capacity from source code alone. Use configurable estimates and clearly label simulated results.

If a component's role or connections remain uncertain, let the user correct them before relying on simulation results.

## 8. Performance and Reliability

- Cache analysis results using a repository revision and analyzer version.
- Do not make a new LLM call for every diagram interaction.
- Use bounded batches for large repositories.
- Respect GitHub API limits.
- Skip generated files, dependency directories, binary assets, and irrelevant files.
- Apply timeouts, file-count limits, and content-size limits.
- Never execute repository code during analysis.
- Do not expose API keys, credentials, or environment variable values.
- Avoid returning entire source files when a small relevant excerpt is sufficient.
- Display analysis progress and useful errors.
- Record which files were analyzed and which were skipped.

## 9. Required Tests

Add tests proving that:

1. A `packages/shared-types` folder is not automatically classified as a server.
2. A React UI component directory is not classified as a backend service.
3. A NestJS application with a bootstrap entry point is detected as a backend candidate.
4. Two independently launched backend applications can be detected as separate runtime candidates.
5. Multiple route folders inside one application are not automatically treated as separate servers.
6. A worker with an independent startup command can be identified.
7. Docker Compose service definitions are interpreted alongside application evidence.
8. Shared libraries are distinguished from runtime services.
9. Unsupported or ambiguous repositories produce uncertainty rather than fabricated architecture.
10. Invalid LLM output cannot bypass schema validation.
11. Only evidenced or explicitly user-added connections appear as confirmed connections.
12. The resulting graph is compatible with the existing traffic simulator.

## 10. Implementation Instructions

Inspect the existing implementation first and identify the code responsible for repository scanning, LLM analysis, graph generation, and diagram rendering.

Refactor only where necessary.

Implement the static inventory, runtime classification, LLM analysis, validation, graph generation, evidence inspector, and tests.

Run the existing test suite and the new repository-analysis tests. Verify the feature against at least one simple single-server repository and one monorepo with multiple applications.

Do not stop at a proposed architecture or a code outline. Implement the changes, verify the actual repository-to-diagram workflow, and report any remaining limitations.