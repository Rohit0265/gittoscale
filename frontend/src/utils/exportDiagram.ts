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

