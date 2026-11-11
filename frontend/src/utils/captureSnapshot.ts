import { ArchitectureNode, ArchitectureEdge, ComponentType, NodeSimulationResult } from '../types';
import { resolveEdgeMode, EdgeMode } from '../components/Canvas/CustomEdge';

/**
 * Fallback helper for drawing rounded rectangles across all canvas environments.
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number | number[]
): void {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    const r = typeof radius === 'number' ? radius : radius[0] || 0;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  }
}

/**
 * Draws high-fidelity vector icons matching CustomNodes.tsx (lucide-react equivalents)
 */
function drawComponentVectorIcon(
  ctx: CanvasRenderingContext2D,
  type: ComponentType,
  cx: number,
  cy: number,
  isDark: boolean
): void {
  ctx.save();
  ctx.strokeStyle = isDark ? '#E2E8F0' : '#334155';
  ctx.fillStyle = isDark ? '#E2E8F0' : '#334155';
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (type) {
    case 'database': {
      // 3-tier cylindrical database disks
      // Top disc
      ctx.beginPath();
      ctx.ellipse(cx, cy - 6, 6.5, 2.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Middle curve
      ctx.beginPath();
      ctx.ellipse(cx, cy, 6.5, 2.5, 0, 0, Math.PI);
      ctx.stroke();

      // Bottom curve
      ctx.beginPath();
      ctx.ellipse(cx, cy + 6, 6.5, 2.5, 0, 0, Math.PI);
      ctx.stroke();

      // Side verticals
      ctx.beginPath();
      ctx.moveTo(cx - 6.5, cy - 6);
      ctx.lineTo(cx - 6.5, cy + 6);
      ctx.moveTo(cx + 6.5, cy - 6);
      ctx.lineTo(cx + 6.5, cy + 6);
      ctx.stroke();
      break;
    }

    case 'cache': {
      // Layers: 3 stacked isometric rhombuses / chevrons
      // Top layer
      ctx.beginPath();
      ctx.moveTo(cx, cy - 7);
      ctx.lineTo(cx + 6.5, cy - 3.5);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx - 6.5, cy - 3.5);
      ctx.closePath();
      ctx.stroke();

      // Middle chevron
      ctx.beginPath();
      ctx.moveTo(cx - 6.5, cy);
      ctx.lineTo(cx, cy + 3.5);
      ctx.lineTo(cx + 6.5, cy);
      ctx.stroke();

      // Bottom chevron
      ctx.beginPath();
      ctx.moveTo(cx - 6.5, cy + 4);
      ctx.lineTo(cx, cy + 7.5);
      ctx.lineTo(cx + 6.5, cy + 4);
      ctx.stroke();
      break;
    }

    case 'gateway': {
      // Globe: circle + equator + central longitude meridian
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.stroke();

      // Equator
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy);
      ctx.lineTo(cx + 7, cy);
      ctx.stroke();

      // Longitude ellipse
      ctx.beginPath();
      ctx.ellipse(cx, cy, 3.2, 7, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'load_generator': {
      // Radio / Broadcast antenna
      // Central dot
      ctx.beginPath();
      ctx.arc(cx, cy + 2, 2, 0, Math.PI * 2);
      ctx.fill();

      // Stem
      ctx.beginPath();
      ctx.moveTo(cx, cy + 4);
      ctx.lineTo(cx, cy + 8);
      ctx.stroke();

      // Radiating wavefront arcs
      ctx.beginPath();
      ctx.arc(cx, cy + 2, 5, -Math.PI * 0.75, -Math.PI * 0.25);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy + 2, 8, -Math.PI * 0.75, -Math.PI * 0.25);
      ctx.stroke();
      break;
    }

    case 'service':
    default: {
      // Server rack unit
      ctx.beginPath();
      drawRoundedRect(ctx, cx - 7.5, cy - 6, 15, 12, 2);
      ctx.stroke();

      // Drive slot lines
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 2);
      ctx.lineTo(cx + 1, cy - 2);
      ctx.moveTo(cx - 5, cy + 2);
      ctx.lineTo(cx + 1, cy + 2);
      ctx.stroke();

      // Status LED
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(cx + 4.5, cy - 2, 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isDark ? '#64748B' : '#94A3B8';
      ctx.beginPath();
      ctx.arc(cx + 4.5, cy + 2, 1.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}

/**
 * Draws status badge matching CustomNodes.tsx (Normal, Warning, Overloaded, Disabled)
 */
function drawStatusBadge(
  ctx: CanvasRenderingContext2D,
  status: 'normal' | 'warning' | 'overloaded' | 'disabled',
  x: number,
  y: number,
  isDark: boolean
): void {
  ctx.save();
  const badgeW = status === 'overloaded' ? 76 : 64;
  const badgeH = 19;
  const radius = 9.5;

  // Background
  ctx.fillStyle = isDark ? '#262626' : '#F1F5F9';
  ctx.beginPath();
  drawRoundedRect(ctx, x, y, badgeW, badgeH, radius);
  ctx.fill();

  // Border
  ctx.strokeStyle = isDark ? '#333333' : '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Icon & Text
  const iconX = x + 8;
  const iconY = y + 9.5;

  if (status === 'overloaded') {
    // Red pulse octagon/circle
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(iconX, iconY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 9.5px Inter, -apple-system, sans-serif';
    ctx.fillStyle = isDark ? '#FCA5A5' : '#DC2626';
    ctx.fillText('Overloaded', x + 16, y + 13);
  } else if (status === 'warning') {
    // Amber warning triangle
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(iconX, iconY - 4);
    ctx.lineTo(iconX + 4, iconY + 3.5);
    ctx.lineTo(iconX - 4, iconY + 3.5);
    ctx.closePath();
    ctx.fill();

    ctx.font = 'bold 9.5px Inter, -apple-system, sans-serif';
    ctx.fillStyle = isDark ? '#FDE68A' : '#D97706';
    ctx.fillText('Warning', x + 16, y + 13);
  } else if (status === 'disabled') {
    // Slate disabled icon
    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.arc(iconX, iconY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '500 9.5px Inter, -apple-system, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('Disabled', x + 16, y + 13);
  } else {
    // Normal CheckCircle2
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.arc(iconX, iconY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Checkmark tick inside
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(iconX - 1.5, iconY);
    ctx.lineTo(iconX - 0.2, iconY + 1.4);
    ctx.lineTo(iconX + 1.8, iconY - 1.2);
    ctx.stroke();

    ctx.font = 'bold 9.5px Inter, -apple-system, sans-serif';
    ctx.fillStyle = isDark ? '#E2E8F0' : '#1E293B';
    ctx.fillText('Normal', x + 16, y + 13);
  }

  ctx.restore();
}

/**
 * Draws users icon (two avatars) matching lucide-react Users icon
 */
function drawUsersIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  color: string
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Primary head
  ctx.beginPath();
  ctx.arc(cx - 2, cy - 2.5, 2, 0, Math.PI * 2);
  ctx.stroke();

  // Primary body shoulder
  ctx.beginPath();
  ctx.arc(cx - 2, cy + 4, 3.5, Math.PI, 0);
  ctx.stroke();

  // Secondary head behind
  ctx.beginPath();
  ctx.arc(cx + 3.5, cy - 3.5, 1.6, 0, Math.PI * 2);
  ctx.stroke();

  // Secondary body shoulder
  ctx.beginPath();
  ctx.arc(cx + 3.5, cy + 3, 2.5, Math.PI * 1.2, 0);
  ctx.stroke();

  ctx.restore();
}

const SUBMODULE_THEMES: Record<string, { bg: string; text: string; border: string }> = {
  entrypoint: { bg: 'rgba(99, 102, 241, 0.16)', text: '#818CF8', border: 'rgba(99, 102, 241, 0.35)' },
  middleware: { bg: 'rgba(245, 158, 11, 0.16)', text: '#FBBF24', border: 'rgba(245, 158, 11, 0.35)' },
  controller: { bg: 'rgba(14, 165, 233, 0.16)', text: '#38BDF8', border: 'rgba(14, 165, 233, 0.35)' },
  service_logic: { bg: 'rgba(168, 85, 247, 0.16)', text: '#C084FC', border: 'rgba(168, 85, 247, 0.35)' },
  model: { bg: 'rgba(16, 185, 129, 0.16)', text: '#34D399', border: 'rgba(16, 185, 129, 0.35)' },
  cache_client: { bg: 'rgba(249, 115, 22, 0.16)', text: '#FB923C', border: 'rgba(249, 115, 22, 0.35)' },
  worker: { bg: 'rgba(20, 184, 166, 0.16)', text: '#2DD4BF', border: 'rgba(20, 184, 166, 0.35)' },
  external_api: { bg: 'rgba(244, 63, 94, 0.16)', text: '#FB7185', border: 'rgba(244, 63, 94, 0.35)' },
  component: { bg: 'rgba(59, 130, 246, 0.16)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.35)' },
};

/**
 * Generates a high-resolution, export-quality snapshot of the architecture design
 * directly to a PNG Data URL using HTML5 Canvas.
 * Matches CustomNodes.tsx and React Flow canvas design 1:1.
 */
export async function captureArchitectureSnapshot(
  nodes: ArchitectureNode[] = [],
  edges: ArchitectureEdge[] = [],
  projectName: string = 'System Design',
  isDark: boolean = true,
  nodeResults?: Record<string, NodeSimulationResult>
): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Exact card dimensions matching CustomNodes.tsx (w-64 = 256px)
  const nodeWidth = 256;
  const nodeHeight = 116;

  let minX = 0;
  let maxX = 850;
  let minY = 0;
  let maxY = 450;

  if (nodes.length > 0) {
    minX = Math.min(...nodes.map((n) => n.position?.x ?? 0));
    maxX = Math.max(...nodes.map((n) => (n.position?.x ?? 0) + nodeWidth));
    minY = Math.min(...nodes.map((n) => n.position?.y ?? 0));
    maxY = Math.max(...nodes.map((n) => (n.position?.y ?? 0) + nodeHeight));
  }

  const paddingX = 100;
  const paddingY = 100;
  const headerHeight = 70;
  const graphWidth = maxX - minX;
  const graphHeight = maxY - minY;

  const targetWidth = Math.max(1280, graphWidth + paddingX * 2);
  const targetHeight = Math.max(760, graphHeight + paddingY * 2 + headerHeight);

  // Set 2x resolution for retina / crystal-clear high-DPI feed posts
  const scale = 2;
  canvas.width = targetWidth * scale;
  canvas.height = targetHeight * scale;
  ctx.scale(scale, scale);

  // 1. Solid Canvas Background
  ctx.fillStyle = isDark ? '#0A0A0A' : '#F8FAFC';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // 2. React Flow Signature Dot Matrix Grid (BackgroundVariant.Dots)
  ctx.fillStyle = isDark ? '#262626' : '#CBD5E1';
  ctx.beginPath();
  const dotGap = 24;
  const dotRadius = 1.5;
  for (let x = dotGap; x < targetWidth; x += dotGap) {
    for (let y = dotGap; y < targetHeight; y += dotGap) {
      ctx.moveTo(x + dotRadius, y);
      ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
    }
  }
  ctx.fill();

  // 3. Floating Glassmorphic Header Capsules
  // Left Capsule: Brand & Project Name
  const pillY = 24;
  const pillHeight = 42;
  const brandPillWidth = Math.min(620, Math.max(380, projectName.length * 9 + 210));

  ctx.save();
  ctx.fillStyle = isDark ? 'rgba(20, 20, 22, 0.88)' : 'rgba(255, 255, 255, 0.92)';
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  drawRoundedRect(ctx, 36, pillY, brandPillWidth, pillHeight, 21);
  ctx.fill();
  ctx.stroke();

  // Logo Badge (Gradient Blue Square)
  const logoGrad = ctx.createLinearGradient(48, pillY + 8, 74, pillY + 34);
  logoGrad.addColorStop(0, '#6366F1');
  logoGrad.addColorStop(1, '#0284C7');
  ctx.fillStyle = logoGrad;
  ctx.beginPath();
  drawRoundedRect(ctx, 46, pillY + 8, 26, 26, 7);
  ctx.fill();

  // Lightning bolt symbol
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.fillText('⚡', 52, pillY + 26);

  // Brand Name
  ctx.font = 'bold 13.5px Inter, -apple-system, sans-serif';
  ctx.fillStyle = isDark ? '#FFFFFF' : '#0F172A';
  ctx.fillText('GitToScale', 80, pillY + 26);

  // Dot separator
  ctx.fillStyle = isDark ? '#52525B' : '#94A3B8';
  ctx.fillText('·', 154, pillY + 26);

  // Project title
  ctx.font = '600 13px Inter, -apple-system, sans-serif';
  ctx.fillStyle = isDark ? '#CBD5E1' : '#334155';
  const displayTitle = (projectName || 'System Architecture').slice(0, 36);
  ctx.fillText(displayTitle, 166, pillY + 26);
  ctx.restore();

  // Right Capsule: Stats & Status
  const statsPillWidth = 240;
  const statsX = targetWidth - statsPillWidth - 36;
  ctx.save();
  ctx.fillStyle = isDark ? 'rgba(20, 20, 22, 0.88)' : 'rgba(255, 255, 255, 0.92)';
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  drawRoundedRect(ctx, statsX, pillY, statsPillWidth, pillHeight, 21);
  ctx.fill();
  ctx.stroke();

  // Stat badges inside right pill
  ctx.font = '600 11.5px Inter, -apple-system, sans-serif';
  ctx.fillStyle = '#6366F1';
  ctx.fillText(`${nodes.length} Nodes`, statsX + 22, pillY + 26);

  ctx.fillStyle = isDark ? '#52525B' : '#94A3B8';
  ctx.fillText('·', statsX + 80, pillY + 26);

  ctx.fillStyle = isDark ? '#94A3B8' : '#64748B';
  ctx.fillText(`${edges.length} Edges`, statsX + 92, pillY + 26);

  ctx.fillStyle = isDark ? '#52525B' : '#94A3B8';
  ctx.fillText('·', statsX + 148, pillY + 26);

  // Live Pulse Dot
  ctx.fillStyle = '#10B981';
  ctx.beginPath();
  ctx.arc(statsX + 163, pillY + 21, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '600 11px Inter, -apple-system, sans-serif';
  ctx.fillStyle = isDark ? '#E2E8F0' : '#1E293B';
  ctx.fillText('Live Model', statsX + 172, pillY + 25);
  ctx.restore();

  // Centering offsets for graph nodes & edges
  const offsetX = (targetWidth - graphWidth) / 2 - minX;
  const offsetY = (targetHeight - headerHeight - graphHeight) / 2 - minY + headerHeight;

  // 4. Draw React Flow Edges (Connections)
  edges.forEach((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    if (!sourceNode || !targetNode) return;

    const snx = (sourceNode.position?.x ?? 0) + offsetX;
    const sny = (sourceNode.position?.y ?? 0) + offsetY;
    const tnx = (targetNode.position?.x ?? 0) + offsetX;
    const tny = (targetNode.position?.y ?? 0) + offsetY;

    // React Flow handle resolution
    let sx = snx + nodeWidth;
    let sy = sny + nodeHeight / 2;
    let tx = tnx;
    let ty = tny + nodeHeight / 2;

    // If source and target are stacked vertically
    if (tny >= sny + nodeHeight && Math.abs(tnx - snx) < 160) {
      sx = snx + nodeWidth / 2;
      sy = sny + nodeHeight;
      tx = tnx + nodeWidth / 2;
      ty = tny;
    } else if (tnx < snx - 120) {
      sx = snx;
      sy = sny + nodeHeight / 2;
      tx = tnx + nodeWidth;
      ty = tny + nodeHeight / 2;
    }

    const isExternal = Boolean((edge as unknown as { isExternal?: boolean }).isExternal);
    const mode: EdgeMode = resolveEdgeMode(edge.communicationType || edge.label, isExternal, edge.enabled ?? true);
    const baseColor = isDark ? '#FFFFFF' : '#000000';
    const edgeColor = mode === 'disabled' ? (isDark ? '#525252' : '#A3A3A3') : baseColor;

    ctx.save();
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = mode === 'queue' || mode === 'grpc' ? 2.2 : 2.0;

    // Dash pattern matching CustomEdge.tsx
    if (mode === 'queue') {
      ctx.setLineDash([7, 4]);
    } else if (mode === 'external') {
      ctx.setLineDash([6, 4]);
    } else if (mode === 'websocket') {
      ctx.setLineDash([4, 3]);
    } else if (mode === 'disabled') {
      ctx.setLineDash([4, 4]);
    } else {
      ctx.setLineDash([]);
    }

    // Smooth Bezier Curve calculation
    const dx = tx - sx;
    const dy = ty - sy;
    let cp1x = sx + dx * 0.45;
    let cp1y = sy;
    let cp2x = tx - dx * 0.45;
    let cp2y = ty;

    if (sy === sny + nodeHeight && ty === tny) {
      // Vertical flow
      cp1x = sx;
      cp1y = sy + dy * 0.45;
      cp2x = tx;
      cp2y = ty - dy * 0.45;
    }

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, tx, ty);
    ctx.stroke();

    // Directional Arrowhead marker at target
    const angle = Math.atan2(ty - cp2y, tx - cp2x);
    const arrowLen = 9;
    ctx.fillStyle = edgeColor;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx - arrowLen * Math.cos(angle - Math.PI / 6), ty - arrowLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(tx - arrowLen * Math.cos(angle + Math.PI / 6), ty - arrowLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    // Protocol / Communication Badge at midpoint (t = 0.5)
    const tVal = 0.5;
    const midX =
      Math.pow(1 - tVal, 3) * sx +
      3 * Math.pow(1 - tVal, 2) * tVal * cp1x +
      3 * (1 - tVal) * Math.pow(tVal, 2) * cp2x +
      Math.pow(tVal, 3) * tx;
    const midY =
      Math.pow(1 - tVal, 3) * sy +
      3 * Math.pow(1 - tVal, 2) * tVal * cp1y +
      3 * (1 - tVal) * Math.pow(tVal, 2) * cp2y +
      Math.pow(tVal, 3) * ty;

    const commLabel = (edge.label || edge.communicationType || (mode !== 'http' ? mode : '')).toUpperCase();
    if (commLabel) {
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      const labelMetrics = ctx.measureText(commLabel);
      const badgeW = labelMetrics.width + 20;
      const badgeH = 20;

      // Badge Container
      ctx.fillStyle = isDark ? '#141416' : '#FFFFFF';
      ctx.strokeStyle = isDark ? '#27272A' : '#CBD5E1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      drawRoundedRect(ctx, midX - badgeW / 2, midY - badgeH / 2, badgeW, badgeH, 6);
      ctx.fill();
      ctx.stroke();

      // Communication Protocol Dot
      let dotColor = '#8B5CF6'; // default purple
      if (mode === 'queue') dotColor = '#F59E0B';
      else if (mode === 'grpc') dotColor = '#10B981';
      else if (mode === 'db') dotColor = '#3B82F6';
      else if (mode === 'cache') dotColor = '#F97316';
      else if (mode === 'websocket') dotColor = '#06B6D4';

      ctx.fillStyle = dotColor;
      ctx.beginPath();
      ctx.arc(midX - badgeW / 2 + 8, midY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Text
      ctx.fillStyle = isDark ? '#E2E8F0' : '#1E293B';
      ctx.fillText(commLabel, midX - badgeW / 2 + 14, midY + 3.2);
    }

    ctx.restore();
  });

  // 5. Draw React Flow Node Cards (1:1 with CustomNodes.tsx)
  nodes.forEach((node) => {
    const nx = (node.position?.x ?? 0) + offsetX;
    const ny = (node.position?.y ?? 0) + offsetY;

    const result = nodeResults?.[node.id];
    const status: 'normal' | 'warning' | 'overloaded' | 'disabled' =
      result?.status || (node.enabled !== false ? 'normal' : 'disabled');

    const offered = result?.offeredRequestsPerSecond ?? 0;
    const capacity = result?.effectiveCapacity ?? (node.capacityPerSecond * (node.workerCount || 1));
    const utilization = result?.offeredUtilization ?? 0;
    const isSource = node.type === 'load_generator';
    const workerCount = node.workerCount || 1;

    ctx.save();

    // 5A. Card Elevation Shadow
    ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(15, 23, 42, 0.08)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 4;

    // 5B. Card Surface Background
    let cardBg = isDark ? '#141416' : '#FFFFFF';
    if (status === 'overloaded') {
      cardBg = isDark ? '#1A0C0E' : '#FEF2F2';
    } else if (status === 'warning') {
      cardBg = isDark ? '#1C150B' : '#FFFBEB';
    } else if (status === 'disabled') {
      cardBg = isDark ? '#0A0A0A' : '#F8FAFC';
    }

    ctx.fillStyle = cardBg;
    ctx.beginPath();
    drawRoundedRect(ctx, nx, ny, nodeWidth, nodeHeight, 12);
    ctx.fill();

    // Reset shadow before drawing borders & contents
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 5C. Card Border
    let borderColor = isDark ? '#262626' : '#E2E8F0';
    let borderWidth = 1;
    if (status === 'overloaded') {
      borderColor = isDark ? 'rgba(239, 68, 68, 0.85)' : '#EF4444';
      borderWidth = 1.5;
    } else if (status === 'warning') {
      borderColor = isDark ? 'rgba(245, 158, 11, 0.85)' : '#F59E0B';
      borderWidth = 1.5;
    } else if (status === 'disabled') {
      borderColor = isDark ? '#1E293B' : '#E2E8F0';
    }

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.stroke();

    // 5D. Connection Handles (React Flow circular ports)
    const drawHandle = (hx: number, hy: number) => {
      ctx.fillStyle = '#94A3B8';
      ctx.beginPath();
      ctx.arc(hx, hy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isDark ? '#141416' : '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    // Right handle (outbound)
    drawHandle(nx + nodeWidth, ny + nodeHeight / 2);

    // Left, Top, Bottom handles (inbound targets for non-source)
    if (!isSource) {
      drawHandle(nx, ny + nodeHeight / 2);
      drawHandle(nx + nodeWidth / 2, ny);
      drawHandle(nx + nodeWidth / 2, ny + nodeHeight);
    }

    // 5E. Node Header Row (Icon Container + Title + Subtitle + Status Pill)
    // Icon Box
    const iconBoxX = nx + 12;
    const iconBoxY = ny + 12;
    const iconBoxSize = 28;
    ctx.fillStyle = isDark ? '#1E2028' : '#F1F5F9';
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    drawRoundedRect(ctx, iconBoxX, iconBoxY, iconBoxSize, iconBoxSize, 8);
    ctx.fill();
    ctx.stroke();

    // Icon Vector
    drawComponentVectorIcon(
      ctx,
      node.type,
      iconBoxX + iconBoxSize / 2,
      iconBoxY + iconBoxSize / 2,
      isDark
    );

    // Node Title (Truncated if necessary)
    const titleX = nx + 47;
    const titleY = ny + 23;
    ctx.font = 'bold 12px Inter, -apple-system, sans-serif';
    ctx.fillStyle = isDark ? '#F1F5F9' : '#0F172A';
    const cleanTitle = (node.name || node.id).slice(0, 18);
    ctx.fillText(cleanTitle, titleX, titleY);

    // Subtitle: Submodule badge or category
    const subType = node.submoduleType || (node.config?.submoduleType as string | undefined);
    const subtheme = subType ? SUBMODULE_THEMES[subType] : null;

    if (subtheme && subType) {
      const badgeText = subType.replace('_', ' ').toUpperCase();
      ctx.font = 'bold 8px Inter, sans-serif';
      const bMetrics = ctx.measureText(badgeText);
      const bW = bMetrics.width + 8;
      const bH = 14;
      const bY = ny + 27;

      ctx.fillStyle = subtheme.bg;
      ctx.strokeStyle = subtheme.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      drawRoundedRect(ctx, titleX, bY, bW, bH, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = subtheme.text;
      ctx.fillText(badgeText, titleX + 4, bY + 10);
    } else {
      const categoryText = (node.config?.category as string) || node.type.replace('_', ' ').toUpperCase();
      ctx.font = '500 8.5px JetBrains Mono, monospace';
      ctx.fillStyle = isDark ? '#64748B' : '#94A3B8';
      ctx.fillText(categoryText.slice(0, 20), titleX, ny + 37);
    }

    // Status Badge Pill (Right side)
    const statusPillW = status === 'overloaded' ? 76 : 64;
    const statusPillX = nx + nodeWidth - statusPillW - 12;
    drawStatusBadge(ctx, status, statusPillX, ny + 12, isDark);

    // 5F. Load & Capacity Metrics Strip
    const metricLabelY = ny + 59;
    ctx.font = '500 10px Inter, -apple-system, sans-serif';
    ctx.fillStyle = isDark ? '#94A3B8' : '#64748B';
    ctx.fillText(isSource ? 'Outbound Rate' : 'Load / Capacity', nx + 14, metricLabelY);

    const metricValue = isSource
      ? `${Math.round(offered).toLocaleString()} req/s`
      : `${Math.round(offered).toLocaleString()} / ${Math.round(capacity).toLocaleString()}`;
    ctx.font = 'bold 10.5px JetBrains Mono, monospace';
    ctx.fillStyle = isDark ? '#F1F5F9' : '#0F172A';
    const valueMetrics = ctx.measureText(metricValue);
    ctx.fillText(metricValue, nx + nodeWidth - 14 - valueMetrics.width, metricLabelY);

    // 5G. Utilization Progress Bar (Non-sources)
    if (!isSource) {
      const barX = nx + 14;
      const barY = ny + 69;
      const barW = nodeWidth - 28;
      const barH = 5.5;

      // Track
      ctx.fillStyle = isDark ? '#1E2028' : '#F1F5F9';
      ctx.beginPath();
      drawRoundedRect(ctx, barX, barY, barW, barH, 2.75);
      ctx.fill();

      // Progress Fill
      const fillW = Math.max(0, Math.min(barW, (utilization / 100) * barW));
      if (fillW > 0) {
        let barColor = '#10B981'; // emerald
        if (status === 'overloaded') barColor = '#EF4444';
        else if (status === 'warning') barColor = '#F59E0B';

        ctx.fillStyle = barColor;
        ctx.beginPath();
        drawRoundedRect(ctx, barX, barY, fillW, barH, 2.75);
        ctx.fill();
      }

      // 5H. Worker Count & Util Percentage Row
      const subBarY = ny + 93;

      // Users icon
      drawUsersIcon(ctx, nx + 19, subBarY - 3, isDark ? '#64748B' : '#94A3B8');

      ctx.font = '500 9.5px Inter, -apple-system, sans-serif';
      ctx.fillStyle = isDark ? '#94A3B8' : '#64748B';
      ctx.fillText(`${workerCount} ${workerCount === 1 ? 'worker' : 'workers'}`, nx + 28, subBarY);

      // Util percentage
      const utilText = `${utilization.toFixed(0)}% util`;
      ctx.font = '600 10px JetBrains Mono, monospace';
      ctx.fillStyle = isDark ? '#CBD5E1' : '#334155';
      const utilMetrics = ctx.measureText(utilText);
      ctx.fillText(utilText, nx + nodeWidth - 14 - utilMetrics.width, subBarY);
    } else {
      // For load_generator: Show active virtual users subtitle
      const subBarY = ny + 85;
      drawUsersIcon(ctx, nx + 19, subBarY - 3, '#6366F1');

      ctx.font = '500 10px Inter, -apple-system, sans-serif';
      ctx.fillStyle = '#6366F1';
      ctx.fillText('Traffic Injector · Constant Throughput', nx + 28, subBarY);
    }

    ctx.restore();
  });

  // 6. Subtle Watermark Footer (bottom left)
  ctx.save();
  ctx.font = '500 10.5px Inter, -apple-system, sans-serif';
  ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)';
  ctx.fillText('⚡ Created with GitToScale · System Architecture & Scaling Simulator', 36, targetHeight - 20);
  ctx.restore();

  return canvas.toDataURL('image/png');
}
