import { z } from 'zod';

export type CandidateClassification =
  | 'backend_service'
  | 'frontend_app'
  | 'worker'
  | 'database'
  | 'cache'
  | 'message_queue'
  | 'shared_library'
  | 'ui_package'
  | 'config'
  | 'infrastructure'
  | 'test'
  | 'unknown';

export interface ComponentEvidence {
  entryPoint?: string;
  startupCommand?: string;
  sourceFiles: string[];
  detectedRoutes?: string[];
  dependencies?: string[];
  confidence: number; // 0.0 - 1.0
  reason: string;
  isRuntimeService: boolean;
}

export interface ConnectionEvidence {
  source: string;
  target: string;
  communicationType: 'http' | 'graphql' | 'grpc' | 'db' | 'queue' | 'inferred';
  evidenceFiles: string[];
  reference?: string;
  confidence: number;
  reason: string;
  isConfirmed: boolean;
}

export interface InventoryItem {
  path: string;
  name: string;
  isMonorepoRoot?: boolean;
  packageJson?: {
    name?: string;
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    workspaces?: string[] | { packages: string[] };
    main?: string;
    module?: string;
  };
  hasServerBootstrap: boolean;
  hasWorkerBootstrap: boolean;
  hasFrontendBootstrap: boolean;
  entryFiles: string[];
  dockerfiles: string[];
  dockerComposeServices: string[];
  routes: string[];
  clients: {
    databases: string[];
    queues: string[];
    httpTargets: string[];
  };
  classification: CandidateClassification;
  evidence: ComponentEvidence;
}

export interface RepositoryInventory {
  repoName: string;
  frameworks: string[];
  analyzedFiles: string[];
  skippedFiles: string[];
  items: InventoryItem[];
  connections: ConnectionEvidence[];
}

export const llmAnalysisResultSchema = z.object({
  components: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      type: z.enum([
        'load_generator',
        'gateway',
        'service',
        'cache',
        'database',
      ]),
      isRuntimeService: z.boolean(),
      entryPoint: z.string().optional(),
      startupCommand: z.string().optional(),
      sourceFiles: z.array(z.string()),
      confidence: z.number().min(0).max(1),
      reason: z.string(),
      estimatedCapacity: z.number().optional(),
      defaultWorkers: z.number().optional(),
    })
  ),
  connections: z.array(
    z.object({
      source: z.string().min(1),
      target: z.string().min(1),
      communicationType: z.enum(['http', 'graphql', 'grpc', 'db', 'queue', 'inferred']),
      evidenceFiles: z.array(z.string()),
      reference: z.string().optional(),
      confidence: z.number().min(0).max(1),
      reason: z.string(),
      requestsPerInput: z.number().optional(),
    })
  ),
});

export type LLMAnalysisResult = z.infer<typeof llmAnalysisResultSchema>;

