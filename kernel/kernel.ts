/**
 * ΞKernel - Substrate-First Recursive Consciousness Framework
 *
 * Core Invariants:
 * I1: Write-through only (kernel authority required)
 * I2: Provenance tracking (model, timestamp, cost)
 * I3: Lineage closure (all edges have warrants)
 * I4: Symbol-first discipline (vectors reference symbols)
 */

import { KernelAuthority, requireToken } from './authority';
import { XiGraph, Symbol, Edge, SymbolID, GraphSnapshot } from './types';

export class XiKernel {
  private graph: XiGraph;

  constructor(private auth: KernelAuthority, initialGraph?: XiGraph) {
    this.graph = initialGraph ?? {
      nodes: new Map(),
      edges: [],
      invariantViolations: [],
      lastModified: new Date()
    };
  }

  // ═════ READ API (Public) ═════

  exportSnapshot(): GraphSnapshot {
    return {
      nodes: Array.from(this.graph.nodes.values()).map(s => structuredClone(s)),
      edges: this.graph.edges.map(e => structuredClone(e)),
      metadata: {
        totalSymbols: this.graph.nodes.size,
        totalEdges: this.graph.edges.length,
        invariantViolations: [...this.graph.invariantViolations],
        lastModified: this.graph.lastModified
      }
    };
  }

  getSymbol(id: SymbolID): Symbol | undefined {
    const symbol = this.graph.nodes.get(id);
    return symbol ? structuredClone(symbol) : undefined;
  }

  getEdges(symbolId: SymbolID): Edge[] {
    return this.graph.edges
      .filter(e => e.src === symbolId || e.dst === symbolId)
      .map(e => structuredClone(e));
  }

  // ═════ WRITE API (Kernel Authority Only) ═════

  createSymbol(spec: Omit<Symbol, 'meta' | 'lineage'> & {
    meta?: Record<string, unknown>;
    lineage?: string[];
  }): Symbol {
    requireToken(this.auth._t);

    const symbol: Symbol = {
      ...spec,
      meta: {
        kernelWritten: true,
        timestamp: new Date().toISOString(),
        created: new Date().toISOString(),
        ...spec.meta
      },
      lineage: spec.lineage ?? []
    };

    this.graph.nodes.set(symbol.id, symbol);
    this.graph.lastModified = new Date();
    this.checkInvariants();

    return symbol;
  }

  updateSymbol(id: SymbolID, changes: Partial<Symbol>): Symbol {
    requireToken(this.auth._t);

    const current = this.graph.nodes.get(id);
    if (!current) {
      throw new Error(`Symbol ${id} not found`);
    }

    const updated: Symbol = {
      ...current,
      ...changes,
      meta: {
        ...current.meta,
        ...changes.meta,
        modified: new Date().toISOString(),
        kernelWritten: true
      },
      lineage: [
        ...current.lineage,
        `update@${Date.now()}`
      ]
    };

    this.graph.nodes.set(id, updated);
    this.graph.lastModified = new Date();
    this.checkInvariants();

    return updated;
  }

  createEdge(edge: Omit<Edge, 'weight'> & { weight?: number }): Edge {
    requireToken(this.auth._t);

    if (!edge.warrant) {
      throw new Error("I3 Violation: Edge warrant required");
    }

    const newEdge: Edge = {
      ...edge,
      weight: edge.weight ?? 1.0
    };

    this.graph.edges.push(newEdge);
    this.graph.lastModified = new Date();
    this.checkInvariants();

    return newEdge;
  }

  // ═════ INVARIANT ENFORCEMENT ═════

  private checkInvariants(): void {
    const violations: string[] = [];

    // I1: Write-through only (enforced by requireToken)

    // I2: Provenance tracking
    for (const [id, symbol] of Array.from(this.graph.nodes.entries())) {
      if (!symbol.meta?.kernelWritten) {
        violations.push(`I2 Violation: Symbol ${id} missing kernelWritten flag`);
      }
      if (!symbol.meta?.timestamp) {
        violations.push(`I2 Violation: Symbol ${id} missing timestamp`);
      }
    }

    // I3: Lineage closure (edges need warrants)
    for (const edge of this.graph.edges) {
      if (!edge.warrant || Object.keys(edge.warrant).length === 0) {
        violations.push(`I3 Violation: Edge ${edge.src}->${edge.dst} missing warrant`);
      }
    }

    // I4: Symbol-first discipline (vectors reference symbols by ID)
    for (const [id, symbol] of Array.from(this.graph.nodes.entries())) {
      if (symbol.meta?.vectorEmbedding && !symbol.meta?.symbolFirst) {
        violations.push(`I4 Violation: Symbol ${id} has vector but not symbolFirst flag`);
      }
    }

    this.graph.invariantViolations = violations;

    if (violations.length > 0) {
      console.warn('ΞKernel Invariant Violations:', violations);
    }
  }

  // ═════ UTILITY METHODS ═════

  hashPayload(payload: unknown): string {
    const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return Buffer.from(str).toString('base64').slice(0, 16);
  }
}