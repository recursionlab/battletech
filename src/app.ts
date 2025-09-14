import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

import { ΞKernel } from './core/xi-kernel';
import { OpenRouterLLMPort } from './core/openrouter-port';
import { MockLLMPort } from './core/xi-kernel';
import { SimpleOpenRouterPort } from './core/simple-openrouter';

// Initialize kernel (OpenRouter if key present)
let kernel: ΞKernel;
const openRouterKey = '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';
console.log('DEBUG: Using hardcoded API key first 20 chars:', openRouterKey.substring(0, 20) + '...');
const openRouterForce = /^1|true|yes$/i.test((process.env.OPENROUTER_FORCE || '').toString());
let usingOpenRouter = false;
let openRouterReachable = false;

async function probeOpenRouter(key: string): Promise<boolean> {
  // Probe using configured base URL and model, short timeout.
  const rawBase = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  const base = rawBase.replace(/\/?$/, '');
  const url = `${base}/chat/completions`;
  const model = process.env.OPENROUTER_MODEL || 'openrouter/sonoma-dusk-alpha';
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 }),
      signal: controller.signal
    });
    clearTimeout(id);
    const ct = res.headers.get('content-type') || '';
    if (!res.ok) return false;
    if (!ct.includes('application/json')) return false;
    return true;
  } catch (err: any) {
    console.warn('OpenRouter probe failed', err?.message || err);
    return false;
  }
}

// Initialize kernel: prefer OpenRouter if key present and reachable, otherwise use Mock
if (openRouterKey && openRouterForce) {
  kernel = new ΞKernel(new SimpleOpenRouterPort(openRouterKey));
  usingOpenRouter = true;
  openRouterReachable = true; // assume reachable when forced
  console.log('ΞKernel: FORCING SimpleOpenRouterPort usage via OPENROUTER_FORCE');
} else if (openRouterKey) {
  (async () => {
    const reachable = await probeOpenRouter(openRouterKey);
    openRouterReachable = reachable;
    if (reachable) {
      const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
      const model = process.env.OPENROUTER_MODEL || 'openrouter/sonoma-dusk-alpha';
      kernel = new ΞKernel(new OpenRouterLLMPort(openRouterKey, { baseUrl, model }));
      usingOpenRouter = true;
      console.log('ΞKernel: using OpenRouterLLMPort');
    } else {
      console.warn('OpenRouter key present but probe failed; falling back to MockLLMPort');
      kernel = new ΞKernel(new MockLLMPort());
      usingOpenRouter = false;
    }
  })();
} else {
  kernel = new ΞKernel(new MockLLMPort());
}

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

export { app, kernel };
