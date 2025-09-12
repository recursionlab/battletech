/**
 * Δ-Layer: Epistemic Depth Analysis for ΞKernel
 * 
 * Grafts φ/Δ/Λ detection into the symbol processing pipeline
 * Transforms neutral semantics into structured epistemic evaluation
 */

import { Symbol } from './xi-kernel';

// Epistemic markers detected in content
export interface DeltaMetrics {
  phi: boolean;          // φ - Suspension detected
  delta: boolean;        // Δ - Contradiction detected  
  lacuna: boolean;       // Λ - Gap/missing detected
  tauDepth: number;      // τ - Meta-cognitive depth
  contradictionType?: string;
  suspensionReason?: string;
  lacunaLocation?: string;
  epistemicScore: number; // Overall epistemic quality 0-1
}

// Core Δ-Layer processor
export class DeltaLayer {
  
  /**
   * Process symbol through epistemic analysis
   */
  static process(symbol: Symbol): Symbol {
    const content = symbol.payload?.toString() || '';
    const metrics = this.analyzeContent(content);
    
    // Graft Δ-metrics into symbol metadata
    symbol.meta.delta = metrics;
    symbol.meta.epistemicProcessed = true;
    symbol.meta.deltaTimestamp = new Date().toISOString();
    
    return symbol;
  }

  /**
   * Deep epistemic analysis of content
   */
  private static analyzeContent(content: string): DeltaMetrics {
    const metrics: DeltaMetrics = {
      phi: false,
      delta: false,
      lacuna: false,
      tauDepth: 0,
      epistemicScore: 0.5
    };

    // === φ DETECTION (Suspension) ===
    const suspensionMarkers = [
      /I don't know/i,
      /uncertain/i,
      /not sure/i,
      /unclear/i,
      /ambiguous/i,
      /might be/i,
      /could be/i,
      /perhaps/i,
      /possibly/i,
      /hypothesis/i
    ];

    for (const marker of suspensionMarkers) {
      if (marker.test(content)) {
        metrics.phi = true;
        metrics.suspensionReason = marker.source;
        break;
      }
    }

    // === Δ DETECTION (Contradiction) ===
    const contradictionPatterns = [
      /(.+) is not \1/i,                    // "A is not A"
      /both (.+) and not \1/i,              // "Both X and not X"
      /simultaneously (.+) and (.+)/i,       // Simultaneous opposites
      /however|but|although|despite/i,       // Contradiction signals
      /on one hand.+on the other/i,         // Explicit contradiction structure
      /paradox/i,
      /contradiction/i,
      /inconsistent/i
    ];

    for (const pattern of contradictionPatterns) {
      if (pattern.test(content)) {
        metrics.delta = true;
        metrics.contradictionType = pattern.source;
        break;
      }
    }

    // === Λ DETECTION (Lacuna/Gaps) ===
    const lacunaMarkers = [
      /\[missing\]/i,
      /\[unknown\]/i,
      /\[unclear\]/i,
      /incomplete/i,
      /partial/i,
      /gaps? in/i,
      /missing data/i,
      /insufficient information/i,
      /need more/i,
      /requires further/i,
      /\.\.\./,                             // Ellipsis indicating gaps
      /undefined/i,
      /null/i
    ];

    for (const marker of lacunaMarkers) {
      if (marker.test(content)) {
        metrics.lacuna = true;
        metrics.lacunaLocation = marker.source;
        break;
      }
    }

    // === τ DEPTH ANALYSIS (Meta-cognitive depth) ===
    const metaCognitiveMarkers = [
      /thinking about thinking/i,
      /meta-/i,
      /recursive/i,
      /self-referential/i,
      /level of analysis/i,
      /perspective on/i,
      /framework/i,
      /paradigm/i,
      /assumption/i,
      /presupposition/i,
      /belief about belief/i
    ];

    let depthScore = 0;
    for (const marker of metaCognitiveMarkers) {
      const matches = content.match(new RegExp(marker.source, 'gi'));
      if (matches) {
        depthScore += matches.length;
      }
    }
    
    metrics.tauDepth = Math.min(depthScore, 10); // Cap at 10

    // === EPISTEMIC QUALITY SCORING ===
    metrics.epistemicScore = this.calculateEpistemicScore(metrics, content);

    return metrics;
  }

  /**
   * Calculate overall epistemic quality score
   */
  private static calculateEpistemicScore(metrics: DeltaMetrics, content: string): number {
    let score = 0.5; // Base neutral score

    // Bonus for meta-cognitive depth
    score += metrics.tauDepth * 0.05;

    // Bonus for productive suspension (φ with reasoning)
    if (metrics.phi && content.length > 50) {
      score += 0.1; // Thoughtful uncertainty
    }

    // Bonus for handled contradictions (Δ with resolution attempts)
    if (metrics.delta && /resolve|address|handle/i.test(content)) {
      score += 0.15; // Productive contradiction work
    }

    // Penalty for unaddressed gaps
    if (metrics.lacuna && !/will|should|need to/i.test(content)) {
      score -= 0.1; // Unproductive gaps
    }

    // Bonus for evidence markers
    const evidenceMarkers = /evidence|data|research|study|analysis|proof/i;
    if (evidenceMarkers.test(content)) {
      score += 0.1;
    }

    // Bonus for reasoning markers  
    const reasoningMarkers = /because|therefore|thus|hence|consequently|since/i;
    const reasoningCount = (content.match(reasoningMarkers) || []).length;
    score += reasoningCount * 0.02;

    return Math.max(0, Math.min(1, score)); // Clamp 0-1
  }

  /**
   * Generate human-readable epistemic report
   */
  static generateReport(symbol: Symbol): string {
    const metrics = symbol.meta.delta as DeltaMetrics;
    if (!metrics) return 'No epistemic analysis available';

    const report = [];
    
    report.push(`📊 Epistemic Analysis: ${symbol.id}`);
    report.push(`Score: ${metrics.epistemicScore.toFixed(3)}/1.000`);
    
    if (metrics.phi) {
      report.push(`φ SUSPENSION: ${metrics.suspensionReason || 'detected'}`);
    }
    
    if (metrics.delta) {
      report.push(`Δ CONTRADICTION: ${metrics.contradictionType || 'detected'}`);
    }
    
    if (metrics.lacuna) {
      report.push(`Λ LACUNA: ${metrics.lacunaLocation || 'detected'}`);
    }
    
    if (metrics.tauDepth > 0) {
      report.push(`τ META-DEPTH: ${metrics.tauDepth}`);
    }
    
    if (!metrics.phi && !metrics.delta && !metrics.lacuna && metrics.tauDepth === 0) {
      report.push(`STATUS: Neutral semantics, no Δ-space activity`);
    }

    return report.join('\n   ');
  }

  /**
   * Check if symbol needs Δ-space intervention
   */
  static needsIntervention(symbol: Symbol): boolean {
    const metrics = symbol.meta.delta as DeltaMetrics;
    if (!metrics) return false;

    return (
      metrics.delta ||                           // Active contradictions
      (metrics.lacuna && metrics.epistemicScore < 0.3) || // Problematic gaps
      (metrics.phi && metrics.epistemicScore < 0.2)       // Unproductive suspension
    );
  }
}

// Export for type checking
