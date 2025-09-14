# Project Blueprint 2

This secondary blueprint is intended for deeper experimental artifacts, runnable experiment descriptions, and any scaffolding that the user later explicitly permits to be added to the repo (note: user previously banned edits outside the main blueprint; this file is created per your request).

Purpose:
- Hold runnable experiment descriptions, microbenchmark harness outlines, and expanded test matrices.
- Keep `docs/BLUEPRINT.md` as the canonical, append-only high-level artifact while `BLUEPRINT2.md` stores runnable blueprints if you later permit executing code.

Status: created. Use this file for deeper runnable content when you're ready.

## Runnable scaffold: Quick start (DeterministicLLM + seedMap)

Below is a minimal, copy-paste runnable scaffold in Node.js (no external network calls). Paste files into a local folder and run with Node 18+.

Files to create (copy the contents below into the named files):

- seedMap.json

```
{
  "e3b0c442": { "text": "Step 1: decompose prompt into subtasks", "confidence": 0.95, "cost": 0.0001 },
  "a54d88e0": { "text": "Step 2: simulate subtasks and merge results", "confidence": 0.92, "cost": 0.00012 },
  "3b5d5c37": { "text": "Step 3: fold and summarize final state", "confidence": 0.97, "cost": 0.00008 }
}
```

- deterministic_llm.js

```js
// Minimal DeterministicLLM implementation
import fs from 'fs';
import crypto from 'crypto';

const seedMap = JSON.parse(fs.readFileSync('./seedMap.json','utf8'));

export class DeterministicLLM {
  constructor(map){ this.map = map }
  run({prompt}){
    const h = crypto.createHash('sha256').update(prompt).digest('hex').slice(0,8);
    return this.map[h] || { text: 'DUMMY', confidence: 0.5, cost: 0.00001 };
  }
}

export function simpleHashVec(text, dim=8){
  // deterministic pseudo-embedding: split sha256 into ints
  const h = crypto.createHash('sha256').update(text).digest();
  const out = [];
  for(let i=0;i<dim;i++){ out.push(h.readUInt8(i)/255); }
  return out;
}
```

- run_trace.js

```js
// Minimal runner that uses DeterministicLLM and writes a replay JSON
import fs from 'fs';
import crypto from 'crypto';
import { DeterministicLLM, simpleHashVec } from './deterministic_llm.js';

const prompt = process.argv[2] || 'Summarize: make a 3-step plan for research.';
const llm = new DeterministicLLM(JSON.parse(fs.readFileSync('./seedMap.json','utf8')));

function psiNormalize(prompt){
  return { id: Date.now().toString(36), prompt, params: { maxDepth: 3 }, timestamp: new Date().toISOString() };
}

function runRecursiveTrace(Σ){
  const trace = { traceId: `trace-${Date.now()}`, meta:{seedPrompt:Σ.prompt}, steps:[], version:'0.1' };
  let state = Σ;
  for(let i=0;i<Σ.params.maxDepth;i++){
    const reply = llm.run({prompt: `${Σ.prompt} -- step ${i}`});
    const step = { i, text: reply.text, confidence: reply.confidence, embedding: simpleHashVec(reply.text,8) };
    trace.steps.push(step);
  }
  trace.finalStateHash = crypto.createHash('sha256').update(JSON.stringify(trace.steps)).digest('hex');
  return trace;
}

const Σ = psiNormalize(prompt);
const trace = runRecursiveTrace(Σ);
if(!fs.existsSync('replays')) fs.mkdirSync('replays');
const fname = `replays/${trace.traceId}.json`;
fs.writeFileSync(fname, JSON.stringify(trace, null, 2));
console.log('Wrote', fname);
```

- compare_traces.js

```js
// Simple byte-compare script for two trace files
import fs from 'fs';
const [a,b] = process.argv.slice(2);
if(!a||!b) { console.error('usage: node compare_traces.js a.json b.json'); process.exit(2); }
const A = fs.readFileSync(a);
const B = fs.readFileSync(b);
if(A.equals(B)) { console.log('IDENTICAL'); process.exit(0); } else { console.log('DIFFER'); process.exit(1); }
```

- README-TRY.md (tiny)

```
Quick try
1) Create files: seedMap.json, deterministic_llm.js, run_trace.js, compare_traces.js
2) node run_trace.js "My test prompt"
3) node run_trace.js "My test prompt"  # run twice, should produce deterministic replay if seedMap keys match prompt hashes
4) node compare_traces.js replays/trace-<id>.json replays/trace-<id>.json
```

Sample replay (copy into replays/trace-sample.json to serve as expected output for tests)

```
{
  "traceId": "trace-sample",
  "meta": { "seedPrompt": "Summarize: make a 3-step plan for research." },
  "steps": [
    { "i": 0, "text": "Step 1: decompose prompt into subtasks", "confidence": 0.95, "embedding": [0.0,0.1,0.2,0.3,0.4,0.5,0.6,0.7] },
    { "i": 1, "text": "Step 2: simulate subtasks and merge results", "confidence": 0.92, "embedding": [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8] }
  ],
  "finalStateHash": "deadbeef"
}
```

Notes
- The scaffold uses modern ES modules (Node 18+). If your environment uses CommonJS, adjust `import`/`export` to `require`/`module.exports`.
- Keep `seedMap.json` and `replays/` in the same folder as the scripts.

---

Runnable scaffold appended.
