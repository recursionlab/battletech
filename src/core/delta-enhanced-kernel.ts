/**
 * Δ-Enhanced ΞKernel - Epistemic Analysis Integration
 * 
 * Extends base kernel with Δ-Layer processing in the symbol pipeline
 */

import { ΞKernel, LLMPort, LLMSpec, Symbol } from './xi-kernel';
import { DeltaLayer, DeltaMetrics } from './delta-layer';

export class DeltaEnhancedKernel extends ΞKernel {
  private deltaEnabled: boolean = true;
  private interventionMode: boolean = false;

  constructor(llmPort: LLMPort, options: { deltaEnabled?: boolean, interventionMode?: boolean } = {}) {
    super(llmPort);
    this.deltaEnabled = options.deltaEnabled ?? true;
    this.interventionMode = options.interventionMode ?? false;
  }

  /**
   * Enhanced prompt with Δ-Layer processing
   */
  async prompt(symbolId: string, spec: Partial<LLMSpec>): Promise<Symbol> {
    // Get base response from parent kernel
    const symbol = await super.prompt(symbolId, spec);

    // Process through Δ-Layer if enabled
    if (this.deltaEnabled) {
      const enhancedSymbol = DeltaLayer.process(symbol);
      
      // Log epistemic analysis
      console.log(`\n🔍 ${DeltaLayer.generateReport(enhancedSymbol)}\n`);
      
      // Handle interventions if needed
      if (this.interventionMode && DeltaLayer.needsIntervention(enhancedSymbol)) {
        await this.handleIntervention(enhancedSymbol);
      }

      return enhancedSymbol;
    }

    return symbol;
  }

  /**
   * Handle epistemic interventions for problematic symbols
   */
  private async handleIntervention(symbol: Symbol): Promise<void> {
    const metrics = symbol.meta.delta as DeltaMetrics;
    console.log(`⚠️  Δ-INTERVENTION TRIGGERED for ${symbol.id}`);
    
    if (metrics.delta) {
      console.log(`   Δ: Contradiction detected - ${metrics.contradictionType}`);
      
      // Attempt contradiction resolution
      const resolution = await super.prompt(`${symbol.id}_contradiction_resolution`, {
        symbolId: `${symbol.id}_resolution`,
        task: `Address this contradiction in the previous response: "${symbol.payload}". Provide a coherent resolution or acknowledge the productive tension.`,
        context: { 
          interventionType: 'contradiction_resolution',
          originalSymbol: symbol.id 
        },
        constraints: { maxTokens: 300 }
      });

      console.log(`   → Resolution attempt: "${resolution.payload.slice(0, 80)}..."`);
    }

    if (metrics.lacuna && metrics.epistemicScore < 0.3) {
      console.log(`   Λ: Problematic gap detected - ${metrics.lacunaLocation}`);
      
      // Attempt gap filling
      const gapFill = await super.prompt(`${symbol.id}_gap_analysis`, {
        symbolId: `${symbol.id}_gap_fill`,
        task: `Identify and address the information gaps in: "${symbol.payload}". What additional information is needed?`,
        context: { 
          interventionType: 'gap_analysis',
          originalSymbol: symbol.id 
        },
        constraints: { maxTokens: 250 }
      });

      console.log(`   → Gap analysis: "${gapFill.payload.slice(0, 80)}..."`);
    }
  }

  /**
   * Analyze epistemic patterns across the knowledge graph
   */
  async generateEpistemicReport(): Promise<{
    totalSymbols: number;
    phiCount: number;
    deltaCount: number;
    lacunaCount: number;
    avgEpistemicScore: number;
    topConcerns: string[];
  }> {
    const state = this.exportState();
    
    let phiCount = 0;
    let deltaCount = 0; 
    let lacunaCount = 0;
    let totalScore = 0;
    let processedCount = 0;
    const concerns: string[] = [];

    for (const [id, symbol] of Object.entries(state.symbols)) {
      const metrics = symbol.meta.delta as DeltaMetrics;
      if (!metrics) continue;

      processedCount++;
      totalScore += metrics.epistemicScore;

      if (metrics.phi) phiCount++;
      if (metrics.delta) {
        deltaCount++;
        concerns.push(`${id}: Contradiction (${metrics.contradictionType})`);
      }
      if (metrics.lacuna) {
        lacunaCount++;
        if (metrics.epistemicScore < 0.3) {
          concerns.push(`${id}: Problematic gap (${metrics.lacunaLocation})`);
        }
      }
    }

    return {
      totalSymbols: processedCount,
      phiCount,
      deltaCount,
      lacunaCount,
      avgEpistemicScore: processedCount > 0 ? totalScore / processedCount : 0,
      topConcerns: concerns.slice(0, 5) // Top 5 concerns
    };
  }

  /**
   * Enable/disable Δ-Layer processing
   */
  setDeltaMode(enabled: boolean, interventionMode: boolean = false): void {
    this.deltaEnabled = enabled;
    this.interventionMode = interventionMode;
    console.log(`🔄 Δ-Layer: ${enabled ? 'ENABLED' : 'DISABLED'}`);
    if (enabled && interventionMode) {
      console.log(`⚠️  Intervention mode: ACTIVE`);
    }
  }

  /**
   * Get epistemic quality distribution
   */
  getEpistemicDistribution(): { high: number; medium: number; low: number } {
    const state = this.exportState();
    const distribution = { high: 0, medium: 0, low: 0 };

    for (const symbol of Object.values(state.symbols)) {
      const metrics = symbol.meta.delta as DeltaMetrics;
      if (!metrics) continue;

      if (metrics.epistemicScore >= 0.7) distribution.high++;
      else if (metrics.epistemicScore >= 0.4) distribution.medium++;
      else distribution.low++;
    }

    return distribution;
  }
}