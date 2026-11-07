import { ArchitectureNode, ArchitectureEdge, ComponentType } from '../types';

const COMPONENT_COLORS: Record<ComponentType, { border: string; bg: string; badgeBg: string; text: string }> = {
  database: { border: '#3B82F6', bg: '#1E293B', badgeBg: '#1D4ED8', text: '#60A5FA' },
  cache: { border: '#F59E0B', bg: '#292524', badgeBg: '#B45309', text: '#FBBF24' },
  service: { border: '#10B981', bg: '#142E28', badgeBg: '#047857', text: '#34D399' },
  gateway: { border: '#8B5CF6', bg: '#231D36', badgeBg: '#6D28D9', text: '#A78BFA' },
  load_generator: { border: '#EC4899', bg: '#331D2C', badgeBg: '#BE185D', text: '#F472B6' },
};

/**
 * Generates a high-resolution, export-quality snapshot of the architecture design
 * directly to a PNG Data URL using HTML5 Canvas.
 */
export async function captureArchitectureSnapshot(
  nodes: ArchitectureNode[] = [],
  edges: ArchitectureEdge[] = [],
  projectName: string = 'System Design',
  isDark: boolean = true
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Calculate bounding box of all nodes
  const nodeWidth = 200;
  const nodeHeight = 85;

  let minX = 0;
  let maxX = 800;
  let minY = 0;
  let maxY = 450;

  if (nodes.length > 0) {
    minX = Math.min(...nodes.map((n) => n.position?.x ?? 0));
    maxX = Math.max(...nodes.map((n) => (n.position?.x ?? 0) + nodeWidth));
    minY = Math.min(...nodes.map((n) => n.position?.y ?? 0));
    maxY = Math.max(...nodes.map((n) => (n.position?.y ?? 0) + nodeHeight));
  }

  const padding = 80;
  const graphWidth = maxX - minX;
  const graphHeight = maxY - minY;

  const targetWidth = Math.max(1200, graphWidth + padding * 2);
  const targetHeight = Math.max(675, graphHeight + padding * 2 + 100);

  // Set 2x resolution for retina / high-DPI display
  const scale = 2;
  canvas.width = targetWidth * scale;
  canvas.height = targetHeight * scale;
  ctx.scale(scale, scale);

  // 1. Background
  ctx.fillStyle = isDark ? '#0A0C10' : '#F8FAFC';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // 2. Subtle Grid Pattern
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)';
  ctx.lineWidth = 1;
  const gridSize = 24;
  for (let x = 0; x < targetWidth; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, targetHeight);
    ctx.stroke();
  }
  for (let y = 0; y < targetHeight; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(targetWidth, y);
    ctx.stroke();
  }

  // 3. Header Card
  const headerHeight = 70;
  ctx.fillStyle = isDark ? 'rgba(18, 20, 29, 0.85)' : 'rgba(255, 255, 255, 0.9)';
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(40, 25, targetWidth - 80, headerHeight, 16);
  ctx.fill();
  ctx.stroke();

  // Header Title & Logo
  ctx.font = 'bold 18px Inter, -apple-system, sans-serif';
  ctx.fillStyle = isDark ? '#FFFFFF' : '#0F172A';
  ctx.fillText(projectName || 'GitToScale System Design', 65, 57);

  // Stats badge
  const statsText = `${nodes.length} Components · ${edges.length} Connections`;
  ctx.font = '500 12px JetBrains Mono, monospace';
  ctx.fillStyle = isDark ? '#94A3B8' : '#64748B';
  ctx.fillText(statsText, 65, 78);

  // Branding Pill (right of header)
  ctx.fillStyle = '#4F46E5';
  ctx.beginPath();
  const brandX = targetWidth - 190;
  ctx.roundRect(brandX, 42, 125, 30, 8);
  ctx.fill();
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('GitToScale ⚡', brandX + 16, 62);

  // Centering offsets for graph
  const offsetX = (targetWidth - graphWidth) / 2 - minX;
  const offsetY = (targetHeight - 120 - graphHeight) / 2 - minY + 90;

  // 4. Draw Edges (Connections)
  edges.forEach((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    if (!sourceNode || !targetNode) return;

    const sx = (sourceNode.position?.x ?? 0) + offsetX + nodeWidth / 2;
    const sy = (sourceNode.position?.y ?? 0) + offsetY + nodeHeight / 2;
    const tx = (targetNode.position?.x ?? 0) + offsetX + nodeWidth / 2;
    const ty = (targetNode.position?.y ?? 0) + offsetY + nodeHeight / 2;

    ctx.strokeStyle = isDark ? '#475569' : '#94A3B8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);

    // Smooth Bezier Curve
    const dx = tx - sx;
    const dy = ty - sy;
    const cx1 = sx + dx * 0.4;
    const cy1 = sy;
    const cx2 = sx + dx * 0.6;
    const cy2 = ty;
    ctx.bezierCurveTo(cx1, cy1, cx2, cy2, tx, ty);
    ctx.stroke();

    // Arrowhead at target
    const angle = Math.atan2(ty - cy2, tx - cx2);
    const arrowLen = 10;
    ctx.fillStyle = isDark ? '#475569' : '#94A3B8';
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx - arrowLen * Math.cos(angle - Math.PI / 6), ty - arrowLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(tx - arrowLen * Math.cos(angle + Math.PI / 6), ty - arrowLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    // Label if present
    if (edge.label || edge.communicationType) {
      const midX = (sx + tx) / 2;
      const midY = (sy + ty) / 2;
      const lbl = (edge.label || edge.communicationType || '').toUpperCase();
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      const textMetrics = ctx.measureText(lbl);
      const badgeW = textMetrics.width + 12;
      const badgeH = 18;

      ctx.fillStyle = isDark ? '#1E293B' : '#E2E8F0';
      ctx.beginPath();
      ctx.roundRect(midX - badgeW / 2, midY - badgeH / 2, badgeW, badgeH, 4);
      ctx.fill();

      ctx.fillStyle = isDark ? '#94A3B8' : '#475569';
      ctx.fillText(lbl, midX - textMetrics.width / 2, midY + 3);
    }
  });

  // 5. Draw Nodes
  nodes.forEach((node) => {
    const nx = (node.position?.x ?? 0) + offsetX;
    const ny = (node.position?.y ?? 0) + offsetY;
    const colors = COMPONENT_COLORS[node.type] || COMPONENT_COLORS.service;

    // Node Box Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    // Node Box Background
    ctx.fillStyle = isDark ? '#11141C' : '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(nx, ny, nodeWidth, nodeHeight, 12);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Node Border
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Top Header: Type Badge
    ctx.fillStyle = colors.badgeBg;
    ctx.beginPath();
    ctx.roundRect(nx + 12, ny + 10, 68, 18, 4);
    ctx.fill();

    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(node.type.toUpperCase(), nx + 18, ny + 23);

    // Node Title
    ctx.font = 'bold 13px Inter, -apple-system, sans-serif';
    ctx.fillStyle = isDark ? '#FFFFFF' : '#0F172A';
    const cleanName = (node.name || node.id).slice(0, 22);
    ctx.fillText(cleanName, nx + 12, ny + 48);

    // Node Metrics
    const capacityText = `${Number(node.capacityPerSecond || 0).toLocaleString()} req/s · ${node.workerCount || 1}w`;
    ctx.font = '500 11px JetBrains Mono, monospace';
    ctx.fillStyle = isDark ? '#94A3B8' : '#64748B';
    ctx.fillText(capacityText, nx + 12, ny + 68);
  });

  // 6. Footer Watermark
  ctx.font = '500 11px Inter, sans-serif';
  ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.4)';
  ctx.fillText('Generated with GitToScale · System Architecture & Scaling Simulator', 40, targetHeight - 20);

  return canvas.toDataURL('image/png');
}
