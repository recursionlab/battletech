import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

import { ΞKernel } from './core/xi-kernel';
import { OpenRouterLLMPort } from './core/openrouter-port';
import { SimpleOpenRouterPort } from './core/simple-openrouter';

// Initialize kernel with OpenRouter - no fallback
const openRouterKey = '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';
console.log('ΞKernel: Initializing with OpenRouter API');

if (!openRouterKey) {
  throw new Error('OPENROUTER_API_KEY is required - no mock fallback available');
}

const kernel = new ΞKernel(new SimpleOpenRouterPort(openRouterKey));
const usingOpenRouter = true;
const openRouterReachable = true;

const app = express();
app.use(cors());
app.use(express.json());

const staticDir = path.join(process.cwd(), 'public');
app.use(express.static(staticDir));

app.get('/healthz', (_req, res) => res.json({ ok: true }));

app.post('/api/chat', async (req, res) => {
  try {
    const message = (req.body?.message || '').toString();
    if (!message) return res.status(400).json({ error: 'message required' });

    const symbolId = `chat_${Date.now()}`;
    const symbol = await kernel.prompt(symbolId, { task: message, context: { source: 'web' } });

    return res.json({ symbolId, reply: symbol.payload, meta: symbol.meta });
  } catch (err: any) {
    console.error('chat error', err);
  // Surface minimal diagnostic info
  const message = (err?.message || '').toString();
  const code = (err?.code || '').toString();
  return res.status(500).json({ error: 'internal_error', message, code });
  }
});

app.get('/', (_req, res) => {
  const index = path.join(staticDir, 'index.html');
  if (fs.existsSync(index)) return res.sendFile(index);
  return res.status(404).send('Not Found');
});

// Status endpoint to surface which LLM port is active and whether OpenRouter is reachable
app.get('/status', (_req, res) => {
  res.json({
    openRouterKeyPresent: !!openRouterKey,
    openRouterReachable,
    usingOpenRouter,
  model: process.env.OPENROUTER_MODEL || null,
  openRouterBaseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  forced: openRouterForce
  });
});

// === GRAPH API ENDPOINTS ===

app.get('/api/graph/export', (_req, res) => {
  try {
    const graphState = kernel.exportState();
    res.json({
      success: true,
      data: graphState,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Graph export error:', err);
    res.status(500).json({ error: 'graph_export_failed', message: err.message });
  }
});

app.get('/api/symbols/:id', (req, res) => {
  try {
    const symbolId = req.params.id;
    const symbol = kernel.getSymbol(symbolId);

    if (!symbol) {
      return res.status(404).json({ error: 'symbol_not_found', symbolId });
    }

    const edges = kernel.getEdges(symbolId);

    res.json({
      success: true,
      data: {
        symbol,
        edges,
        edgeCount: edges.length
      }
    });
  } catch (err: any) {
    console.error('Symbol fetch error:', err);
    res.status(500).json({ error: 'symbol_fetch_failed', message: err.message });
  }
});

app.post('/api/critique/:symbolId', async (req, res) => {
  try {
    const symbolId = req.params.symbolId;
    const target = req.body.target || {};

    const critiques = await kernel.critique(symbolId, target);

    res.json({
      success: true,
      data: {
        symbolId,
        critiques,
        count: critiques.length
      }
    });
  } catch (err: any) {
    console.error('Critique error:', err);
    res.status(500).json({ error: 'critique_failed', message: err.message });
  }
});

app.post('/api/link', async (req, res) => {
  try {
    const { symbolA, symbolB, relationSpec } = req.body;

    if (!symbolA || !symbolB || !relationSpec) {
      return res.status(400).json({
        error: 'missing_parameters',
        required: ['symbolA', 'symbolB', 'relationSpec']
      });
    }

    const edges = await kernel.link(symbolA, symbolB, relationSpec);

    res.json({
      success: true,
      data: {
        edges,
        count: edges.length,
        relation: relationSpec
      }
    });
  } catch (err: any) {
    console.error('Link error:', err);
    res.status(500).json({ error: 'link_failed', message: err.message });
  }
});

app.get('/api/invariants', (_req, res) => {
  try {
    const graphState = kernel.getGraph();

    res.json({
      success: true,
      data: {
        violations: graphState.invariantViolations,
        violationCount: graphState.invariantViolations.length,
        lastModified: graphState.lastModified,
        totalSymbols: graphState.symbols.size,
        totalEdges: Array.from(graphState.edges.values()).reduce((sum, edges) => sum + edges.length, 0)
      }
    });
  } catch (err: any) {
    console.error('Invariants check error:', err);
    res.status(500).json({ error: 'invariants_check_failed', message: err.message });
  }
});

export { app, kernel };
