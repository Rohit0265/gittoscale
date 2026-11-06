import { ArchitectureNode, ArchitectureEdge, ComponentType } from '../types';
import { toVerticalTree } from './treeLayout';

/**
 * Generates valid Mermaid flowchart syntax from architecture nodes and edges.
 */
export function generateMermaidDiagram(
  nodes: ArchitectureNode[] = [],
  edges: ArchitectureEdge[] = [],
  title?: string
): string {
  const lines: string[] = ['flowchart TD'];

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

  // 1. Declare nodes with appropriate semantic shapes
  nodes.forEach((node) => {
    const sId = sanitizeId(node.id);
    const safeName = (node.name || node.id).replace(/"/g, "'");
    const safeCapacity = `${Number(node.capacityPerSecond || 0).toLocaleString()} req/s`;
    const label = `"${safeName}<br/><small style='opacity:0.8'>${safeCapacity} · ${node.workerCount || 1}w</small>"`;

    switch (node.type) {
      case 'database':
        // Cylinder for database
        lines.push(`  ${sId}[(${label})]:::database`);
        break;
      case 'cache':
        // Subroutine / database box for cache
        lines.push(`  ${sId}[[${label}]]:::cache`);
        break;
      case 'gateway':
        // Stadium shape for entry gateway
        lines.push(`  ${sId}([${label}]):::gateway`);
        break;
      case 'load_generator':
        // Asymmetric / Parallelogram for user client traffic
        lines.push(`  ${sId}[/${label}/\\]:::client`);
        break;
      case 'service':
      default:
        // Standard rectangle for microservice / worker
        lines.push(`  ${sId}[${label}]:::service`);
        break;
    }
  });

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

    if (fullLabel) {
      lines.push(`  ${sSource} -->|"${fullLabel}"| ${sTarget}`);
    } else {
      lines.push(`  ${sSource} --> ${sTarget}`);
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

  return lines.join('\n');
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
      line.startsWith('class ')
    ) {
      continue;
    }

    // Edge check: e.g. source -->|label| target or source --> target
    const edgeMatch = line.match(
      /^([a-zA-Z0-9_-]+)\s*(?:-->|-\.->|==>)\s*(?:\|(?:"?)(.*?)(?:"?)\|\s*)?([a-zA-Z0-9_-]+)/
    );
    if (edgeMatch) {
      const sourceId = edgeMatch[1];
      const rawEdgeLabel = edgeMatch[2] || '';
      const targetId = edgeMatch[3];

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
      continue;
    }

    // Node check with shapes
    // 1. Database: id[(label)]
    let nodeMatch = line.match(/^([a-zA-Z0-9_-]+)\[\((.*?)\)\](?:::([a-zA-Z0-9_-]+))?/);
    let type: ComponentType = 'database';
    if (!nodeMatch) {
      // 2. Cache: id[[label]]
      nodeMatch = line.match(/^([a-zA-Z0-9_-]+)\[\[(.*?)\]\](?:::([a-zA-Z0-9_-]+))?/);
      type = 'cache';
    }
    if (!nodeMatch) {
      // 3. Gateway: id([label])
      nodeMatch = line.match(/^([a-zA-Z0-9_-]+)\(\[(.*?)\]\)(?:::([a-zA-Z0-9_-]+))?/);
      type = 'gateway';
    }
    if (!nodeMatch) {
      // 4. Client / load generator: id[/label/\]
      nodeMatch = line.match(/^([a-zA-Z0-9_-]+)\[\/(.*?)\/\\\](?:::([a-zA-Z0-9_-]+))?/);
      type = 'load_generator';
    }
    if (!nodeMatch) {
      // 5. Standard Service box: id[label]
      nodeMatch = line.match(/^([a-zA-Z0-9_-]+)\[(.*?)\](?:::([a-zA-Z0-9_-]+))?/);
      type = 'service';
    }

    if (nodeMatch) {
      const id = nodeMatch[1];
      if (id === 'empty') continue;

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

      nodesMap.set(id, {
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
      });
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

