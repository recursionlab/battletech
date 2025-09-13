import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

import { ΞKernel } from './core/xi-kernel';
import { OpenRouterLLMPort } from './core/openrouter-port';
import { MockLLMPort } from './core/xi-kernel';

// Initialize kernel (OpenRouter if key present)
let kernel: ΞKernel;
const openRouterKey = process.env.OPENROUTER_API_KEY || '';
let usingOpenRouter = false;
let openRouterReachable = false;

async function probeOpenRouter(key: string): Promise<boolean> {
  // Small, best-effort probe: call the OpenRouter chat completions endpoint
  // with a very short timeout. Returns true if we get a JSON response.
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('https://api.openrouter.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || 'gpt-4o-mini', messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 }),
      signal: controller.signal
    });
    clearTimeout(id);
    const ct = res.headers.get('content-type') || '';
    if (!res.ok) {
      console.warn('OpenRouter probe returned non-OK status', res.status);
      return false;
    }
    if (!ct.includes('application/json')) {
      console.warn('OpenRouter probe returned non-JSON content-type', ct);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('OpenRouter probe failed', err?.message || err);
    return false;
  }
}

// Initialize kernel: prefer OpenRouter if key present and reachable, otherwise use Mock
if (openRouterKey) {
  (async () => {
    try {
      openRouterReachable = await probeOpenRouter(openRouterKey);
      if (openRouterReachable) {
        kernel = new ΞKernel(new OpenRouterLLMPort(openRouterKey));
        usingOpenRouter = true;
        console.log('ΞKernel: using OpenRouterLLMPort (probe succeeded)');
      } else {
        console.warn('OpenRouter key present but probe failed; falling back to MockLLMPort');
        kernel = new ΞKernel(new MockLLMPort());
      }
    } catch (err) {
      console.error('OpenRouter init error, falling back to MockLLMPort', err);
      kernel = new ΞKernel(new MockLLMPort());
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
    return res.status(500).json({ error: 'internal_error', detail: String(err?.message || err) });
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
    model: process.env.OPENROUTER_MODEL || null
  });
});

export { app, kernel };
