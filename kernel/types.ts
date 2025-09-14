/**
 * Core XiKernel Types - Substrate Data Structures
 */

export type SymbolID = string;

export interface Symbol {
  id: SymbolID;
  typ: string;
  payload: unknown;
  meta: Record<string, unknown>;   // {model, promptHash, timestamp, kernelWritten, ...}
  lineage: string[];               // provenance chain
}

export interface Edge {
  src: SymbolID;
  dst: SymbolID;
  rel: string;
  weight: number;
  warrant: Record<string, unknown>; // I3: required justification
}

export interface XiGraph {
  nodes: Map<SymbolID, Symbol>;
  edges: Edge[];
  invariantViolations: string[];
  lastModified: Date;
}

export interface GraphSnapshot {
  nodes: Symbol[];
  edges: Edge[];
  metadata: {
    totalSymbols: number;
    totalEdges: number;
    invariantViolations: string[];
    lastModified: Date;
  };
}