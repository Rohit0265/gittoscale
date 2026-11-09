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

// Pricing constants based on public cloud on-demand rates (US-East / us-central)
const PRICING = {
  aws: {
    providerName: 'Amazon Web Services (AWS)',
    gatewayBase: 16.2, // ALB hourly ($0.0225 * 720h)
    gatewayPer1kRps: 5.76, // LCU capacity unit
    workerCompute: 24.48, // t4g.medium (2 vCPU, 4GB RAM)
    database: 154.0, // Aurora Serverless db.r6g.large + 100GB NVMe storage
    cache: 96.0, // ElastiCache Redis cache.r6g.large (13GB)
    queue: 146.0, // Managed Streaming for Kafka (MSK kafka.m5.large)
    egressPerGb: 0.09, // Internet Data Transfer Out
  },
  gcp: {
    providerName: 'Google Cloud Platform (GCP)',
    gatewayBase: 18.25, // Cloud Load Balancing forwarding rule
    gatewayPer1kRps: 5.2,
    workerCompute: 22.8, // Cloud Run / E2-medium
    database: 146.0, // Cloud SQL for PostgreSQL Enterprise
    cache: 88.0, // Memorystore for Redis Standard
    queue: 45.0, // Cloud Pub/Sub throughput tier
    egressPerGb: 0.085,
  },
  azure: {
    providerName: 'Microsoft Azure',
    gatewayBase: 19.0, // Application Gateway v2
    gatewayPer1kRps: 5.5,
    workerCompute: 25.2, // Azure Container Apps / B2s instance
    database: 152.0, // Azure Database for PostgreSQL Flexible Server
    cache: 92.0, // Azure Cache for Redis Standard C1
    queue: 60.0, // Azure Event Hubs Standard
    egressPerGb: 0.087,
  },
};

/**
 * Calculates estimated cloud infrastructure bill ($/mo) for the given architecture and traffic load.
 */
export function estimateCloudCost(
  nodes: ArchitectureNode[],
  incomingRps: number = 800,
  provider: CloudProvider = 'aws',
  avgP99LatencyMs: number = 15
): CloudCostEstimate {
  const rates = PRICING[provider];
  const enabledNodes = nodes.filter((n) => n.enabled);

  const computeItems: CostCategoryItem[] = [];
  const databaseItems: CostCategoryItem[] = [];
  const cacheItems: CostCategoryItem[] = [];
  const queueItems: CostCategoryItem[] = [];
  const gatewayItems: CostCategoryItem[] = [];

  for (const node of enabledNodes) {
    const workers = Math.max(1, node.workerCount || 1);

    switch (node.type) {
      case 'gateway': {
        const lcuUnits = Math.max(1, Math.ceil(incomingRps / 1000));
        const cost = rates.gatewayBase + lcuUnits * rates.gatewayPer1kRps;
        gatewayItems.push({
          id: node.id,
          name: node.name,
          type: 'gateway',
          units: lcuUnits,
          unitLabel: `${lcuUnits} LCU`,
          monthlyCost: Math.round(cost * 100) / 100,
          details: `${rates.providerName} ALB / Ingress Gateway`,
        });
        break;
      }

      case 'cache': {
        const cost = workers * rates.cache;
        cacheItems.push({
          id: node.id,
          name: node.name,
          type: 'cache',
          units: workers,
          unitLabel: `${workers} Node${workers > 1 ? 's' : ''}`,
          monthlyCost: Math.round(cost * 100) / 100,
          details: `Managed In-Memory Redis Cluster (${workers * 13}GB RAM)`,
        });
        break;
      }

      case 'database': {
        const cost = workers * rates.database;
        databaseItems.push({
          id: node.id,
          name: node.name,
          type: 'database',
          units: workers,
          unitLabel: `${workers} Instance${workers > 1 ? 's' : ''}`,
          monthlyCost: Math.round(cost * 100) / 100,
          details: `High-Availability Managed Database + SSD Storage`,
        });
        break;
      }

      case 'service': {
        const isQueue = node.name.toLowerCase().includes('kafka') ||
                        node.name.toLowerCase().includes('queue') ||
                        node.name.toLowerCase().includes('stream');
        if (isQueue) {
          const cost = workers * rates.queue;
          queueItems.push({
            id: node.id,
            name: node.name,
            type: 'service',
            units: workers,
            unitLabel: `${workers} Broker${workers > 1 ? 's' : ''}`,
            monthlyCost: Math.round(cost * 100) / 100,
            details: `Managed Kafka / Queue Broker Tier`,
          });
        } else {
          const cost = workers * rates.workerCompute;
          computeItems.push({
            id: node.id,
            name: node.name,
            type: 'service',
            units: workers,
            unitLabel: `${workers} Worker${workers > 1 ? 's' : ''}`,
            monthlyCost: Math.round(cost * 100) / 100,
            details: `Compute Containers (2 vCPU, 4GB RAM)`,
          });
        }
        break;
      }

      default:
        break;
    }
  }

  // Network Egress: Average 4KB per request * RPS * 720 hours / mo
  const monthlySeconds = 720 * 3600;
  const totalMonthlyRequests = incomingRps * monthlySeconds;
  const bytesPerReq = 4 * 1024;
  const egressGb = Math.round((totalMonthlyRequests * bytesPerReq) / (1024 * 1024 * 1024));
  const egressCost = Math.round(egressGb * rates.egressPerGb * 100) / 100;

  const networkingItems: CostCategoryItem[] = [
    ...gatewayItems,
    {
      id: 'egress',
      name: 'Internet Data Transfer (Egress)',
      type: 'gateway',
      units: egressGb,
      unitLabel: `${egressGb.toLocaleString()} GB`,
      monthlyCost: egressCost,
      details: `${incomingRps.toLocaleString()} req/s continuous traffic egress`,
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
  const costPer1k = totalMonthlyRequests > 0
    ? Math.round((totalMonthlyCost / (totalMonthlyRequests / 1000)) * 10000) / 10000
    : 0;

  let recommendation = '';
  if (cacheItems.length === 0 && databaseItems.length > 0) {
    recommendation = `💡 Adding an in-memory Redis cache tier (~$${rates.cache}/mo) would absorb ~80% of read traffic, protecting databases from thundering herds.`;
  } else if (avgP99LatencyMs > 50 && totalMonthlyCost > 300) {
    recommendation = `⚠️ High P99 latency (${avgP99LatencyMs}ms) despite $${totalMonthlyCost}/mo spend. Consider adding connection pooling (pgBouncer) or horizontal replicas before scaling up instance sizes.`;
  } else {
    recommendation = `✨ Cost-optimized topology: Delivering ${avgP99LatencyMs}ms P99 latency at ~$${costPer1k}/1k requests on ${rates.providerName}.`;
  }

  return {
    provider,
    providerName: rates.providerName,
    totalMonthlyCost,
    totalHourlyCost,
    costPer1kRequests: costPer1k,
    dataEgressGbPerMonth: egressGb,
    categories,
    recommendation,
  };
}
