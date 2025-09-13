#!/usr/bin/env node
if (!process.env.OPENROUTER_API_KEY) {
  console.error('ERROR: OPENROUTER_API_KEY is not set. Set it in the environment or in .env');
  process.exit(1);
}
console.log('OPENROUTER_API_KEY found');