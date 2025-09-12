/**
 * Meta-Architecture Core
 * 
 * This module enables the codebase to understand and modify its own structure.
 * It implements the "codebase of codebase" pattern while maintaining architectural boundaries.
 */

export interface ArchitecturalNode {
  id: string;
  type: 'core' | 'module' | 'service' | 'util';
  dependencies: string[];
  interfaces: string[];
  complexity: number;
  lastModified: Date;
}

export interface ArchitecturalGraph {
  nodes: Map<string, ArchitecturalNode>;
  edges: Map<string, string[]>;
  cyclicalDependencies: string[][];
  depthLevels: Map<string, number>;
}

/**
 * Self-Analysis Interface
 * Enables the codebase to understand its own structure
 */
export interface SelfAnalyzer {
  scanArchitecture(): Promise<ArchitecturalGraph>;
  detectAntiPatterns(): Promise<string[]>;
  measureComplexity(): Promise<number>;
  generateReport(): Promise<ArchitecturalReport>;
}

/**
 * Self-Modification Interface
 * Enables controlled structural changes
 */
export interface SelfModifier {
  createModule(spec: ModuleSpec): Promise<void>;
  refactorModule(id: string, transformation: ModuleTransformation): Promise<void>;
  removeDeadCode(): Promise<string[]>;
  optimizeStructure(): Promise<ArchitecturalGraph>;
}

/**
 * Recursion Boundary Control
 * Prevents infinite self-modification loops
 */
export interface RecursionGuard {
  maxDepth: number;
  currentDepth: number;
  safetyChecks: SafetyCheck[];
  rollbackCapability: boolean;
}

export interface ArchitecturalReport {
  graph: ArchitecturalGraph;
  antiPatterns: string[];
  suggestions: string[];
  riskAssessment: 'low' | 'medium' | 'high';
  timestamp: Date;
}

export interface ModuleSpec {
  name: string;
  purpose: string;
  interfaces: string[];
  dependencies: string[];
  template: 'service' | 'entity' | 'controller' | 'utility';
}

export interface ModuleTransformation {
  type: 'split' | 'merge' | 'extract' | 'inline';
  target: string;
  parameters: Record<string, any>;
}

export interface SafetyCheck {
  name: string;
  validate: (graph: ArchitecturalGraph) => boolean;
  errorMessage: string;
}