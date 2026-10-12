# Upgrade Repository Scanning to an AI-Powered Architecture Analyzer

Inspect and improve the existing System Design Playground. Preserve the current website's design, components, styling, and interactive simulation features. Do not copy GitDiagram's UI or rebuild the application.

Use GitDiagram as a reference for the repository-ingestion and AI graph-generation workflow only.

## 1. Repository ingestion

When a user submits a GitHub repository:

- Resolve its owner, repository, default branch, and commit SHA.
- Fetch the recursive repository tree using the GitHub API.
- Retrieve the README and relevant project manifests.
- Identify monorepos, workspaces, applications, and runtime candidates.
- Exclude node_modules, .git, build outputs, generated files, binary files, and irrelevant assets.
- Select source files based on entry points, imports, routes, service clients, database connections, queues, and deployment configuration.
- Apply request limits, file-size limits, timeouts, and GitHub rate-limit handling.

Support large repositories with bounded batches and explicit coverage reporting. Never silently claim to have analyzed files that were skipped.

## 2. AI architecture generation

Use the user's configured LLM provider and model.

Send the LLM:
- A bounded repository tree.
- README and manifest summaries.
- Relevant source excerpts.
- Entry points and startup commands.
- Route and controller summaries.
- Service communication evidence.
- Deployment and infrastructure configuration.

Ask the LLM to produce a validated architecture graph containing:

- Components and their types.
- Runtime and deployment boundaries.
- Source-to-target relationships.
- Communication types.
- Descriptions and confidence.
- Evidence file paths and code references.
- Repository-relative links.

Distinguish folders, libraries, frontend applications, backend servers, workers, databases, caches, queues, and external services.

Do not create a separate server for every directory or package. Do not invent relationships just because components are located near each other.

## 3. Validate the generated graph

Use Zod or the project's existing schema validation library.

Validate:
- Unique node and edge IDs.
- Valid source and target node references.
- All referenced repository paths against the fetched tree.
- Graph size and input limits.
- Allowed component and edge types.
- Evidence for inferred relationships.
- Consistency with the repository inventory.

If the LLM output fails validation, retry with focused error feedback within a bounded retry limit.

Use a deterministic compiler or graph adapter to convert valid architecture JSON into the existing diagram renderer's data format.

## 4. Render the architecture

Use the existing diagram canvas and preserve the current visual style.

The diagram should:
- Group related components logically.
- Show actual evidenced communication paths.
- Allow users to select nodes and inspect source files.
- Support zoom, pan, node movement, and connection inspection.
- Distinguish confirmed and uncertain relationships.
- Provide a readable initial layout.
- Let users correct or remove inaccurate nodes and edges.

Do not render every folder or source file as a node. Prioritize the major components and relationships that explain how the application works.

## 5. Integrate traffic simulation

Reuse the existing backend simulation engine.

Allow users to configure capacities, worker counts, traffic rates, and downstream request multipliers.

Do not infer real production capacity from source code alone. Mark default capacity values as estimates.

Validate the generated graph before simulation. If a graph contains unsupported cycles or ambiguous request flows, explain what needs correction instead of returning misleading bottleneck results.

## 6. Efficiency and caching

- Cache analysis results by repository, commit SHA, analyzer version, and relevant configuration.
- Avoid repeated LLM calls when users move nodes or adjust traffic.
- Use targeted source-file selection rather than sending the entire repository blindly.
- Report files analyzed, files skipped, and unresolved relationships.
- Support regeneration when the repository revision changes.
- Keep provider keys on the backend and never include them in logs or generated graph data.

## 7. Verification

Test against:
- A small single-server repository.
- A monorepo with several independent services.
- A repository containing shared libraries and UI packages.
- A project with a database and message queue.
- A large repository with excluded files.
- A repository with ambiguous or missing architecture evidence.

Verify that generated paths exist, service classifications are reasonable, the diagram renders correctly, and the graph works with the existing simulator.

Inspect the current implementation first, reuse working code, implement the changes, run tests, and report actual results. Do not stop after producing a plan.