import { ArchitectureNode, ComponentType } from '../types';

export type CloudProvider = 'aws' | 'gcp' | 'azure';

export interface CostCategoryItem {
  id: string;
  name: string;
  type: ComponentType;
  units: number;
  unitLabel: string;
  monthlyCost: number;
  details: string;
}

export interface CostCategoryBreakdown {
  category: string;
  subtotal: number;
  items: CostCategoryItem[];
}

export interface CloudCostEstimate {
  provider: CloudProvider;
  providerName: string;
  totalMonthlyCost: number;
  totalHourlyCost: number;
  costPer1kRequests: number;
  dataEgressGbPerMonth: number;
  categories: CostCategoryBreakdown[];
  recommendation: string;
}

export interface ScalePricePoint {
  trafficRps: number;
  label: string;
  percentOfMaxCapacity: number;
  isCurrentTraffic?: boolean;
  isMaxCapacity?: boolean;
  awsCost: number;
  gcpCost: number;
  azureCost: number;
}

export interface MultiCloudComparison {
  aws: CloudCostEstimate;
  gcp: CloudCostEstimate;
  azure: CloudCostEstimate;
  cheapestProvider: CloudProvider;
  savingsMonthlyVsAws: {
    gcp: number;
    azure: number;
  };
  maxSystemCapacityRps: number;
  scalePricePoints: ScalePricePoint[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Real-world public cloud pricing tiers (US-East / us-central on-demand rates)
// ─────────────────────────────────────────────────────────────────────────────
const PROVIDER_NAMES: Record<CloudProvider, string> = {
  aws: 'Amazon Web Services (AWS)',
  gcp: 'Google Cloud Platform (GCP)',
  azure: 'Microsoft Azure',
};

/**
 * Calculates instance specifications and costs for microservice worker fleets
 * based on the target capacity per second of each service.
 */
function getComputeTier(capacityPerSecond: number, provider: CloudProvider) {
  let spec = '2 vCPU, 4GB RAM';
  const tierMap = {
    aws: { name: 't4g.medium', costPerWorker: 24.48 },
    gcp: { name: 'e2-medium', costPerWorker: 22.80 },
    azure: { name: 'B2s', costPerWorker: 25.20 },
  };

  if (capacityPerSecond > 4500) {
    spec = '8 vCPU, 16GB RAM (High Compute)';
    tierMap.aws = { name: 'c6g.2xlarge', costPerWorker: 97.92 };
    tierMap.gcp = { name: 'c2-standard-8', costPerWorker: 91.20 };
    tierMap.azure = { name: 'F8s v2', costPerWorker: 100.80 };
  } else if (capacityPerSecond > 1500) {
    spec = '4 vCPU, 8GB RAM (Compute Optimized)';
    tierMap.aws = { name: 'c6g.xlarge', costPerWorker: 48.96 };
    tierMap.gcp = { name: 'c2-standard-4', costPerWorker: 45.60 };
    tierMap.azure = { name: 'F4s v2', costPerWorker: 50.40 };
  }

  return { spec, ...tierMap[provider] };
}

/**
 * Calculates database tier and high-availability storage costs
 * based on transactional throughput requirements.
 */
function getDatabaseTier(capacityPerSecond: number, provider: CloudProvider) {
  let spec = '2 vCPU, 8GB RAM + 100GB SSD';
  const tierMap = {
    aws: { name: 'RDS PostgreSQL db.r6g.large', costPerUnit: 134.0 },
    gcp: { name: 'Cloud SQL PostgreSQL 2 vCPU', costPerUnit: 122.0 },
    azure: { name: 'PostgreSQL Flexible 2 vCPU', costPerUnit: 128.0 },
  };

  if (capacityPerSecond > 4500) {
    spec = '8 vCPU, 32GB RAM (I/O Optimized Aurora)';
    tierMap.aws = { name: 'Amazon Aurora Provisioned', costPerUnit: 480.0 };
    tierMap.gcp = { name: 'AlloyDB Enterprise HA', costPerUnit: 440.0 };
    tierMap.azure = { name: 'PostgreSQL Hyperscale', costPerUnit: 460.0 };
  } else if (capacityPerSecond > 1500) {
    spec = '4 vCPU, 16GB RAM (Multi-AZ Standby)';
    tierMap.aws = { name: 'RDS db.r6g.xlarge Multi-AZ', costPerUnit: 268.0 };
    tierMap.gcp = { name: 'Cloud SQL HA 4 vCPU', costPerUnit: 244.0 };
    tierMap.azure = { name: 'PostgreSQL Flexible HA 4 vCPU', costPerUnit: 256.0 };
  }

  return { spec, ...tierMap[provider] };
}

/**
 * Calculates Redis in-memory cache cluster sizing and pricing
 */
function getCacheTier(capacityPerSecond: number, provider: CloudProvider) {
  let spec = '3.2GB RAM In-Memory';
  const tierMap = {
    aws: { name: 'ElastiCache cache.t4g.medium', costPerNode: 38.50 },
    gcp: { name: 'Memorystore Redis 3GB', costPerNode: 36.00 },
    azure: { name: 'Azure Cache for Redis C1', costPerNode: 37.50 },
  };

  if (capacityPerSecond > 10000) {
    spec = '26GB RAM Sharded Cluster';
    tierMap.aws = { name: 'ElastiCache cache.r6g.xlarge', costPerNode: 185.00 };
    tierMap.gcp = { name: 'Memorystore Redis Cluster 26GB', costPerNode: 172.00 };
    tierMap.azure = { name: 'Azure Redis Premium P1', costPerNode: 178.00 };
  } else if (capacityPerSecond > 4000) {
    spec = '13GB RAM Multi-AZ Cluster';
    tierMap.aws = { name: 'ElastiCache cache.r6g.large', costPerNode: 96.00 };
    tierMap.gcp = { name: 'Memorystore Redis Standard 13GB', costPerNode: 88.00 };
    tierMap.azure = { name: 'Azure Redis Standard C2', costPerNode: 92.00 };
  }

  return { spec, ...tierMap[provider] };
}

/**
 * Calculates event queue & message broker infrastructure costs (Kafka / MSK / PubSub)
 */
function getQueueTier(capacityPerSecond: number, provider: CloudProvider) {
  let spec = 'Managed Event Stream (Standard)';
  const tierMap = {
    aws: { name: 'Amazon SQS / MSK Express', costPerBroker: 45.0 },
    gcp: { name: 'Cloud Pub/Sub Standard', costPerBroker: 32.0 },
    azure: { name: 'Azure Event Hubs Basic', costPerBroker: 38.0 },
  };

  if (capacityPerSecond > 5000) {
    spec = 'Dedicated Distributed Kafka Cluster (High-Throughput)';
    tierMap.aws = { name: 'Amazon MSK (kafka.m5.large)', costPerBroker: 146.0 };
    tierMap.gcp = { name: 'Cloud Pub/Sub Enterprise', costPerBroker: 85.0 };
    tierMap.azure = { name: 'Azure Event Hubs Standard', costPerBroker: 98.0 };
  }

  return { spec, ...tierMap[provider] };
}

/**
 * Calculates API Gateway & Ingress traffic routing costs
 */
function getGatewayCost(incomingRps: number, provider: CloudProvider) {
  const lcuUnits = Math.max(1, Math.ceil(incomingRps / 1000));
  if (provider === 'aws') {
    // AWS ALB: $16.20 base + $5.76/LCU ($0.008 * 720h)
    return {
      name: `AWS Application Load Balancer (${lcuUnits} LCU)`,
      monthlyCost: Math.round((16.2 + lcuUnits * 5.76) * 100) / 100,
      units: lcuUnits,
      unitLabel: `${lcuUnits} LCU`,
    };
  } else if (provider === 'gcp') {
    // GCP Global External Application Load Balancer
    return {
      name: `GCP Cloud Load Balancing (${lcuUnits} Fwd Rules)`,
      monthlyCost: Math.round((18.25 + lcuUnits * 5.2) * 100) / 100,
      units: lcuUnits,
      unitLabel: `${lcuUnits} Rules`,
    };
  } else {
    // Azure Application Gateway v2
    return {
      name: `Azure Application Gateway v2 (${lcuUnits} ACU)`,
      monthlyCost: Math.round((19.0 + lcuUnits * 5.5) * 100) / 100,
      units: lcuUnits,
      unitLabel: `${lcuUnits} ACU`,
    };
  }
}

/**
 * Calculates continuous monthly internet egress data transfer costs
 */
function getEgressCost(incomingRps: number, provider: CloudProvider) {
  const monthlySeconds = 720 * 3600;
  const totalMonthlyRequests = incomingRps * monthlySeconds;
  const bytesPerReq = 4 * 1024; // 4KB average payload per HTTP roundtrip
  const egressGb = Math.round((totalMonthlyRequests * bytesPerReq) / (1024 * 1024 * 1024));

  let ratePerGb = 0.09;
  if (provider === 'aws') {
    ratePerGb = egressGb > 50000 ? 0.08 : egressGb > 10000 ? 0.085 : 0.09;
  } else if (provider === 'gcp') {
    ratePerGb = egressGb > 50000 ? 0.075 : egressGb > 10000 ? 0.08 : 0.085;
  } else {
    ratePerGb = egressGb > 50000 ? 0.078 : egressGb > 10000 ? 0.082 : 0.087;
  }

  const monthlyCost = Math.round(egressGb * ratePerGb * 100) / 100;
  return { egressGb, monthlyCost, ratePerGb };
}

/**
 * Computes the maximum sustainable traffic throughput (RPS) of the system topology
 * before any processing tier experiences bottleneck saturation ("till the system can make for it").
 */
export function calculateSystemMaxCapacity(nodes: ArchitectureNode[]): number {
  const enabledNodes = nodes.filter((n) => n.enabled);
  if (enabledNodes.length === 0) return 1000;

  // Processing nodes that handle traffic flow
  const processingNodes = enabledNodes.filter((n) => n.type !== 'load_generator');
  if (processingNodes.length === 0) return 5000;

  // Effective throughput capacity = workerCount * capacityPerSecond
  const capacities = processingNodes.map((n) => {
    const workers = Math.max(1, n.workerCount || 1);
    const cap = n.capacityPerSecond || 1000;
    return workers * cap;
  });

  const bottleneckCapacity = Math.min(...capacities);
  return Math.max(500, bottleneckCapacity);
}

/**
 * Calculates estimated cloud infrastructure bill ($/mo) for the given architecture and traffic load.
 */
export function estimateCloudCost(
  nodes: ArchitectureNode[],
  incomingRps: number = 800,
  provider: CloudProvider = 'aws',
  avgP99LatencyMs: number = 15
): CloudCostEstimate {
  const providerName = PROVIDER_NAMES[provider];
  const enabledNodes = nodes.filter((n) => n.enabled);

  const computeItems: CostCategoryItem[] = [];
  const databaseItems: CostCategoryItem[] = [];
  const cacheItems: CostCategoryItem[] = [];
  const queueItems: CostCategoryItem[] = [];
  const gatewayItems: CostCategoryItem[] = [];

  for (const node of enabledNodes) {
    const workers = Math.max(1, node.workerCount || 1);
    const cap = node.capacityPerSecond || 2000;

    switch (node.type) {
      case 'gateway': {
        const gw = getGatewayCost(incomingRps, provider);
        gatewayItems.push({
          id: node.id,
          name: node.name,
          type: 'gateway',
          units: gw.units,
          unitLabel: gw.unitLabel,
          monthlyCost: gw.monthlyCost,
          details: `${gw.name} (SSL, HTTP/2, routing)`,
        });
        break;
      }

      case 'cache': {
        const cacheTier = getCacheTier(cap, provider);
        const cost = Math.round(workers * cacheTier.costPerNode * 100) / 100;
        cacheItems.push({
          id: node.id,
          name: node.name,
          type: 'cache',
          units: workers,
          unitLabel: `${workers} Node${workers > 1 ? 's' : ''}`,
          monthlyCost: cost,
          details: `${cacheTier.name} — ${cacheTier.spec}`,
        });
        break;
      }

      case 'database': {
        const dbTier = getDatabaseTier(cap, provider);
        const cost = Math.round(workers * dbTier.costPerUnit * 100) / 100;
        databaseItems.push({
          id: node.id,
          name: node.name,
          type: 'database',
          units: workers,
          unitLabel: `${workers} Instance${workers > 1 ? 's' : ''}`,
          monthlyCost: cost,
          details: `${dbTier.name} — ${dbTier.spec}`,
        });
        break;
      }

      case 'service': {
        const isQueue =
          node.name.toLowerCase().includes('kafka') ||
          node.name.toLowerCase().includes('queue') ||
          node.name.toLowerCase().includes('stream') ||
          node.name.toLowerCase().includes('pubsub');

        if (isQueue) {
          const qTier = getQueueTier(cap, provider);
          const cost = Math.round(workers * qTier.costPerBroker * 100) / 100;
          queueItems.push({
            id: node.id,
            name: node.name,
            type: 'service',
            units: workers,
            unitLabel: `${workers} Broker${workers > 1 ? 's' : ''}`,
            monthlyCost: cost,
            details: `${qTier.name} — ${qTier.spec}`,
          });
        } else {
          const compTier = getComputeTier(cap, provider);
          const cost = Math.round(workers * compTier.costPerWorker * 100) / 100;
          computeItems.push({
            id: node.id,
            name: node.name,
            type: 'service',
            units: workers,
            unitLabel: `${workers} Instance${workers > 1 ? 's' : ''}`,
            monthlyCost: cost,
            details: `${compTier.name} (${compTier.spec})`,
          });
        }
        break;
      }

      default:
        break;
    }
  }

  // Calculate internet data egress
  const egress = getEgressCost(incomingRps, provider);
  const networkingItems: CostCategoryItem[] = [
    ...gatewayItems,
    {
      id: 'egress',
      name: 'Internet Data Egress Transfer',
      type: 'gateway',
      units: egress.egressGb,
      unitLabel: `${egress.egressGb.toLocaleString()} GB`,
      monthlyCost: egress.monthlyCost,
      details: `${incomingRps.toLocaleString()} req/s at $${egress.ratePerGb}/GB out`,
    },
  ];

  const categories: CostCategoryBreakdown[] = [
    {
      category: 'Compute & Worker Fleets',
      subtotal: Math.round(computeItems.reduce((acc, i) => acc + i.monthlyCost, 0) * 100) / 100,
      items: computeItems,
    },
    {
      category: 'Databases & Storage',
      subtotal: Math.round(databaseItems.reduce((acc, i) => acc + i.monthlyCost, 0) * 100) / 100,
      items: databaseItems,
    },
    {
      category: 'In-Memory Caches',
      subtotal: Math.round(cacheItems.reduce((acc, i) => acc + i.monthlyCost, 0) * 100) / 100,
      items: cacheItems,
    },
    {
      category: 'Message Queues & Streams',
      subtotal: Math.round(queueItems.reduce((acc, i) => acc + i.monthlyCost, 0) * 100) / 100,
      items: queueItems,
    },
    {
      category: 'Networking & Data Transfer',
      subtotal: Math.round(networkingItems.reduce((acc, i) => acc + i.monthlyCost, 0) * 100) / 100,
      items: networkingItems,
    },
  ].filter((c) => c.items.length > 0);

  const totalMonthlyCost = Math.round(
    categories.reduce((acc, c) => acc + c.subtotal, 0) * 100
  ) / 100;

  const totalHourlyCost = Math.round((totalMonthlyCost / 720) * 100) / 100;
  const totalMonthlyRequests = incomingRps * 720 * 3600;
  const costPer1k =
    totalMonthlyRequests > 0
      ? Math.round((totalMonthlyCost / (totalMonthlyRequests / 1000)) * 10000) / 10000
      : 0;

  let recommendation = '';
  if (cacheItems.length === 0 && databaseItems.length > 0) {
    recommendation = `💡 Introducing an in-memory Redis cache tier saves up to 70% of database read I/O costs and protects primary DB replicas from connection exhaustion.`;
  } else if (avgP99LatencyMs > 50 && totalMonthlyCost > 300) {
    recommendation = `⚠️ High P99 latency (${avgP99LatencyMs}ms) despite $${totalMonthlyCost}/mo spend. Consider adding connection pooling (pgBouncer) or horizontal read replicas before upgrading DB instance sizes.`;
  } else {
    recommendation = `✨ Cost-optimized topology: Delivering ${avgP99LatencyMs}ms P99 latency at ~$${costPer1k}/1k requests on ${providerName}.`;
  }

  return {
    provider,
    providerName,
    totalMonthlyCost,
    totalHourlyCost,
    costPer1kRequests: costPer1k,
    dataEgressGbPerMonth: egress.egressGb,
    categories,
    recommendation,
  };
}

/**
 * Calculates varying price points as traffic scales from light load
 * up to the maximum capacity the system can support ("till the system can make for it").
 */
export function calculateVaryingScalePrices(
  nodes: ArchitectureNode[],
  currentRps: number = 1000,
  avgP99LatencyMs: number = 15
): ScalePricePoint[] {
  const maxCapacity = calculateSystemMaxCapacity(nodes);

  const rpsSet = new Set<number>();
  const baseDev = Math.max(250, Math.round(maxCapacity * 0.1));
  rpsSet.add(baseDev);

  rpsSet.add(Math.max(100, currentRps));

  const quarterTraffic = Math.max(baseDev, Math.round(maxCapacity * 0.35));
  rpsSet.add(quarterTraffic);

  const halfTraffic = Math.max(quarterTraffic, Math.round(maxCapacity * 0.65));
  rpsSet.add(halfTraffic);

  rpsSet.add(maxCapacity);

  const burstTraffic = Math.round(maxCapacity * 1.25);
  rpsSet.add(burstTraffic);

  const sortedRps = Array.from(rpsSet).sort((a, b) => a - b);

  return sortedRps.map((rps) => {
    const awsEst = estimateCloudCost(nodes, rps, 'aws', avgP99LatencyMs);
    const gcpEst = estimateCloudCost(nodes, rps, 'gcp', avgP99LatencyMs);
    const azureEst = estimateCloudCost(nodes, rps, 'azure', avgP99LatencyMs);

    const isCurrent = rps === currentRps;
    const isMax = rps === maxCapacity;
    const percent = Math.min(150, Math.round((rps / maxCapacity) * 100));

    let label = `${rps.toLocaleString()} req/s`;
    if (isMax) label = `${rps.toLocaleString()} req/s (100% Cluster Breaking Limit)`;
    else if (isCurrent) label = `${rps.toLocaleString()} req/s (Current Traffic)`;
    else if (rps > maxCapacity) label = `${rps.toLocaleString()} req/s (125% Peak Burst)`;

    return {
      trafficRps: rps,
      label,
      percentOfMaxCapacity: percent,
      isCurrentTraffic: isCurrent,
      isMaxCapacity: isMax,
      awsCost: awsEst.totalMonthlyCost,
      gcpCost: gcpEst.totalMonthlyCost,
      azureCost: azureEst.totalMonthlyCost,
    };
  });
}

/**
 * Returns a comprehensive 3-cloud pricing variance breakdown (AWS vs GCP vs Azure)
 * and the scale progression table up to maximum sustainable capacity.
 */
export function getMultiCloudComparison(
  nodes: ArchitectureNode[],
  incomingRps: number = 1000,
  avgP99LatencyMs: number = 15
): MultiCloudComparison {
  const aws = estimateCloudCost(nodes, incomingRps, 'aws', avgP99LatencyMs);
  const gcp = estimateCloudCost(nodes, incomingRps, 'gcp', avgP99LatencyMs);
  const azure = estimateCloudCost(nodes, incomingRps, 'azure', avgP99LatencyMs);

  const maxSystemCapacityRps = calculateSystemMaxCapacity(nodes);
  const scalePricePoints = calculateVaryingScalePrices(nodes, incomingRps, avgP99LatencyMs);

  const costs = [
    { provider: 'aws' as CloudProvider, cost: aws.totalMonthlyCost },
    { provider: 'gcp' as CloudProvider, cost: gcp.totalMonthlyCost },
    { provider: 'azure' as CloudProvider, cost: azure.totalMonthlyCost },
  ];
  costs.sort((a, b) => a.cost - b.cost);
  const cheapestProvider = costs[0].provider;

  return {
    aws,
    gcp,
    azure,
    cheapestProvider,
    savingsMonthlyVsAws: {
      gcp: Math.round((aws.totalMonthlyCost - gcp.totalMonthlyCost) * 100) / 100,
      azure: Math.round((aws.totalMonthlyCost - azure.totalMonthlyCost) * 100) / 100,
    },
    maxSystemCapacityRps,
    scalePricePoints,
  };
}
