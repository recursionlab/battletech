/**
 * ΞSymbol - Recursive Symbolic Substrate
 * 
 * The fundamental unit that gives LLMs structural skeleton
 * Each ΞSymbol can contain: data, children, LLM agents, and recursive operations
 */

export type ΞPayload = string | number | object | null;
export type ΞMetadata = Record<string, any>;

export interface ΞInvariant {
  name: string;
  check: (symbol: ΞSymbol) => boolean;
  errorMessage: string;
}

export interface ΞEvalContext {
  depth: number;
  maxDepth: number;
  parentPath: string[];
  timestamp: Date;
  memory: Map<string, any>;
}

/**
 * Core ΞSymbol - The building block of symbolic AI substrate
 */
export class ΞSymbol {
  public readonly id: string;
  public readonly createdAt: Date;
  public payload: ΞPayload;
  public metadata: ΞMetadata;
  public children: ΞSymbol[];
  public parent: ΞSymbol | null;
  public invariants: ΞInvariant[];
  
  // Recursive evaluation state
  private _evaluating: boolean = false;
  private _lastEvaluation: Date | null = null;
  private _evaluationCount: number = 0;

  constructor(
    id: string,
    payload: ΞPayload = null,
    metadata: ΞMetadata = {}
  ) {
    this.id = id;
    this.payload = payload;
    this.metadata = { ...metadata };
    this.children = [];
    this.parent = null;
    this.invariants = [];
    this.createdAt = new Date();
  }

  // === STRUCTURAL OPERATIONS ===

  /**
   * Append child with automatic parent linking
   */
  append(child: ΞSymbol): ΞSymbol {
    child.parent = this;
    this.children.push(child);
    this.validateInvariants();
    return child;
  }

  /**
   * Create and append child in one operation
   */
  spawn(id: string, payload: ΞPayload = null, metadata: ΞMetadata = {}): ΞSymbol {
    const child = new ΞSymbol(id, payload, metadata);
    return this.append(child);
  }

  /**
   * Find child by predicate (recursive)
   */
  find(predicate: (symbol: ΞSymbol) => boolean): ΞSymbol | null {
    if (predicate(this)) return this;
    
    for (const child of this.children) {
      const found = child.find(predicate);
      if (found) return found;
    }
    
    return null;
  }

  /**
   * Get path from root to this symbol
   */
  getPath(): string[] {
    const path: string[] = [];
    let current: ΞSymbol | null = this;
    
    while (current) {
      path.unshift(current.id);
      current = current.parent;
    }
    
    return path;
  }

  /**
   * Get root symbol
   */
  getRoot(): ΞSymbol {
    let root: ΞSymbol = this;
    while (root.parent) {
      root = root.parent;
    }
    return root;
  }

  // === RECURSIVE EVALUATION ===

  /**
   * Recursive evaluation with cycle protection and depth limits
   */
  async evaluate(context?: Partial<ΞEvalContext>): Promise<ΞPayload> {
    // Prevent infinite recursion
    if (this._evaluating) {
      throw new Error(`Recursive evaluation cycle detected in symbol: ${this.id}`);
    }

    const ctx: ΞEvalContext = {
      depth: 0,
      maxDepth: 10,
      parentPath: [],
      timestamp: new Date(),
      memory: new Map(),
      ...context
    };

    // Check depth limit
    if (ctx.depth >= ctx.maxDepth) {
      throw new Error(`Maximum recursion depth (${ctx.maxDepth}) exceeded`);
    }

    this._evaluating = true;
    this._evaluationCount++;

    try {
      // Pre-evaluation invariant check
      this.validateInvariants();

      // Evaluate children first (depth-first)
      const childResults: ΞPayload[] = [];
      for (const child of this.children) {
        const childContext: ΞEvalContext = {
          ...ctx,
          depth: ctx.depth + 1,
          parentPath: [...ctx.parentPath, this.id]
        };
        
        const childResult = await child.evaluate(childContext);
        childResults.push(childResult);
      }

      // Store child results in context memory
      ctx.memory.set(`${this.id}_children`, childResults);

      // Self evaluation (override in subclasses)
      const result = await this.selfEvaluate(ctx, childResults);

      // Post-evaluation invariant check
      this.validateInvariants();

      this._lastEvaluation = new Date();
      return result;

    } finally {
      this._evaluating = false;
    }
  }

  /**
   * Override this for custom evaluation logic
   */
  protected async selfEvaluate(
    context: ΞEvalContext, 
    childResults: ΞPayload[]
  ): Promise<ΞPayload> {
    // Default: return payload or aggregate child results
    if (this.payload !== null) {
      return this.payload;
    }

    // Simple aggregation for demonstration
    if (childResults.length > 0) {
      return childResults;
    }

    return null;
  }

  // === INVARIANT SYSTEM ===

  /**
   * Add invariant constraint
   */
  addInvariant(invariant: ΞInvariant): void {
    this.invariants.push(invariant);
  }

  /**
   * Validate all invariants
   */
  validateInvariants(): void {
    for (const invariant of this.invariants) {
      if (!invariant.check(this)) {
        throw new Error(`Invariant violation in ${this.id}: ${invariant.errorMessage}`);
      }
    }
  }

  // === SYMBOLIC INTROSPECTION ===

  /**
   * Generate symbolic representation
   */
  toSymbolic(): object {
    return {
      id: this.id,
      type: this.constructor.name,
      payload: this.payload,
      metadata: this.metadata,
      children: this.children.map(c => c.toSymbolic()),
      path: this.getPath(),
      evaluationCount: this._evaluationCount,
      lastEvaluation: this._lastEvaluation,
      isEvaluating: this._evaluating
    };
  }

  /**
   * Clone symbol structure (deep copy)
   */
  clone(): ΞSymbol {
    const cloned = new ΞSymbol(this.id, this.payload, { ...this.metadata });
    cloned.invariants = [...this.invariants];
    
    for (const child of this.children) {
      cloned.append(child.clone());
    }
    
    return cloned;
  }

  /**
   * Get structural metrics
   */
  getMetrics(): {
    depth: number;
    breadth: number;
    totalNodes: number;
    evaluationCount: number;
    complexity: number;
  } {
    const totalNodes = this.countNodes();
    const depth = this.getMaxDepth();
    const breadth = this.children.length;
    
    return {
      depth,
      breadth,
      totalNodes,
      evaluationCount: this._evaluationCount,
      complexity: Math.round(totalNodes * 0.5 + depth * 2 + breadth * 1.5)
    };
  }

  private countNodes(): number {
    return 1 + this.children.reduce((sum, child) => sum + child.countNodes(), 0);
  }

  private getMaxDepth(): number {
    if (this.children.length === 0) return 0;
    return 1 + Math.max(...this.children.map(child => child.getMaxDepth()));
  }

  // === DEBUGGING & VISUALIZATION ===

  /**
   * Pretty print tree structure
   */
  toString(indent: string = ''): string {
    const payloadStr = this.payload !== null ? ` → ${JSON.stringify(this.payload)}` : '';
    const metaStr = Object.keys(this.metadata).length > 0 ? ` {${Object.keys(this.metadata).join(',')}}` : '';
    
    let result = `${indent}ΞSymbol(${this.id})${payloadStr}${metaStr}\n`;
    
    for (let i = 0; i < this.children.length; i++) {
      const isLast = i === this.children.length - 1;
      const childIndent = indent + (isLast ? '  └─ ' : '  ├─ ');
      const grandChildIndent = indent + (isLast ? '     ' : '  │  ');
      
      result += this.children[i].toString(grandChildIndent);
    }
    
    return result;
  }
}

// === SYMBOLIC INVARIANTS LIBRARY ===

export const ΞInvariants = {
  /**
   * Ensure symbol has at least one child
   */
  hasChildren: (): ΞInvariant => ({
    name: 'hasChildren',
    check: (symbol) => symbol.children.length > 0,
    errorMessage: 'Symbol must have at least one child'
  }),

  /**
   * Limit maximum children
   */
  maxChildren: (max: number): ΞInvariant => ({
    name: 'maxChildren',
    check: (symbol) => symbol.children.length <= max,
    errorMessage: `Symbol cannot have more than ${max} children`
  }),

  /**
   * Ensure payload is of specific type
   */
  payloadType: (type: string): ΞInvariant => ({
    name: 'payloadType',
    check: (symbol) => typeof symbol.payload === type,
    errorMessage: `Payload must be of type ${type}`
  }),

  /**
   * Prevent deep nesting
   */
  maxDepth: (max: number): ΞInvariant => ({
    name: 'maxDepth',
    check: (symbol) => symbol.getMetrics().depth <= max,
    errorMessage: `Symbol tree cannot exceed depth ${max}`
  }),

  /**
   * Ensure metadata contains required keys
   */
  requiredMetadata: (keys: string[]): ΞInvariant => ({
    name: 'requiredMetadata',
    check: (symbol) => keys.every(key => key in symbol.metadata),
    errorMessage: `Symbol must have metadata keys: ${keys.join(', ')}`
  })
};