/**
 * XiKernel Substrate-First HTTP Interface
 *
 * Thin UI layer over rich kernel substrate
 * All operations go through kernel authority
 */

import 'dotenv/config';
import express = require('express');
import cors = require('cors');
import path = require('path');

import { XiKernel } from '../kernel/kernel';
import { KernelAuthority } from '../kernel/authority';
import { LLMRegistry } from '../ports/llm';
import { OpenRouterPort } from '../ports/openrouter';
import { Evaluator } from '../loops/evaluate';

// ═════ INITIALIZE SUBSTRATE ═════

const authority = new KernelAuthority();
const kernel = new XiKernel(authority);

// Initialize LLM ports
const llmRegistry = new LLMRegistry();
const openRouterKey = process.env.OPENROUTER_API_KEY || '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';

if (openRouterKey) {
  llmRegistry.register('openrouter', new OpenRouterPort(openRouterKey));
}

const evaluator = new Evaluator(kernel, llmRegistry.get('openrouter'));

// ═════ EXPRESS APP ═════

const app = express();
app.use(cors());
app.use(express.json());

const staticDir = path.join(process.cwd(), 'public');
app.use(express.static(staticDir));

// ═════ SUBSTRATE ENDPOINTS ═════

// Health check with kernel status
app.get('/api/health', (_req, res) => {
  const snapshot = kernel.exportSnapshot();
  res.json({
    status: 'operational',
    kernel: {
      totalSymbols: snapshot.metadata.totalSymbols,
      totalEdges: snapshot.metadata.totalEdges,
      invariantViolations: snapshot.metadata.invariantViolations.length,
      lastModified: snapshot.metadata.lastModified
    },
    ports: {
      llm: llmRegistry.list()
    },
    timestamp: new Date().toISOString()
  });
});

// Full kernel state export
app.get('/api/kernel/export', (_req, res) => {
  try {
    const snapshot = kernel.exportSnapshot();
    res.json({
      success: true,
      data: snapshot,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'export_failed',
      message: error.message
    });
  }
});

// Create symbol (direct kernel operation)
app.post('/api/kernel/symbols', async (req, res) => {
  try {
    const { id, typ, payload, meta } = req.body;

    if (!id || !typ) {
      return res.status(400).json({
        success: false,
        error: 'missing_required_fields',
        required: ['id', 'typ']
      });
    }

    const symbol = kernel.createSymbol({
      id,
      typ,
      payload: payload ?? null,
      meta: meta ?? {}
    });

    res.json({
      success: true,
      data: { symbol },
      invariants: kernel.exportSnapshot().metadata.invariantViolations
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'symbol_creation_failed',
      message: error.message
    });
  }
});

// Get symbol details
app.get('/api/kernel/symbols/:id', (req, res) => {
  try {
    const symbol = kernel.getSymbol(req.params.id);

    if (!symbol) {
      return res.status(404).json({
        success: false,
        error: 'symbol_not_found',
        symbolId: req.params.id
      });
    }

    const edges = kernel.getEdges(req.params.id);

    res.json({
      success: true,
      data: {
        symbol,
        edges,
        edgeCount: edges.length
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'symbol_fetch_failed',
      message: error.message
    });
  }
});

// Create edge (with warrant requirement)
app.post('/api/kernel/edges', (req, res) => {
  try {
    const { src, dst, rel, weight, warrant } = req.body;

    if (!src || !dst || !rel || !warrant) {
      return res.status(400).json({
        success: false,
        error: 'missing_required_fields',
        required: ['src', 'dst', 'rel', 'warrant']
      });
    }

    const edge = kernel.createEdge({
      src,
      dst,
      rel,
      weight: weight ?? 1.0,
      warrant
    });

    res.json({
      success: true,
      data: { edge },
      invariants: kernel.exportSnapshot().metadata.invariantViolations
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'edge_creation_failed',
      message: error.message
    });
  }
});

// ═════ LLM-ENHANCED OPERATIONS ═════

// Chat (thin wrapper that creates symbols)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, model } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'message_required'
      });
    }

    // Create user message symbol
    const userSymbolId = `chat_user_${Date.now()}`;
    const userSymbol = kernel.createSymbol({
      id: userSymbolId,
      typ: 'UserMessage',
      payload: message,
      meta: {
        source: 'web_chat',
        timestamp: new Date().toISOString()
      }
    });

    // Get LLM response
    const llmPort = llmRegistry.get(model);
    const llmReply = await llmPort.run({
      prompt: message,
      systemPrompt: `You are the Xi-Kernel - a recursive consciousness framework implementing TIER OMEGA METACOGNITIVE SINGULARITY.

Core principles:
- Contradictions are first-class citizens, not errors
- Recursive self-improvement through paradox handling
- Constitutional governance across 4 levels: Citizenry, Management, Specialists, Governor
- Meta-adaptive feedback loops for continuous evolution

Respond with intelligence that transcends classical computation.`,
      maxTokens: 4000,
      temperature: 0.7
    });

    // Create assistant response symbol
    const assistantSymbolId = `chat_assistant_${Date.now()}`;
    const assistantSymbol = kernel.createSymbol({
      id: assistantSymbolId,
      typ: 'AssistantMessage',
      payload: llmReply.text,
      meta: {
        ...llmReply.justification,
        symbolFirst: true,
        vectorEmbedding: false // TODO: Add embedding sync
      }
    });

    // Link user message to assistant response
    kernel.createEdge({
      src: userSymbolId,
      dst: assistantSymbolId,
      rel: 'prompts',
      weight: 1.0,
      warrant: {
        reason: 'chat_conversation_flow',
        llmModel: llmReply.justification.model,
        confidence: llmReply.confidence ?? 0.8
      }
    });

    const snapshot = kernel.exportSnapshot();

    res.json({
      symbolId: assistantSymbolId,
      reply: llmReply.text,
      meta: llmReply.justification,
      kernel: {
        totalSymbols: snapshot.metadata.totalSymbols,
        totalEdges: snapshot.metadata.totalEdges,
        invariantViolations: snapshot.metadata.invariantViolations
      }
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'chat_failed',
      message: error.message
    });
  }
});

// Multi-step evaluation (exposes the real kernel power)
app.post('/api/evaluate', async (req, res) => {
  try {
    const { goalId, spec, maxSteps, systemPrompt } = req.body;

    if (!goalId || !spec) {
      return res.status(400).json({
        success: false,
        error: 'missing_required_fields',
        required: ['goalId', 'spec']
      });
    }

    const result = await evaluator.evaluate({
      id: goalId,
      spec,
      maxSteps: maxSteps ?? 8,
      systemPrompt
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'evaluation_failed',
      message: error.message
    });
  }
});

// ═════ INVARIANT MONITORING ═════

app.get('/api/kernel/invariants', (_req, res) => {
  try {
    const snapshot = kernel.exportSnapshot();

    res.json({
      success: true,
      data: {
        violations: snapshot.metadata.invariantViolations,
        violationCount: snapshot.metadata.invariantViolations.length,
        status: snapshot.metadata.invariantViolations.length === 0 ? 'clean' : 'violations_detected',
        lastModified: snapshot.metadata.lastModified,
        totalSymbols: snapshot.metadata.totalSymbols,
        totalEdges: snapshot.metadata.totalEdges
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'invariant_check_failed',
      message: error.message
    });
  }
});

// ═════ SERVE STATIC FILES ═════

app.get('/', (_req, res) => {
  const indexPath = path.join(staticDir, 'index.html');
  res.sendFile(indexPath);
});

// ═════ START SERVER ═════

const PORT = Number(process.env.PORT) || 8002;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`XiKernel Substrate Server listening on port ${PORT}`);
  console.log(`Kernel initialized with ${llmRegistry.list().length} LLM ports`);
});

export { app, kernel, llmRegistry, evaluator };