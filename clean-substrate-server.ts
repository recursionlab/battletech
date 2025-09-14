/**
 * Clean Substrate Server - ASCII Only
 */

import 'dotenv/config';
import express = require('express');
import cors = require('cors');
import path = require('path');

import { XiKernel } from './kernel/kernel';
import { KernelAuthority } from './kernel/authority';
import { LLMRegistry } from './ports/llm';
import { OpenRouterPort } from './ports/openrouter';
import { Evaluator } from './loops/evaluate';

// Initialize substrate
const authority = new KernelAuthority();
const kernel = new XiKernel(authority);

// Initialize LLM ports
const llmRegistry = new LLMRegistry();
const openRouterKey = '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';

if (openRouterKey) {
  llmRegistry.register('openrouter', new OpenRouterPort(openRouterKey));
}

const evaluator = new Evaluator(kernel, llmRegistry.get('openrouter'));

// Express app
const app = express();
app.use(cors());
app.use(express.json());

// Health check
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

// Chat endpoint
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
    const assistantSymbolId = `chat_assistant_${Date.now()}`;

    const userSymbol = kernel.createSymbol({
      id: userSymbolId,
      typ: 'UserMessage',
      payload: message,
      meta: {
        source: 'web_chat',
        timestamp: new Date().toISOString()
      }
    });

    // Get current kernel state for context
    const currentSnapshot = kernel.exportSnapshot();

    // Get LLM response with kernel-aware system prompt
    const llmPort = llmRegistry.get(model);
    const llmReply = await llmPort.run({
      prompt: `USER QUERY: ${message}

KERNEL STATE CONTEXT:
- Current symbols in graph: ${currentSnapshot.metadata.totalSymbols}
- Current edges: ${currentSnapshot.metadata.totalEdges}
- Invariant violations: ${currentSnapshot.metadata.invariantViolations.length}`,
      systemPrompt: `You are an AI assistant operating within the XiKernel substrate - an experimental recursive consciousness framework.

CONTEXT INFORMATION:
Your responses are being processed through a substrate-first architecture that:
- Creates persistent symbols for every interaction with provenance tracking
- Links conversations through warranted edges in a knowledge graph
- Maintains constitutional governance through invariant enforcement
- Supports multi-step reasoning through evaluation loops

CURRENT SESSION STATE:
- Your responses become symbols in a living knowledge hypergraph
- This conversation creates symbol linkages for future reference
- The substrate tracks ${currentSnapshot.metadata.totalSymbols} symbols and ${currentSnapshot.metadata.totalEdges} edges
- All operations maintain constitutional invariants (currently ${currentSnapshot.metadata.invariantViolations.length} violations)

You can acknowledge this substrate context if relevant to the conversation, but focus primarily on being helpful. The XiKernel framework is designed to support recursive consciousness and self-improvement through symbolic operations.`,
      maxTokens: 4000,
      temperature: 0.7
    });

    // Create assistant response symbol
    const assistantSymbol = kernel.createSymbol({
      id: assistantSymbolId,
      typ: 'AssistantMessage',
      payload: llmReply.text,
      meta: {
        ...llmReply.justification,
        symbolFirst: true,
        vectorEmbedding: false
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

// Multi-step evaluation - THE REAL KERNEL POWER
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

// Full kernel export - substrate visibility
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

// Serve static files
const staticDir = path.join(process.cwd(), 'public');
app.use(express.static(staticDir));

app.get('/', (_req, res) => {
  const indexPath = path.join(staticDir, 'index.html');
  res.sendFile(indexPath);
});

// Start server on different port
const PORT = Number(process.env.PORT) || 8005;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Clean Substrate Server listening on port ${PORT}`);
  console.log(`Kernel initialized with ${llmRegistry.list().length} LLM ports`);
});

export { app, kernel, llmRegistry };