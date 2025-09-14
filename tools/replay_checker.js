#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

function normalizeTrace(obj){
  const copy = JSON.parse(JSON.stringify(obj));
  if(copy.traceId) copy.traceId = '___ID___';
  if(copy.meta && copy.meta.seedPrompt) copy.meta.seedPrompt = copy.meta.seedPrompt.replace(/\s+/g,' ').trim();
  if(Array.isArray(copy.steps)){
    copy.steps = copy.steps.slice().sort((a,b)=> (a.i||0) - (b.i||0)).map(s => {
      const ns = {...s};
      if(typeof ns.text === 'string') ns.text = ns.text.replace(/\s+/g,' ').trim();
      if(Array.isArray(ns.embedding)) ns.embedding = ns.embedding.map(x=> Number(Number(x).toFixed(6)));
      return ns;
    });
  }
  return copy;
}

function deepEqual(a,b){ return JSON.stringify(a) === JSON.stringify(b); }

function unifiedDiff(aStr, bStr){
  const aLines = aStr.split(/\r?\n/);
  const bLines = bStr.split(/\r?\n/);
  const out = [];
  const max = Math.max(aLines.length, bLines.length);
  for(let i=0;i<max;i++){
    const al = aLines[i] ?? '';
    const bl = bLines[i] ?? '';
    if(al === bl) out.push(' ' + al);
    else{
      if(al) out.push('-' + al);
      if(bl) out.push('+' + bl);
    }
  }
  return out.join('\n');
}

async function main(){
  const args = process.argv.slice(2);
  if(args.length < 2){ console.error('usage: node tools/replay_checker.js a.json b.json [--emit-canonical outA.json outB.json]'); process.exit(2); }
  const aPath = args[0], bPath = args[1];
  const emitIndex = args.indexOf('--emit-canonical');
  let emitA, emitB;
  if(emitIndex !== -1){ emitA = args[emitIndex+1]; emitB = args[emitIndex+2]; }
  if(!fs.existsSync(aPath) || !fs.existsSync(bPath)){ console.error('file not found'); process.exit(2); }
  try{
    const rawA = JSON.parse(fs.readFileSync(aPath, 'utf8'));
    const rawB = JSON.parse(fs.readFileSync(bPath, 'utf8'));
    const A = normalizeTrace(rawA);
    const B = normalizeTrace(rawB);
    if(emitA && emitB){
      fs.writeFileSync(emitA, JSON.stringify(A, null, 2));
      fs.writeFileSync(emitB, JSON.stringify(B, null, 2));
      console.log('Wrote canonical outputs:', emitA, emitB);
    }
    if(deepEqual(A,B)){
      console.log('IDENTICAL');
      process.exit(0);
    }
    console.log('DIFFER — producing per-step diffs (first 10 mismatches)');
    const maxSteps = Math.max(A.steps?.length||0, B.steps?.length||0);
    let shown = 0;
    for(let i=0;i<maxSteps && shown < 10;i++){
      const as = A.steps?.[i] ?? null;
      const bs = B.steps?.[i] ?? null;
      if(JSON.stringify(as) !== JSON.stringify(bs)){
        shown++;
        console.log('--- STEP', i, '---');
        const aStr = JSON.stringify(as, null, 2) || '';
        const bStr = JSON.stringify(bs, null, 2) || '';
        console.log(unifiedDiff(aStr, bStr));
      }
    }
    process.exit(1);
  }catch(e){ console.error('error', e && e.stack ? e.stack : e); process.exit(2); }
}

main();
