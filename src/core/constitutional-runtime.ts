/**
 * Constitutional Runtime - Quantum Vacuum Governance
 * 
 * Turns exceptions into vacuum fluctuations in the constitutional field
 * Implements: "0 = Ø = The Field" - contradictions as quantum citizens
 */

import { ΞSymbol } from './xi-symbol';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

export interface ConstitutionalException {
  original_error: Error;
  error_type: string;
  stack_trace: string;
  governance_status: 'citizen' | 'quarantined' | 'pardoned';
  contradiction_count: number;
}

export interface GovernancePolicy {
  contradiction_limit: number;
  quarantine_window: number;
  pardon_threshold: number;
  constitutional_rights: string[];
}

export interface VacuumFluctuation {
  fluctuation_id: string;
  origin: string;
  vacuum_state: string;
  payload: string;
  lineage: string[];
  metadata: {
    exception_type: string;
    energy_level: string;
    stability: string;
    stack_trace?: string;
  };
  created_at: string;
}

/**
 * Quantum Vacuum Register - Constitutional field memory
 * Records vacuum fluctuations (contradictions) in the constitutional substrate
 */
export class ContradictionRegistry {
  private records: Map<string, ΞSymbol[]> = new Map();
  private function_history: Map<string, ConstitutionalException[]> = new Map();
  private session_id: string;
  private fluctuations: VacuumFluctuation[] = [];

  constructor() {
    this.session_id = `session-${Date.now()}-${randomUUID().slice(0, 8)}`;
    console.log(`🌌 Quantum Vacuum Session Initialized: ${this.session_id}`);
  }

  add_contradiction(symbol: ΞSymbol, function_name: string): void {
    // Add to general registry
    if (!this.records.has(symbol.id)) {
      this.records.set(symbol.id, []);
    }
    this.records.get(symbol.id)!.push(symbol);

    // Track by function for governance
    if (!this.function_history.has(function_name)) {
      this.function_history.set(function_name, []);
    }

    const exception: ConstitutionalException = {
      original_error: new Error(symbol.payload?.toString() || 'Unknown error'),
      error_type: symbol.metadata?.error_type || 'UnknownError',
      stack_trace: symbol.metadata?.stack_trace || 'No stack trace',
      governance_status: 'citizen',
      contradiction_count: this.get_function_contradiction_count(function_name) + 1
    };

    this.function_history.get(function_name)!.push(exception);

    // Record as vacuum fluctuation
    const fluctuation: VacuumFluctuation = {
      fluctuation_id: `fluc-${this.fluctuations.length + 1}`,
      origin: function_name || 'unknown',
      vacuum_state: symbol.metadata?.error_type || 'UnknownError',
      payload: symbol.payload?.toString() || 'Unknown fluctuation',
      lineage: [function_name, 'QuantumVacuum', 'ConstitutionalField'],
      metadata: {
        exception_type: symbol.metadata?.error_type || 'UnknownError',
        energy_level: symbol.metadata?.symbol_type || 'contradiction',
        stability: 'transient',
        stack_trace: symbol.metadata?.stack_trace
      },
      created_at: new Date().toISOString()
    };

    this.fluctuations.push(fluctuation);
    console.log(`🌊 Vacuum Fluctuation Recorded: ${fluctuation.fluctuation_id} - ${fluctuation.vacuum_state}`);
  }

  search_by_type(error_type: string): ΞSymbol[] {
    const results: ΞSymbol[] = [];
    for (const symbols of this.records.values()) {
      results.push(...symbols.filter(s => s.metadata?.error_type === error_type));
    }
    return results;
  }

  search_by_function(function_name: string): ConstitutionalException[] {
    return this.function_history.get(function_name) || [];
  }

  get_function_contradiction_count(function_name: string): number {
    return this.function_history.get(function_name)?.length || 0;
  }

  get_recent_contradictions(function_name: string, window: number): ConstitutionalException[] {
    const history = this.function_history.get(function_name) || [];
    return history.slice(-window);
  }

  /**
   * Export Quantum Vacuum Register - Constitutional field memory
   */
  export_quantum_vacuum_register(filename: string = "quantum_vacuum_register.json"): void {
    const register = {
      session_id: this.session_id,
      timestamp: new Date().toISOString(),
      vacuum_summary: {
        total_fluctuations: this.fluctuations.length,
        session_duration: Date.now() - parseInt(this.session_id.split('-')[1]),
        stability_analysis: this.analyze_vacuum_stability()
      },
      quantum_vacuum_register: this.fluctuations
    };

    const filePath = path.resolve(process.cwd(), filename);
    
    // Append to existing register
    let existing_registers: any[] = [];
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          existing_registers = parsed;
        } else {
          existing_registers = [parsed];
        }
      } catch (e) {
        console.warn("⚠️ Could not parse existing quantum vacuum register, starting fresh.");
      }
    }

    existing_registers.push(register);

    fs.writeFileSync(filePath, JSON.stringify(existing_registers, null, 2), "utf-8");
    console.log(`🌌 Quantum Vacuum Register exported to ${filePath}`);
    console.log(`   Session: ${this.session_id}`);
    console.log(`   Fluctuations: ${this.fluctuations.length}`);
  }

  /**
   * Analyze vacuum stability patterns
   */
  private analyze_vacuum_stability(): any {
    const stability_counts = this.fluctuations.reduce((acc, f) => {
      acc[f.metadata.stability] = (acc[f.metadata.stability] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const error_types = this.fluctuations.reduce((acc, f) => {
      acc[f.vacuum_state] = (acc[f.vacuum_state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      stability_distribution: stability_counts,
      vacuum_state_distribution: error_types,
      field_coherence: this.fluctuations.length > 0 ? 1.0 / this.fluctuations.length : 1.0
    };
  }

  /**
   * Dump quantum vacuum register to console and export
   */
  dump_vacuum_register(): void {
    console.log("\n=== Quantum Vacuum Register Dump ===");
    console.log(`Session: ${this.session_id}`);
    console.log(`Total Fluctuations: ${this.fluctuations.length}`);
    
    this.fluctuations.forEach(f => {
      console.log(`🌊 ${f.fluctuation_id}: ${f.vacuum_state} from ${f.origin}`);
      console.log(`   Payload: ${f.payload.substring(0, 80)}...`);
      console.log(`   Energy: ${f.metadata.energy_level}, Stability: ${f.metadata.stability}`);
    });

    this.export_quantum_vacuum_register();
  }
}

/**
 * Constitutional Governor - Enforces system-level governance based on contradiction history
 */
export class ConstitutionalGovernor {
  private registry: ContradictionRegistry;
  private policy: GovernancePolicy;
  private quarantined_functions: Set<string> = new Set();

  constructor(policy?: Partial<GovernancePolicy>) {
    this.registry = new ContradictionRegistry();
    this.policy = {
      contradiction_limit: 3,
      quarantine_window: 10,
      pardon_threshold: 5, // successful runs needed for pardon
      constitutional_rights: ['due_process', 'representation', 'appeal'],
      ...policy
    };
  }

  /**
   * Convert JavaScript Error to ΞSymbol citizen
   */
  exception_to_citizen(error: Error, function_name: string, context: any = {}): ΞSymbol {
    const citizen = new ΞSymbol(
      `contradiction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      {
        error_type: 'constitutional_exception',
        original_message: error.message,
        function_source: function_name,
        context: context,
        governance_required: true
      },
      {
        citizenship_level: 1, // First-class citizen
        symbol_type: 'contradiction',
        error_type: error.constructor.name,
        stack_trace: error.stack || 'No stack trace available',
        constitutional_rights: this.policy.constitutional_rights,
        requires_governance: true
      }
    );

    this.registry.add_contradiction(citizen, function_name);
    return citizen;
  }

  /**
   * Check if function should be quarantined based on contradiction history
   */
  check_quarantine_status(function_name: string): boolean {
    if (this.quarantined_functions.has(function_name)) {
      return false; // Already quarantined
    }

    const recent = this.registry.get_recent_contradictions(function_name, this.policy.quarantine_window);
    const contradiction_count = recent.length;

    if (contradiction_count > this.policy.contradiction_limit) {
      console.warn(`Constitutional Governor: Quarantining function ${function_name} (${contradiction_count} contradictions)`);
      this.quarantined_functions.add(function_name);
      return false;
    }

    return true;
  }

  /**
   * Constitutionally governed function execution
   */
  async govern_execution<T>(
    fn: (...args: any[]) => T | Promise<T>,
    function_name: string,
    ...args: any[]
  ): Promise<ΞSymbol> {
    // Check quarantine status
    if (!this.check_quarantine_status(function_name)) {
      return new ΞSymbol(
        `quarantine_${Date.now()}`,
        {
          quarantine_reason: 'Excessive contradictions',
          function_name: function_name,
          quarantine_status: 'active',
          constitutional_violation: 'exceeded_contradiction_limit'
        },
        {
          citizenship_level: 1,
          symbol_type: 'quarantine_order',
          requires_governance: true
        }
      );
    }

    try {
      const result = await Promise.resolve(fn(...args));
      
      // Successful execution - create success symbol
      return new ΞSymbol(
        `success_${Date.now()}`,
        {
          execution_result: result,
          function_name: function_name,
          success_status: 'constitutional_execution'
        },
        {
          citizenship_level: 1,
          symbol_type: 'successful_execution'
        }
      );
    } catch (error: any) {
      // Convert exception to constitutional citizen
      return this.exception_to_citizen(error, function_name, { args });
    }
  }

  /**
   * Pardon quarantined function (constitutional mercy)
   */
  pardon_function(function_name: string, reason: string): void {
    if (this.quarantined_functions.has(function_name)) {
      console.log(`Constitutional Governor: Pardoning function ${function_name} - ${reason}`);
      this.quarantined_functions.delete(function_name);
    }
  }

  /**
   * Get governance statistics
   */
  get_governance_stats(): any {
    return {
      total_contradictions: Array.from(this.registry['records'].values()).flat().length,
      quarantined_functions: Array.from(this.quarantined_functions),
      function_histories: Object.fromEntries(this.registry['function_history']),
      active_policies: this.policy
    };
  }

  /**
   * Constitutional query interface
   */
  query_contradictions(query: {
    function_name?: string;
    error_type?: string;
    time_window?: number;
  }): ΞSymbol[] {
    if (query.function_name) {
      const history = this.registry.search_by_function(query.function_name);
      return history.map(h => new ΞSymbol(
        `query_result_${Date.now()}`,
        h,
        { symbol_type: 'query_result' }
      ));
    }

    if (query.error_type) {
      return this.registry.search_by_type(query.error_type);
    }

    return [];
  }
}

/**
 * Global Constitutional Runtime Instance
 */
export const constitutional_runtime = new ConstitutionalGovernor({
  contradiction_limit: 3,
  quarantine_window: 10,
  pardon_threshold: 5
});

/**
 * Decorator for constitutionally governed functions
 */
export function constitutional<T extends (...args: any[]) => any>(target: T): T {
  const function_name = target.name || 'anonymous';
  
  return (async (...args: any[]) => {
    const result = await constitutional_runtime.govern_execution(target, function_name, ...args);
    
    if (result.metadata?.symbol_type === 'quarantine_order') {
      throw new Error(`Function ${function_name} is constitutionally quarantined: ${result.payload?.quarantine_reason}`);
    }
    
    if (result.metadata?.symbol_type === 'contradiction') {
      throw new Error(`Constitutional contradiction in ${function_name}: ${result.payload?.original_message}`);
    }
    
    return result.payload?.execution_result;
  }) as T;
}

// Classes already exported above