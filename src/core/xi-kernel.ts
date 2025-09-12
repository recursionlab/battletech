/**
 * ΞKernel - Write-Through Kernel with Port-Based LLM Interface
 * 
 * Stateful kernel that owns all mutations while keeping LLMs stateless
 * Implements invariant enforcement and deterministic control loops
 */

import { ΞSymbol, ΞPayload, ΞMetadata } from './xi-symbol';

// === DATA STRUCTURES ===

export interface Symbol {
  id: string;
  typ: string;
  payload: any;
  meta: Record<string, any>;
  lineage: string[];
}

export interface Edge {
  src: string;
  dst: string;
  rel: string;
  weight: number;
  warrant: Record<string, any>;
}

interface KernelGraph {
  symbols: Map<string, Symbol>;
  edges: Map<string, Edge[]>;
  invariantViolations: string[];
  lastModified: Date;
}

export interface ΞGraph {
  symbols: Record<string, Symbol>;
  edges: Record<string, readonly Edge[]>;
  invariantViolations: readonly string[];
  lastModified: Date;
}

// === LLM INTERFACE TYPES ===

export interface LLMSpec {
  symbolId: string;
  task: string;
  context: Record<string, any>;
  constraints: {
    maxTokens?: number;
    temperature?: number;
    tools?: string[];
    budget?: number;
  };
}

export interface LLMResponse {
  payload: any;
  justification: string;
  confidence: number;
  tokensUsed: number;
  model: string;
  seed?: number;
  cost?: number;
  timestamp: Date;
}

export interface LLMDelta {
  operation: 'create' | 'update' | 'delete' | 'link';
  target: string;
  changes: Record<string, any>;
  reason: string;
  confidence: number;
}

// === INVARIANT SYSTEM ===

export interface InvariantRule {
  id: string;
  name: string;
  check: (graph: ΞGraph) => boolean;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export class InvariantEnforcer {
  private rules: Map<string, InvariantRule> = new Map();

  addRule(rule: InvariantRule): void {
    this.rules.set(rule.id, rule);
  }

  check(graph: ΞGraph): { violations: string[]; warnings: string[] } {
    const violations: string[] = [];
    const warnings: string[] = [];

    for (const rule of this.rules.values()) {
      try {
        if (!rule.check(graph)) {
          const message = `${rule.name}: ${rule.message}`;
          if (rule.severity === 'error') {
            violations.push(message);
          } else {
            warnings.push(message);
          }
        }
      } catch (error) {
        violations.push(`${rule.name}: Rule check failed - ${error}`);
      }
    }

    return { violations, warnings };
  }
}

// === CORE INVARIANTS (I1-I4) ===

export const CoreInvariants = {
  // I1: Write-through - Only kernel mutates ΞGraph
  writeThrough: (): InvariantRule => ({
    id: 'I1_write_through',
    name: 'Write-Through Kernel',
    check: (graph) => {
      for (const symbol of Object.values(graph.symbols)) {
        if (!symbol.meta.kernelWritten) {
          return false;
        }
      }
      return true;
    },
    severity: 'error',
    message: 'All mutations must go through kernel'
  }),

  // I2: Provenance - Every symbol has model, prompt_hash, seed, time, cost
  provenance: (): InvariantRule => ({
    id: 'I2_provenance',
    name: 'Provenance Tracking',
    check: (graph) => {
      for (const symbol of Object.values(graph.symbols)) {
        const required = ['model', 'promptHash', 'timestamp'];
        if (!required.every(key => key in symbol.meta)) {
          return false;
        }
      }
      return true;
    },
    severity: 'error',
    message: 'All symbols must have provenance metadata'
  }),

  // I3: Lineage closure - New edges must cite warrants
  lineageClosure: (): InvariantRule => ({
    id: 'I3_lineage_closure',
    name: 'Lineage Closure',
    check: (graph) => {
      for (const edges of Object.values(graph.edges)) {
        for (const edge of edges) {
          if (!edge.warrant || Object.keys(edge.warrant).length === 0) {
            return false;
          }
        }
      }
      return true;
    },
    severity: 'error',
    message: 'All edges must have warrants'
  }),

  // I4: RAG discipline - Symbols first, vectors second
  ragDiscipline: (): InvariantRule => ({
    id: 'I4_rag_discipline',
    name: 'RAG Discipline',
    check: (graph) => {
      for (const symbol of Object.values(graph.symbols)) {
        if (symbol.meta.vectorEmbedding && !symbol.meta.symbolFirst) {
          return false;
        }
      }
      return true;
    },
    severity: 'warning',
    message: 'Vectors must be attached to symbols, not orphaned'
  })
};

// === LLM PORT INTERFACES ===

export interface LLMPort {
  prompt(symbolId: string, spec: LLMSpec): Promise<LLMResponse>;
  critique(symbolId: string, target: Record<string, any>): Promise<LLMDelta[]>;
  link(symbolA: string, symbolB: string, relationSpec: string): Promise<{relation: string, confidence: number}[]>;
  embed(payload: any): Promise<number[]>;
}

// === MOCK LLM PORT FOR TESTING ===

export class MockLLMPort implements LLMPort {
  async prompt(symbolId: string, spec: LLMSpec): Promise<LLMResponse> {
    // Simulate realistic LLM response with proper provenance
    return {
      payload: `Mock response for ${spec.task} on symbol ${symbolId}`,
      justification: `Generated based on context: ${JSON.stringify(spec.context)}`,
      confidence: 0.75,
      tokensUsed: 150,
      model: 'mock-gpt-4',
      seed: Math.floor(Math.random() * 10000),
      cost: 0.003,
      timestamp: new Date()
    };
  }

  async critique(symbolId: string, target: Record<string, any>): Promise<LLMDelta[]> {
    return [
      {
        operation: 'update',
        target: symbolId,
        changes: { improvement: 'Add more detail' },
        reason: 'Current content lacks specificity',
        confidence: 0.6
      }
    ];
  }

  async link(symbolA: string, symbolB: string, relationSpec: string): Promise<{relation: string, confidence: number}[]> {
    return [
      {
        relation: relationSpec,
        confidence: 0.8
      }
    ];
  }

  async embed(payload: any): Promise<number[]> {
    // Mock embedding - in reality would use actual embedding model
    const text = JSON.stringify(payload);
    return Array(384).fill(0).map(() => Math.random() - 0.5);
  }
}

// === MAIN KERNEL IMPLEMENTATION ===

export class ΞKernel {
  private graph: KernelGraph;
  private invariantEnforcer: InvariantEnforcer;
  private llmPort: LLMPort;
  private vectorStore: Map<string, number[]> = new Map();

  constructor(llmPort: LLMPort = new MockLLMPort()) {
    this.graph = {
      symbols: new Map(),
      edges: new Map(),
      invariantViolations: [],
      lastModified: new Date()
    };

    this.invariantEnforcer = new InvariantEnforcer();
    this.llmPort = llmPort;
    
    this.initializeCoreInvariants();
  }

  private initializeCoreInvariants(): void {
    this.invariantEnforcer.addRule(CoreInvariants.writeThrough());
    this.invariantEnforcer.addRule(CoreInvariants.provenance());
    this.invariantEnforcer.addRule(CoreInvariants.lineageClosure());
    this.invariantEnforcer.addRule(CoreInvariants.ragDiscipline());
  }

  // === PORT IMPLEMENTATIONS ===

  /**
   * Port: Prompt - LLM completion gated by spec
   */
  async prompt(symbolId: string, spec: Partial<LLMSpec>): Promise<Symbol> {
    const fullSpec: LLMSpec = {
      symbolId,
      task: spec.task || 'Generate content',
      context: spec.context || {},
      constraints: spec.constraints || {}
    };

    // Get LLM response (stateless)
    const response = await this.llmPort.prompt(symbolId, fullSpec);

    // Create symbol through kernel (stateful write-through)
    const symbol = this.createSymbol(symbolId, 'llm_generated', response.payload, {
      // I2: Provenance tracking
      model: response.model,
      promptHash: this.hashSpec(fullSpec),
      seed: response.seed,
      timestamp: response.timestamp.toISOString(),
      cost: response.cost,
      tokensUsed: response.tokensUsed,
      
      // I1: Write-through marker
      kernelWritten: true,
      
      // LLM metadata
      justification: response.justification,
      confidence: response.confidence,
      task: fullSpec.task
    });

    // Sync to vector store
    await this.syncToVector(symbol);

    return symbol;
  }

  /**
   * Port: Critique - LLM proposes edits with reasons
   */
  async critique(symbolId: string, target: Record<string, any>): Promise<Symbol[]> {
    const deltas = await this.llmPort.critique(symbolId, target);
    const updatedSymbols: Symbol[] = [];

    for (const delta of deltas) {
      if (delta.operation === 'update' && delta.confidence > 0.5) {
        const symbol = this.graph.symbols.get(delta.target);
        if (symbol) {
          // Apply changes through kernel
          const updated = this.updateSymbol(delta.target, delta.changes, {
            critique: true,
            reason: delta.reason,
            confidence: delta.confidence,
            timestamp: new Date().toISOString()
          });
          updatedSymbols.push(updated);
        }
      }
    }

    return updatedSymbols;
  }

  /**
   * Port: Link - LLM suggests edges between symbols
   */
  async link(symbolA: string, symbolB: string, relationSpec: string): Promise<Edge[]> {
    const candidates = await this.llmPort.link(symbolA, symbolB, relationSpec);
    const edges: Edge[] = [];

    for (const candidate of candidates) {
      if (candidate.confidence > 0.6) {
        const edge = this.createEdge(symbolA, symbolB, candidate.relation, candidate.confidence, {
          // I3: Warrant for lineage closure
          llmSuggested: true,
          confidence: candidate.confidence,
          timestamp: new Date().toISOString(),
          relationSpec
        });
        edges.push(edge);
      }
    }

    return edges;
  }

  // === CORE KERNEL OPERATIONS ===

  /**
   * Create symbol with full provenance (write-through)
   */
  private createSymbol(id: string, typ: string, payload: any, meta: Record<string, any>): Symbol {
    const symbol: Symbol = {
      id,
      typ,
      payload,
      meta: {
        ...meta,
        kernelWritten: true, // I1: Write-through marker
        created: new Date().toISOString()
      },
      lineage: []
    };

    this.graph.symbols.set(id, symbol);
    this.graph.lastModified = new Date();
    
    // Check invariants after mutation
    this.checkInvariants();
    
    return symbol;
  }

  /**
   * Update symbol through kernel
   */
  private updateSymbol(id: string, changes: Record<string, any>, meta: Record<string, any>): Symbol {
    const symbol = this.graph.symbols.get(id);
    if (!symbol) {
      throw new Error(`Symbol ${id} not found`);
    }

    // Update payload
    if (typeof symbol.payload === 'object' && symbol.payload !== null) {
      Object.assign(symbol.payload, changes);
    } else if (changes.payload !== undefined) {
      symbol.payload = changes.payload;
    }

    // Update metadata
    Object.assign(symbol.meta, meta, {
      modified: new Date().toISOString(),
      kernelWritten: true
    });

    // Add to lineage
    symbol.lineage.push(`update_${new Date().toISOString()}`);

    this.graph.lastModified = new Date();
    this.checkInvariants();

    return symbol;
  }

  /**
   * Create edge with warrant (I3: Lineage closure)
   */
  private createEdge(src: string, dst: string, rel: string, weight: number, warrant: Record<string, any>): Edge {
    const edge: Edge = {
      src,
      dst, 
      rel,
      weight,
      warrant: {
        ...warrant,
        kernelWritten: true,
        created: new Date().toISOString()
      }
    };

    if (!this.graph.edges.has(src)) {
      this.graph.edges.set(src, []);
    }
    
    this.graph.edges.get(src)!.push(edge);
    this.graph.lastModified = new Date();
    
    this.checkInvariants();
    
    return edge;
  }

  /**
   * Sync symbol to vector store (I4: RAG discipline)
   */
  private async syncToVector(symbol: Symbol): Promise<void> {
    const embedding = await this.llmPort.embed(symbol.payload);
    this.vectorStore.set(symbol.id, embedding);
    
    // Mark as symbol-first for I4
    symbol.meta.symbolFirst = true;
    symbol.meta.vectorEmbedding = true;
  }

  /**
   * Check invariants and quarantine violations
   */
  private checkInvariants(): void {
    const { violations, warnings } = this.invariantEnforcer.check(this.getGraph());
    
    this.graph.invariantViolations = violations;
    
    if (violations.length > 0) {
      console.warn('Invariant violations detected:', violations);
      // In production, might quarantine to paradox lane
    }
    
    if (warnings.length > 0) {
      console.info('Invariant warnings:', warnings);
    }
  }

  // === UTILITY METHODS ===

  private hashSpec(spec: LLMSpec): string {
    return Buffer.from(JSON.stringify(spec)).toString('base64').slice(0, 16);
  }

  /**
   * Get current graph state
   */
  getGraph(): ΞGraph {
    // Deep freeze utility
    function deepFreeze<T>(obj: T): T {
      if (obj === null || typeof obj !== 'object') return obj;
      Object.getOwnPropertyNames(obj).forEach((prop) => {
        // @ts-ignore
        const value = obj[prop];
        if (value && typeof value === 'object') {
          deepFreeze(value);
        }
      });
      return Object.freeze(obj);
    }

    const symbols: Record<string, Symbol> = {};
    for (const [id, symbol] of this.graph.symbols.entries()) {
      const clone: Symbol = {
        id: symbol.id,
        typ: symbol.typ,
        payload: symbol.payload,
        meta: { ...symbol.meta },
        lineage: [...symbol.lineage]
      };
      if (typeof clone.payload === 'object' && clone.payload !== null) {
        clone.payload = deepFreeze(clone.payload);
      }
      deepFreeze(clone.meta);
      deepFreeze(clone.lineage);
      symbols[id] = deepFreeze(clone);
    }

    const edges: Record<string, readonly Edge[]> = {};
    for (const [id, edgeList] of this.graph.edges.entries()) {
      edges[id] = edgeList.map(edge => {
        const clone: Edge = {
          src: edge.src,
          dst: edge.dst,
          rel: edge.rel,
          weight: edge.weight,
          warrant: { ...edge.warrant }
        };
        Object.freeze(clone.warrant);
        return Object.freeze(clone);
      });
      Object.freeze(edges[id]);
    }

    const snapshot: ΞGraph = {
      symbols: Object.freeze(symbols),
      edges: Object.freeze(edges),
      invariantViolations: Object.freeze([...this.graph.invariantViolations]),
      lastModified: new Date(this.graph.lastModified.getTime())
    };

    return Object.freeze(snapshot);
  }

  /**
   * Get symbol by ID
   */
  getSymbol(id: string): Symbol | undefined {
    return this.graph.symbols.get(id);
  }

  /**
   * Get edges from symbol
   */
  getEdges(symbolId: string): Edge[] {
    return this.graph.edges.get(symbolId) || [];
  }

  /**
   * Deterministic control loop
   */
  async evaluate(goalId: string, maxSteps: number = 10): Promise<{
    steps: number;
    result: any;
    violations: string[];
  }> {
    let steps = 0;
    const goal = this.getSymbol(goalId);
    
    if (!goal) {
      throw new Error(`Goal symbol ${goalId} not found`);
    }

    while (steps < maxSteps) {
      steps++;
      
      // Pick next action (simplified planner)
      const spec: LLMSpec = {
        symbolId: goalId,
        task: `Step ${steps} toward goal: ${JSON.stringify(goal.payload)}`,
        context: { step: steps, maxSteps },
        constraints: { maxTokens: 500, temperature: 0.7 }
      };

      // Execute through ports
      const response = await this.prompt(`${goalId}_step_${steps}`, spec);
      
      // Check if goal is satisfied (simplified)
      if (response.payload && response.payload.toString().includes('COMPLETE')) {
        break;
      }
    }

    return {
      steps,
      result: this.getSymbol(goalId),
      violations: this.graph.invariantViolations
    };
  }

  /**
   * Export kernel state for persistence/debugging
   */
  exportState(): {
    symbols: Record<string, Symbol>;
    edges: Record<string, Edge[]>;
    metadata: {
      totalSymbols: number;
      totalEdges: number;
      invariantViolations: string[];
      lastModified: Date;
    };
  } {
    const totalEdges = Array.from(this.graph.edges.values()).reduce((sum, edges) => sum + edges.length, 0);
    
    return {
      symbols: Object.fromEntries(this.graph.symbols),
      edges: Object.fromEntries(this.graph.edges),
      metadata: {
        totalSymbols: this.graph.symbols.size,
        totalEdges,
        invariantViolations: this.graph.invariantViolations,
        lastModified: this.graph.lastModified
      }
    };
  }
}