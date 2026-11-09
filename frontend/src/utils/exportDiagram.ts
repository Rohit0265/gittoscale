import { ArchitectureNode, ArchitectureEdge, ComponentType } from '../types';
import { toVerticalTree } from './treeLayout';

/**
 * Generates valid Mermaid flowchart syntax from architecture nodes and edges,
 * organized into logical architectural subgraphs matching Senior Architect design standards.
 */
export function generateMermaidDiagram(
  nodes: ArchitectureNode[] = [],
  edges: ArchitectureEdge[] = [],
  title?: string
): string {
  const lines: string[] = ['flowchart TB'];

  if (title) {
    const cleanTitle = title.replace(/[\r\n]+/g, ' ').slice(0, 80);
    lines.push(`  %% Architecture: ${cleanTitle}`);
  }

  if (nodes.length === 0) {
    lines.push('  empty["(Empty Architecture - Add components to visualize)"]');
    return lines.join('\n');
  }

  // Helper to sanitize node ID for Mermaid (avoiding invalid special characters)
  const sanitizeId = (id: string) =>
    'node_' + id.toLowerCase().replace(/[^a-z0-9_]/g, '_');

  const renderNodeDeclaration = (node: ArchitectureNode, indent = '    ') => {
    const sId = sanitizeId(node.id);
    const safeName = (node.name || node.id).replace(/"/g, "'");
    const safeCapacity = `${Number(node.capacityPerSecond || 0).toLocaleString()} req/s`;
    const label = `"${safeName}<br/><small style='opacity:0.8'>${safeCapacity} · ${node.workerCount || 1}w</small>"`;

    switch (node.type) {
      case 'database':
        return `${indent}${sId}[(${label})]:::database`;
      case 'cache':
        return `${indent}${sId}[[${label}]]:::cache`;
      case 'gateway':
        return `${indent}${sId}([${label}]):::gateway`;
      case 'load_generator':
        return `${indent}${sId}([${label}]):::client`;
      case 'service':
      default: {
        const lowerName = (node.name || '').toLowerCase();
        if (lowerName.includes('external') || lowerName.includes('third party') || lowerName.includes('github') || lowerName.includes('stripe')) {
          return `${indent}${sId}([${label}]):::external`;
        }
        return `${indent}${sId}[${label}]:::service`;
      }
    }
  };

  // Group nodes into logical architectural layers
  const clientNodes = nodes.filter((n) => n.type === 'load_generator');
  const ingressNodes = nodes.filter(
    (n) => n.type === 'gateway' || n.category === 'API gateway' || n.id.includes('gateway')
  );
  const cacheAndMsgNodes = nodes.filter(
    (n) =>
      n.type === 'cache' ||
      n.id.includes('queue') ||
      n.id.includes('kafka') ||
      n.name.toLowerCase().includes('queue') ||
      n.name.toLowerCase().includes('broker')
  );
  const dataNodes = nodes.filter(
    (n) =>
      n.type === 'database' ||
      n.id.includes('postgres') ||
      n.id.includes('storage') ||
      n.id.includes('mongo')
  );
  const externalNodes = nodes.filter(
    (n) =>
      !clientNodes.includes(n) &&
      !ingressNodes.includes(n) &&
      !cacheAndMsgNodes.includes(n) &&
      !dataNodes.includes(n) &&
      (n.category === 'External Services' ||
        n.name.toLowerCase().includes('third') ||
        n.name.toLowerCase().includes('github') ||
        n.name.toLowerCase().includes('telegram') ||
        n.name.toLowerCase().includes('supabase') ||
        n.name.toLowerCase().includes('stripe') ||
        n.name.toLowerCase().includes('llm') ||
        n.name.toLowerCase().includes('gemini'))
  );
  const appNodes = nodes.filter(
    (n) =>
      !clientNodes.includes(n) &&
      !ingressNodes.includes(n) &&
      !cacheAndMsgNodes.includes(n) &&
      !dataNodes.includes(n) &&
      !externalNodes.includes(n)
  );

  // 1. Declare Layer Subgraphs
  if (clientNodes.length > 0) {
    lines.push('\n  subgraph CLIENT["Client Layer"]');
    clientNodes.forEach((n) => lines.push(renderNodeDeclaration(n)));
    lines.push('  end');
  }

  if (ingressNodes.length > 0) {
    lines.push('\n  subgraph INGRESS["Edge & Ingress Layer"]');
    ingressNodes.forEach((n) => lines.push(renderNodeDeclaration(n)));
    lines.push('  end');
  }

  if (appNodes.length > 0) {
    lines.push('\n  subgraph APP["Application & Services Layer"]');
    appNodes.forEach((n) => lines.push(renderNodeDeclaration(n)));
    lines.push('  end');
  }

  if (cacheAndMsgNodes.length > 0) {
    lines.push('\n  subgraph CACHE_MSG["Cache & Messaging Layer"]');
    cacheAndMsgNodes.forEach((n) => lines.push(renderNodeDeclaration(n)));
    lines.push('  end');
  }

  if (dataNodes.length > 0) {
    lines.push('\n  subgraph DATA["Data & Persistence Layer"]');
    dataNodes.forEach((n) => lines.push(renderNodeDeclaration(n)));
    lines.push('  end');
  }

  if (externalNodes.length > 0) {
    lines.push('\n  subgraph EXT["External Upstream Services"]');
    externalNodes.forEach((n) => lines.push(renderNodeDeclaration(n)));
    lines.push('  end');
  }

  lines.push('');

  // 2. Declare connecting edges
  edges.forEach((edge) => {
    if (edge.enabled === false) return;
    const sSource = sanitizeId(edge.source);
    const sTarget = sanitizeId(edge.target);
    const rawLabel = edge.label ? edge.label.replace(/"/g, "'") : '';
    const multiplier =
      typeof edge.requestsPerInput === 'number' && edge.requestsPerInput !== 1
        ? ` (${edge.requestsPerInput}x)`
        : '';
    const fullLabel = rawLabel || multiplier ? `${rawLabel}${multiplier}`.trim() : '';

    const isObservability =
      rawLabel.toLowerCase().includes('telemetry') ||
      rawLabel.toLowerCase().includes('trace') ||
      rawLabel.toLowerCase().includes('alert');

    const arrow = isObservability ? '-.->' : '-->';

    if (fullLabel) {
      lines.push(`  ${sSource} ${arrow}|"${fullLabel}"| ${sTarget}`);
    } else {
      lines.push(`  ${sSource} ${arrow} ${sTarget}`);
    }
  });

  lines.push('');

  // 3. High-contrast theme styling for diagrams
  lines.push('  %% Styles');
  lines.push('  classDef default fill:#18181b,stroke:#52525b,stroke-width:1.5px,color:#f4f4f5;');
  lines.push('  classDef client fill:#042f2e,stroke:#14b8a6,stroke-width:2px,color:#ccfbf1;');
  lines.push('  classDef gateway fill:#1e1b4b,stroke:#6366f1,stroke-width:2px,color:#e0e7ff;');
  lines.push('  classDef service fill:#172554,stroke:#3b82f6,stroke-width:2px,color:#dbeafe;');
  lines.push('  classDef cache fill:#431407,stroke:#f97316,stroke-width:2px,color:#ffedd5;');
  lines.push('  classDef database fill:#422006,stroke:#eab308,stroke-width:2px,color:#fef9c3;');
  lines.push('  classDef external fill:#2e1065,stroke:#a855f7,stroke-width:2px,color:#f3e8ff;');

  return lines.join('\n');
}

/**
 * Generates a publication-grade System Design Report in Markdown matching the
 * Senior Software Architect 7-Phase specification.
 */
export function generateSystemDesignReport(
  nodes: ArchitectureNode[] = [],
  edges: ArchitectureEdge[] = [],
  projectName: string = 'System Architecture Design',
  metrics?: {
    trafficRate?: number;
    p99Latency?: number;
    throughput?: number;
  }
): string {
  const title = projectName || 'System Architecture Design';
  const cleanTitle = title.replace(/[\r\n]+/g, ' ').slice(0, 80);
  const mermaid = generateMermaidDiagram(nodes, edges, cleanTitle);

  const trafficRate = metrics?.trafficRate || 1000;
  const dailyRequests = trafficRate * 86400;
  const averageRps = trafficRate;
  const peakMultiplier = 10;
  const peakRps = averageRps * peakMultiplier;
  const bandwidthMbps = Math.round((peakRps * 25 * 8) / 1000);
  const storageGbPerMonth = Math.round((dailyRequests * 0.00002 * 30));

  // Build component responsibilities
  const componentRows = nodes.map((node) => {
    let layer = 'Application Layer';
    if (node.type === 'load_generator') layer = 'Client Layer';
    else if (node.type === 'gateway') layer = 'Edge & Ingress Layer';
    else if (node.type === 'cache') layer = 'Cache & Messaging Layer';
    else if (node.type === 'database') layer = 'Data & Persistence Layer';
    else if (node.category === 'External Services') layer = 'External Services';

    const resp =
      node.config?.reason ||
      (node.type === 'database'
        ? 'Persistent relational/document storage with transaction guarantees.'
        : node.type === 'cache'
        ? 'High-speed in-memory caching to reduce database read pressure.'
        : node.type === 'gateway'
        ? 'Ingress routing, auth verification, and rate limiting.'
        : node.type === 'load_generator'
        ? 'User entrypoint generating simulated client traffic.'
        : 'Domain business logic and asynchronous job execution.');

    return `| **${node.name}** | ${layer} | ${resp} |`;
  }).join('\n');

  // Request flow
  const entryNode = nodes.find((n) => n.type === 'load_generator') || nodes[0];
  const gatewayNode = nodes.find((n) => n.type === 'gateway');
  const serviceNodes = nodes.filter((n) => n.type === 'service');
  const cacheNode = nodes.find((n) => n.type === 'cache');
  const dbNode = nodes.find((n) => n.type === 'database');

  const requestFlowSteps: string[] = [
    `1. User traffic enters from **${entryNode?.name || 'Client Layer'}**.`,
  ];
  if (gatewayNode) {
    requestFlowSteps.push(`2. Ingress traffic is processed by **${gatewayNode.name}** for routing, TLS termination, and authentication.`);
  }
  if (serviceNodes.length > 0) {
    requestFlowSteps.push(`3. Requests are dispatched to **${serviceNodes[0].name}** for domain logic processing.`);
  }
  if (cacheNode) {
    requestFlowSteps.push(`4. The service queries **${cacheNode.name}** to check for hot cached data before hitting persistence.`);
  }
  if (dbNode) {
    requestFlowSteps.push(`5. On cache miss or write operations, queries are committed to **${dbNode.name}**.`);
  }
  requestFlowSteps.push(`6. Response payload is serialized and returned to the caller.`);
  requestFlowSteps.push(`7. Asynchronous event propagation and telemetry tracing continue in the background.`);

  return `# ${cleanTitle} — System Design Architecture

## 1. System Overview
This production-oriented architecture diagram models the end-to-end component topology for **${cleanTitle}**. The system is organized into modular layers separating user ingress, application services, low-latency caching, and persistent storage.

## 2. Architecture Diagram
\`\`\`mermaid
${mermaid}
\`\`\`

## 3. Component Responsibilities
| Component | Layer | Primary Responsibility |
|---|---|---|
${componentRows || '| **API Gateway** | Edge / Ingress | Routes authenticated traffic and enforces rate limits |'}

## 4. Request Flow
${requestFlowSteps.join('\n')}

## 5. Capacity Estimation
### Traffic & Workload Calculations
- **Baseline Traffic Rate:** ${averageRps.toLocaleString()} req/s ($${dailyRequests.toLocaleString()}$ daily requests)
- **Peak Multiplier (Assumed):** ${peakMultiplier}×
- **Peak Throughput Target:** ${peakRps.toLocaleString()} req/s
- **Estimated Network Bandwidth (Peak):** ~${bandwidthMbps.toLocaleString()} Mbps
- **Projected Storage Volume:** ~${Math.max(10, storageGbPerMonth).toLocaleString()} GB/month

*Calculated based on standard 86,400 seconds/day distribution with horizontal autoscaling container pools.*

## 6. Key Architecture Decisions
| Decision | Rationale | Trade-offs Considered |
|---|---|---|
| **Stateless Services** | Allows linear horizontal autoscaling behind load balancers | Requires externalized session storage |
| **In-Memory Caching Tier** | Absorbs high-frequency read spikes to protect persistent storage | Requires cache invalidation on writes |
| **Decoupled Asynchronous Workers** | Prevents long-running jobs from blocking HTTP requests | Introduces eventual consistency |
| **Database Read Replicas** | Isolates analytical and read traffic from transactional writes | Replication lag must be tolerated |
| **Distributed Telemetry** | Injects trace IDs for end-to-end latency and bottleneck visibility | Marginal header overhead |

## 7. Assumptions
- Traffic flows form a Directed Acyclic Graph (DAG) with validated acyclicity.
- Peak multiplier of 10× is assumed for peak marketing or batch periods.
- Caching layer achieves at least 70–80% hit rate on read-heavy workflows.
- Containers autoscale horizontally when worker capacity utilization exceeds 75%.
`;
}

/**
 * Generates pretty-printed JSON representation of the system design.
 */
export function generateArchitectureJson(
  nodes: ArchitectureNode[] = [],
  edges: ArchitectureEdge[] = [],
  projectName?: string
): string {
  const exportPayload = {
    projectName: projectName || 'GitToScale System Architecture',
    exportedAt: new Date().toISOString(),
    version: '1.0',
    summary: {
      totalComponents: nodes.length,
      totalConnections: edges.length,
      nodeTypes: nodes.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    },
    nodes,
    edges,
  };

  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Triggers a file download in the browser.
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Copies string text to clipboard safely.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (err) {
    console.warn('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Parses a single Mermaid node snippet (e.g. `gateway["API Gateway<br/>5000 req/s, 2w"]:::gateway`
 * or `db[("PostgreSQL DB")]` or `redis[["Redis Cache"]]` or `client`) into an ArchitectureNode.
 */
function parseNodeSnippet(
  snippet: string,
  defaultCapacityMap: Record<ComponentType, number>,
  defaultWorkerMap: Record<ComponentType, number>
): ArchitectureNode | null {
  const cleanSnippet = snippet.trim();
  if (!cleanSnippet || cleanSnippet === 'empty') return null;

  // 1. Database: id[(label)]
  let nodeMatch = cleanSnippet.match(/^([a-zA-Z0-9_-]+)\[\((.*?)\)\](?:::([a-zA-Z0-9_-]+))?/);
  let type: ComponentType = 'database';
  if (!nodeMatch) {
    // 2. Cache: id[[label]]
    nodeMatch = cleanSnippet.match(/^([a-zA-Z0-9_-]+)\[\[(.*?)\]\](?:::([a-zA-Z0-9_-]+))?/);
    type = 'cache';
  }
  if (!nodeMatch) {
    // 3. Gateway: id([label])
    nodeMatch = cleanSnippet.match(/^([a-zA-Z0-9_-]+)\(\[(.*?)\]\)(?:::([a-zA-Z0-9_-]+))?/);
    type = 'gateway';
  }
  if (!nodeMatch) {
    // 4. Client / load generator: id[/label/\]
    nodeMatch = cleanSnippet.match(/^([a-zA-Z0-9_-]+)\[\/(.*?)\/\\\](?:::([a-zA-Z0-9_-]+))?/);
    type = 'load_generator';
  }
  if (!nodeMatch) {
    // 5. Rounded service box: id(label)
    nodeMatch = cleanSnippet.match(/^([a-zA-Z0-9_-]+)\((.*?)\)(?:::([a-zA-Z0-9_-]+))?/);
    type = 'service';
  }
  if (!nodeMatch) {
    // 6. Standard Service box: id[label]
    nodeMatch = cleanSnippet.match(/^([a-zA-Z0-9_-]+)\[(.*?)\](?:::([a-zA-Z0-9_-]+))?/);
    type = 'service';
  }

  if (!nodeMatch) {
    // 7. Bare id without brackets (e.g. "gateway", "auth_service", "postgres")
    const bareMatch = cleanSnippet.match(/^([a-zA-Z0-9_-]+)$/);
    if (bareMatch) {
      const id = bareMatch[1];
      const lowerId = id.toLowerCase();
      if (lowerId.includes('db') || lowerId.includes('database') || lowerId.includes('postgres') || lowerId.includes('sql') || lowerId.includes('mongo')) {
        type = 'database';
      } else if (lowerId.includes('cache') || lowerId.includes('redis') || lowerId.includes('memcached')) {
        type = 'cache';
      } else if (lowerId.includes('gateway') || lowerId.includes('lb') || lowerId.includes('proxy') || lowerId.includes('ingress') || lowerId.includes('envoy') || lowerId.includes('kong')) {
        type = 'gateway';
      } else if (lowerId.includes('client') || lowerId.includes('user') || lowerId.includes('traffic') || lowerId.includes('load')) {
        type = 'load_generator';
      } else {
        type = 'service';
      }

      const name = id.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const capacity = defaultCapacityMap[type] || 2000;
      const workers = defaultWorkerMap[type] || 1;

      return {
        id,
        name,
        type,
        position: { x: 0, y: 0 },
        capacityPerSecond: capacity,
        workerCount: workers,
        enabled: true,
        config: {
          baselineLatencyMs: type === 'database' ? 15 : type === 'cache' ? 2 : 10,
          maxQueueSize: capacity * 2,
          overflowPolicy: 'drop',
          isSource: type === 'load_generator',
        },
      };
    }
    return null;
  }

  const id = nodeMatch[1];
  if (id === 'empty') return null;

  let rawLabel = nodeMatch[2] || id;
  if (
    (rawLabel.startsWith('"') && rawLabel.endsWith('"')) ||
    (rawLabel.startsWith("'") && rawLabel.endsWith("'"))
  ) {
    rawLabel = rawLabel.slice(1, -1);
  }

  const classType = nodeMatch[3];
  if (
    classType &&
    ['load_generator', 'gateway', 'service', 'cache', 'database', 'client'].includes(classType)
  ) {
    type = classType === 'client' ? 'load_generator' : (classType as ComponentType);
  }

  const parts = rawLabel.split(/<br\s*\/?>/i);
  const name = parts[0].trim() || id;

  // Infer type from name if it was classified as generic service
  if (type === 'service') {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('cache') || lowerName.includes('redis') || lowerName.includes('memcached')) {
      type = 'cache';
    } else if (lowerName.includes('database') || lowerName.includes('postgres') || lowerName.includes('sql') || lowerName.includes('mongodb') || lowerName.includes('dynamo')) {
      type = 'database';
    } else if (lowerName.includes('gateway') || lowerName.includes('load balancer') || lowerName.includes('ingress') || lowerName.includes('proxy') || lowerName.includes('envoy') || lowerName.includes('kong')) {
      type = 'gateway';
    } else if (lowerName.includes('client') || lowerName.includes('global users') || lowerName.includes('traffic') || lowerName.includes('incoming load') || lowerName.includes('load generator')) {
      type = 'load_generator';
    }
  }

  let capacity = defaultCapacityMap[type] || 2000;
  let workers = defaultWorkerMap[type] || 1;

  if (parts[1]) {
    const capMatch = parts[1].match(/([\d,]+)\s*req\/s/i);
    if (capMatch) {
      const parsedCap = parseInt(capMatch[1].replace(/,/g, ''), 10);
      if (!isNaN(parsedCap) && parsedCap > 0) capacity = parsedCap;
    }
    const wMatch = parts[1].match(/(\d+)\s*w(?:orker)?/i);
    if (wMatch) {
      const parsedW = parseInt(wMatch[1], 10);
      if (!isNaN(parsedW) && parsedW > 0) workers = parsedW;
    }
  }

  return {
    id,
    name,
    type,
    position: { x: 0, y: 0 },
    capacityPerSecond: capacity,
    workerCount: workers,
    enabled: true,
    config: {
      baselineLatencyMs: type === 'database' ? 15 : type === 'cache' ? 2 : 10,
      maxQueueSize: capacity * 2,
      overflowPolicy: 'drop',
      isSource: type === 'load_generator',
    },
  };
}

/**
 * Parses Mermaid flowchart TD markdown syntax into architecture nodes and edges JSON.
 * Reconstructs nodes, connections, and metadata without calling external LLM.
 */
export function parseMermaidToArchitecture(
  mermaidStr: string
): { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } {
  if (!mermaidStr || typeof mermaidStr !== 'string') {
    return { nodes: [], edges: [] };
  }

  // Strip code block markers if present
  let clean = mermaidStr.trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:mermaid)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  const lines = clean.split('\n');
  const nodesMap = new Map<string, ArchitectureNode>();
  const edges: ArchitectureEdge[] = [];

  const defaultCapacityMap: Record<ComponentType, number> = {
    load_generator: 10000,
    gateway: 5000,
    service: 2000,
    cache: 8000,
    database: 1500,
  };

  const defaultWorkerMap: Record<ComponentType, number> = {
    load_generator: 1,
    gateway: 2,
    service: 3,
    cache: 1,
    database: 1,
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (
      !line ||
      line.startsWith('%%') ||
      line.startsWith('flowchart') ||
      line.startsWith('graph') ||
      line.startsWith('classDef') ||
      line.startsWith('class ') ||
      line.startsWith('subgraph') ||
      line.startsWith('end')
    ) {
      continue;
    }

    // Edge check: e.g. source -->|label| target or source --> target
    // Supports inline node definitions on edges (e.g. A["Client"] --> B["API Gateway"])
    const arrowMatch = line.match(
      /^(.*?)\s*(?:-->|-\.->|==>)\s*(?:\|(?:"?)(.*?)(?:"?)\|\s*)?(.*)$/
    );
    if (arrowMatch) {
      const leftSnippet = arrowMatch[1].trim();
      const rawEdgeLabel = arrowMatch[2] || '';
      const rightSnippet = arrowMatch[3].trim();

      const leftNode = parseNodeSnippet(leftSnippet, defaultCapacityMap, defaultWorkerMap);
      const rightNode = parseNodeSnippet(rightSnippet, defaultCapacityMap, defaultWorkerMap);

      if (leftNode) {
        if (!nodesMap.has(leftNode.id)) nodesMap.set(leftNode.id, leftNode);
      }
      if (rightNode) {
        if (!nodesMap.has(rightNode.id)) nodesMap.set(rightNode.id, rightNode);
      }

      const sourceId = leftNode ? leftNode.id : leftSnippet;
      const targetId = rightNode ? rightNode.id : rightSnippet;

      if (sourceId && targetId && sourceId !== 'empty' && targetId !== 'empty') {
        let multiplier = 1;
        const multMatch = rawEdgeLabel.match(/\((\d+(?:\.\d+)?)x\)/i);
        if (multMatch) {
          multiplier = parseFloat(multMatch[1]);
        }

        edges.push({
          id: `e_${sourceId}_${targetId}`,
          source: sourceId,
          target: targetId,
          requestsPerInput: multiplier,
          enabled: true,
          label: rawEdgeLabel.replace(/\s*\(\d+(?:\.\d+)?x\)/i, '').trim(),
        });
      }
      continue;
    }

    // Standalone Node definition
    const node = parseNodeSnippet(line, defaultCapacityMap, defaultWorkerMap);
    if (node && !nodesMap.has(node.id)) {
      nodesMap.set(node.id, node);
    }
  }

  // Ensure all edge endpoints exist in nodesMap
  for (const edge of edges) {
    if (!nodesMap.has(edge.source)) {
      const dummySource = parseNodeSnippet(edge.source, defaultCapacityMap, defaultWorkerMap);
      if (dummySource) nodesMap.set(edge.source, dummySource);
    }
    if (!nodesMap.has(edge.target)) {
      const dummyTarget = parseNodeSnippet(edge.target, defaultCapacityMap, defaultWorkerMap);
      if (dummyTarget) nodesMap.set(edge.target, dummyTarget);
    }
  }

  const rawNodes = Array.from(nodesMap.values());
  const verticalNodes = toVerticalTree(rawNodes, edges);
  return { nodes: verticalNodes, edges };
}

/**
 * Restores architecture diagram from database payload.
 * Supports:
 * - Direct JSON nodes & edges
 * - Markdown / Mermaid flowchart TD code in DB
 * - Reconstructs the diagram directly without contacting LLM.
 */
export function restoreArchitectureFromDb(
  archData: any,
  promptTitle?: string
): { nodes: ArchitectureNode[]; edges: ArchitectureEdge[]; markdown: string } {
  if (!archData) {
    return { nodes: [], edges: [], markdown: '' };
  }

  // 1. If archData is a string, check if JSON or raw Mermaid Markdown
  if (typeof archData === 'string') {
    const trimmed = archData.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return restoreArchitectureFromDb(parsed, promptTitle);
      } catch {
        // Fall back to mermaid parser
      }
    }
    // Treat as Mermaid markdown
    const parsed = parseMermaidToArchitecture(trimmed);
    return {
      nodes: parsed.nodes,
      edges: parsed.edges,
      markdown: trimmed,
    };
  }

  // 2. If archData has direct nodes array
  const rawNodes: ArchitectureNode[] = archData.nodes || (Array.isArray(archData) ? archData : []);
  const rawEdges: ArchitectureEdge[] = archData.edges || [];

  if (rawNodes.length > 0) {
    const verticalNodes = toVerticalTree(rawNodes, rawEdges);
    const markdown =
      archData.markdown ||
      archData.mermaidCode ||
      generateMermaidDiagram(verticalNodes, rawEdges, promptTitle);
    return {
      nodes: verticalNodes,
      edges: rawEdges,
      markdown,
    };
  }

  // 3. If archData has markdown or mermaidCode but no nodes array
  const markdownSource = archData.markdown || archData.mermaidCode;
  if (markdownSource && typeof markdownSource === 'string') {
    const parsed = parseMermaidToArchitecture(markdownSource);
    return {
      nodes: parsed.nodes,
      edges: parsed.edges,
      markdown: markdownSource,
    };
  }

  return { nodes: [], edges: [], markdown: '' };
}

/**
 * Formats architecture data for database persistence as both JSON and Markdown.
 */
export function formatArchitectureForDb(
  nodes: ArchitectureNode[] = [],
  edges: ArchitectureEdge[] = [],
  promptTitle?: string,
  extra?: {
    basicGraph?: { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] };
    detailedGraph?: { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] };
    incomingTrafficRate?: number;
    durationSeconds?: number;
  }
) {
  const markdownDiagram = generateMermaidDiagram(nodes, edges, promptTitle);
  return {
    nodes,
    edges,
    basicGraph: extra?.basicGraph || { nodes, edges },
    detailedGraph: extra?.detailedGraph,
    markdown: markdownDiagram,
    mermaidCode: markdownDiagram,
    incomingTrafficRate: extra?.incomingTrafficRate || 1000,
    durationSeconds: extra?.durationSeconds || 60,
  };
}

