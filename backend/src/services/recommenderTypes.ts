import { z } from 'zod';
import {
  architectureNodeSchema,
  architectureEdgeSchema,
} from '../simulation/validation.js';
import { ArchitectureNode, ArchitectureEdge } from '../simulation/types.js';

export type ArchitecturePattern =
  | 'Monolith'
  | 'Modular Monolith'
  | 'Microservices'
  | 'Event-Driven'
  | 'Serverless'
  | 'Hybrid';

export const recommenderInputSchema = z.object({
  projectDescription: z
    .string()
    .trim()
    .min(10, 'Project description must be at least 10 characters')
    .max(5000, 'Project description must not exceed 5000 characters'),
  expectedScale: z.string().optional(),
  budgetConstraint: z.string().optional(),
  preferredTech: z.array(z.string()).optional(),
  deploymentPreference: z.string().optional(),
  reliabilityRequirement: z.string().optional(),
  securityRequirement: z.string().optional(),
  teamSize: z.string().optional(),
  refinementRequest: z.string().optional(),
  llmConfig: z
    .object({
      provider: z.string().optional(),
      apiKey: z.string().optional(),
      model: z.string().optional(),
      baseUrl: z.string().optional(),
    })
    .optional(),
});

export type RecommenderInput = z.infer<typeof recommenderInputSchema>;

export const technologyRecommendationSchema = z.object({
  category: z.string(),
  name: z.string(),
  reason: z.string(),
  tradeoffs: z.array(z.string()),
  alternatives: z.array(z.string()),
});

export type TechnologyRecommendation = z.infer<typeof technologyRecommendationSchema>;

export const dataFlowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  steps: z.array(z.string()),
});

export type DataFlow = z.infer<typeof dataFlowSchema>;

export const tradeoffDecisionSchema = z.object({
  decision: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
});

export type TradeoffDecision = z.infer<typeof tradeoffDecisionSchema>;

export const architectureRecommendationSchema = z.object({
  id: z.string(),
  projectName: z.string(),
  summary: z.string(),
  architecturePattern: z.enum([
    'Monolith',
    'Modular Monolith',
    'Microservices',
    'Event-Driven',
    'Serverless',
    'Hybrid',
  ]),
  patternReasoning: z.string(),
  requirements: z.object({
    functional: z.array(z.string()),
    nonFunctional: z.array(z.string()),
    assumptions: z.array(z.string()),
    constraints: z.array(z.string()),
  }),
  technologies: z.array(technologyRecommendationSchema),
  nodes: z.array(architectureNodeSchema).min(1),
  edges: z.array(architectureEdgeSchema),
  dataFlows: z.array(dataFlowSchema),
  securityConsiderations: z.array(z.string()),
  scalingStrategy: z.array(z.string()),
  tradeoffs: z.array(tradeoffDecisionSchema),
  futureImprovements: z.array(z.string()),
  clarifyingQuestions: z.array(z.string()).optional(),
});

export type ArchitectureRecommendation = {
  id: string;
  projectName: string;
  summary: string;
  architecturePattern: ArchitecturePattern;
  patternReasoning: string;
  requirements: {
    functional: string[];
    nonFunctional: string[];
    assumptions: string[];
    constraints: string[];
  };
  technologies: TechnologyRecommendation[];
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  dataFlows: DataFlow[];
  securityConsiderations: string[];
  scalingStrategy: string[];
  tradeoffs: TradeoffDecision[];
  futureImprovements: string[];
  clarifyingQuestions?: string[];
};

