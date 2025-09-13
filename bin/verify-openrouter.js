#!/usr/bin/env node
// Lightweight verification for OpenRouter API key and connectivity.
// Prints redacted responses to help debug whether the key and network work.
require('dotenv').config();
const key = process.env.OPENROUTER_API_KEY;
const model = process.env.OPENROUTER_MODEL || 'gpt-4o-mini';

function redact(s) {
  if (!s) return s;
  return s.toString().replace(/(sk-[A-Za-z0-9._-]{8,})/g, '<REDACTED_KEY>');
}

if (!key) {
  console.error('OPENROUTER_API_KEY is not set in environment or .env');
  process.exitCode = 2;
  process.exit();
}

(async () => {
  console.log('OpenRouter verification');
  console.log('Model:', model);
  console.log('Testing host: https://api.openrouter.ai/v1/chat/completions');

  const url = 'https://api.openrouter.ai/v1/chat/completions';
  const body = {
    model,
    messages: [{ role: 'user', content: 'ping' }],
    max_tokens: 1
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify(body),
      // short timeout hint (undici/node fetch uses signal for timeout normally)
    });

    console.log('HTTP status:', res.status);
    const ct = res.headers.get('content-type') || '';
    console.log('Content-Type:', ct);
    const text = await res.text().catch(() => '');
    const head = text.slice(0, 800).replace(/\n+/g, ' ');
    console.log('Response head (redacted):', redact(head));

    if (!ct.includes('application/json')) {
      console.error('Non-JSON response received. If you see HTML, you may be hitting the website host instead of the API host.');
      process.exitCode = 3;
      return;
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse JSON:', e.message);
      process.exitCode = 4;
      return;
    }

    console.log('Parsed JSON keys:', Object.keys(json));
    if (json.error) {
      console.error('API returned error:', redact(JSON.stringify(json.error).slice(0, 400)));
      process.exitCode = 5;
      return;
    }

    // Try to extract a content preview if available
    const choice = json?.choices?.[0];
    if (choice) {
      const content = (choice.message?.content || choice.text || '').toString().slice(0, 400);
      console.log('Choice preview (redacted):', redact(content));
      console.log('Verification: SUCCESS — API reachable and returned a completion.');
      process.exitCode = 0;
      return;
    }

    console.log('Verification: Received JSON but no choices found.');
  } catch (err) {
    // Distinguish DNS/network errors from auth errors
    console.error('Network/Fetch error:', err.message || err);
    if (err?.cause?.code === 'ENOTFOUND' || /ENOTFOUND/.test(String(err))) {
      console.error('DNS lookup failed for api.openrouter.ai — your Codespace may not allow outbound DNS or network to that host.');
    }
    process.exitCode = 6;
  }
})();
