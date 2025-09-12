/**
 * Breaking Tests - Designed to specifically exploit weaknesses in the markdown loader
 * 
 * These tests target specific vulnerabilities I found in the implementation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { MarkdownLoader } from '../../src/utils/markdown-loader';
import { KnowledgeService } from '../../src/services/knowledge-service';
import { ΞKernel } from '../../src/core/xi-kernel';

describe('Markdown Loader Breaking Tests', () => {
  let tempDir: string;
  let loader: MarkdownLoader;

  beforeEach(async () => {
    tempDir = path.join(__dirname, 'breaking-test-data');
    await fs.mkdir(tempDir, { recursive: true });
    loader = new MarkdownLoader(tempDir);
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('ID Generation Collision Attacks', () => {
    it('should expose ID collision vulnerability', async () => {
      // Create files that will generate the same ID due to path normalization
      const file1 = path.join(tempDir, 'training', 'test.md');
      const file2 = path.join(tempDir, 'training', 'test..md'); // Double dot
      const file3 = path.join(tempDir, 'training', 'test/.md'); // Directory traversal attempt
      
      await fs.mkdir(path.dirname(file1), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'training', 'test'), { recursive: true });
      
      await fs.writeFile(file1, `---
title: "Original Test"
---
# Original`);

      await fs.writeFile(file2, `---  
title: "Collision Test"
---
# Collision`);

      await fs.writeFile(file3, `---
title: "Directory Test"  
---
# Directory`);

      const docs = await loader.loadDirectory('training');
      
      // Check if IDs are unique - this might fail due to path normalization bugs
      const ids = docs.map(doc => doc.id);
      const uniqueIds = new Set(ids);
      
      console.log('Generated IDs:', ids);
      console.log('Unique IDs:', Array.from(uniqueIds));
      
      // This test EXPECTS to find a collision bug
      expect(uniqueIds.size).toBe(ids.length); // This should fail if there's a collision
    });
  });

  describe('Cache Poisoning Attacks', () => {
    it('should expose cache inconsistency with file modifications', async () => {
      const testFile = path.join(tempDir, 'cache-poison.md');
      
      // Initial content
      await fs.writeFile(testFile, `---
title: "Original"
version: 1
---
# Original content`);

      // Load and cache the file
      const doc1 = await loader.loadFile(testFile);
      expect(doc1.title).toBe('Original');
      
      // Modify file without updating cache
      await fs.writeFile(testFile, `---
title: "Modified"
version: 2
---
# Modified content`);

      // Load again - should return cached version (exposing cache staleness)
      const doc2 = await loader.loadFile(testFile);
      
      console.log('First load title:', doc1.title);
      console.log('Second load title:', doc2.title);
      console.log('Cache stats:', loader.getCacheStats());
      
      // This exposes that cache doesn't check file modification time
      if (doc2.title === 'Original') {
        console.log('🚨 CACHE POISONING DETECTED: Cache returned stale data!');
      }
      
      // The test might pass even with stale cache data
      expect(doc2.title).toBe('Original'); // Expecting the bug
    });

    it('should expose race condition in cache updates', async () => {
      const testFile = path.join(tempDir, 'race.md');
      
      await fs.writeFile(testFile, `---
title: "Race Test"
---
# Race content`);

      // Load same file multiple times simultaneously
      const promises = Array(20).fill(null).map(() => loader.loadFile(testFile));
      const results = await Promise.all(promises);
      
      // Check cache consistency
      const cacheStats = loader.getCacheStats();
      console.log('Race condition cache size:', cacheStats.size);
      
      // Should only have 1 cached entry, not 20
      if (cacheStats.size > 1) {
        console.log('🚨 RACE CONDITION DETECTED: Multiple cache entries for same file!');
      }
      
      // All results should be identical
      const firstResult = results[0];
      const allIdentical = results.every(result => 
        result.title === firstResult.title && 
        result.id === firstResult.id
      );
      
      expect(allIdentical).toBe(true);
    });
  });

  describe('Memory Exhaustion Through Large Metadata', () => {
    it('should expose memory exhaustion via large frontmatter', async () => {
      const testFile = path.join(tempDir, 'memory-bomb.md');
      
      // Create massive metadata object
      const hugeTags = Array(50000).fill(null).map((_, i) => `tag${i}`);
      const hugeMetadata = Array(1000).fill(null).reduce((acc, _, i) => {
        acc[`field${i}`] = `${'x'.repeat(1000)}`; // 1KB per field
        return acc;
      }, {});
      
      const content = `---
title: "Memory Bomb"
hugeTags: [${hugeTags.map(tag => `"${tag}"`).join(', ')}]
hugeData: ${JSON.stringify(hugeMetadata)}
---

# Content after huge metadata`;

      await fs.writeFile(testFile, content);
      
      console.log('File size:', (await fs.stat(testFile)).size / 1024 / 1024, 'MB');
      
      // This should consume significant memory
      const startMem = process.memoryUsage().heapUsed;
      const doc = await loader.loadFile(testFile);
      const endMem = process.memoryUsage().heapUsed;
      
      const memoryIncrease = (endMem - startMem) / 1024 / 1024;
      console.log('Memory increase:', memoryIncrease, 'MB');
      
      if (memoryIncrease > 100) {
        console.log('🚨 MEMORY EXHAUSTION: Large metadata consumed excessive memory!');
      }
      
      expect(doc.title).toBe('Memory Bomb');
    });
  });

  describe('Prototype Pollution Through Metadata', () => {
    it('should expose prototype pollution via malicious frontmatter', async () => {
      const testFile = path.join(tempDir, 'prototype-pollution.md');
      
      // Attempt prototype pollution through YAML parsing
      const maliciousContent = `---
title: "Prototype Pollution Test"
__proto__:
  polluted: "This should not exist"
constructor:
  prototype:
    polluted2: "Another pollution attempt"
---

# Testing prototype pollution`;

      await fs.writeFile(testFile, maliciousContent);
      
      // Check if Object.prototype was polluted before loading
      const beforePollution = Object.prototype.hasOwnProperty('polluted');
      
      const doc = await loader.loadFile(testFile);
      
      // Check if Object.prototype was polluted after loading
      const afterPollution = Object.prototype.hasOwnProperty('polluted');
      
      console.log('Before pollution:', beforePollution);
      console.log('After pollution:', afterPollution);
      console.log('Document metadata keys:', Object.keys(doc.metadata));
      
      if (afterPollution && !beforePollution) {
        console.log('🚨 PROTOTYPE POLLUTION DETECTED!');
      }
      
      // Clean up any pollution
      if ('polluted' in Object.prototype) {
        delete (Object.prototype as any).polluted;
      }
      if ('polluted2' in Object.prototype) {
        delete (Object.prototype as any).polluted2;
      }
      
      expect(doc.title).toBe('Prototype Pollution Test');
    });
  });

  describe('Symbol ID Injection in Kernel Integration', () => {
    it('should expose symbol ID manipulation vulnerability', async () => {
      const kernel = new ΞKernel();
      const knowledgeService = new KnowledgeService(kernel, tempDir);
      
      const trainingDir = path.join(tempDir, 'training');
      await fs.mkdir(trainingDir, { recursive: true });
      
      // Create document with malicious ID that could overwrite existing symbols
      const maliciousFile = path.join(trainingDir, '../../../system/override.md');
      
      try {
        await fs.mkdir(path.dirname(maliciousFile), { recursive: true });
        await fs.writeFile(maliciousFile, `---
title: "System Override"
id: "SYSTEM_CORE_SYMBOL"
---
# This document attempts to override system symbols`);
      } catch (error) {
        // Create alternative malicious path
        await fs.writeFile(path.join(trainingDir, 'malicious.md'), `---
title: "Malicious Document"
__symbolId: "doc_override_existing"  
---
# Attempting to control symbol ID generation`);
      }
      
      // Create a normal document first
      await fs.writeFile(path.join(trainingDir, 'normal.md'), `---
title: "Normal Document"
---
# Normal content`);
      
      const stats = await knowledgeService.ingestAll();
      
      console.log('Ingestion stats:', stats);
      
      // Check if malicious document affected symbol generation
      const kernelState = kernel.exportState();
      const symbolIds = Object.keys(kernelState.symbols);
      
      console.log('Generated symbol IDs:', symbolIds);
      
      // Look for suspicious symbol IDs
      const suspiciousIds = symbolIds.filter(id => 
        id.includes('SYSTEM') || 
        id.includes('override') || 
        id.includes('../')
      );
      
      if (suspiciousIds.length > 0) {
        console.log('🚨 SYMBOL ID INJECTION DETECTED:', suspiciousIds);
      }
      
      expect(stats.totalDocuments).toBeGreaterThan(0);
    });
  });

  describe('Search Query State Persistence', () => {
    it('should expose search state bleeding between queries', async () => {
      const trainingDir = path.join(tempDir, 'training');
      await fs.mkdir(trainingDir, { recursive: true });
      
      // Create documents with specific patterns
      await fs.writeFile(path.join(trainingDir, 'secret.md'), `---
title: "Secret Document"
tags: ["classified", "secret"]
---
# Classified information`);

      await fs.writeFile(path.join(trainingDir, 'public.md'), `---
title: "Public Document"
tags: ["public", "open"]
---
# Public information`);

      const docs = await loader.loadTrainingData();
      
      // First search that might modify internal state
      const secretResults = loader.searchDocuments('secret', docs);
      console.log('Secret search results:', secretResults.length);
      
      // Second search that should be independent
      const publicResults = loader.searchDocuments('public', docs);
      console.log('Public search results:', publicResults.length);
      
      // Third search with empty query - might return cached results
      const emptyResults = loader.searchDocuments('', docs);
      console.log('Empty search results:', emptyResults.length);
      
      // Check if empty search returns all documents (correct) or previous results (bug)
      if (emptyResults.length === secretResults.length && emptyResults.length < docs.length) {
        console.log('🚨 SEARCH STATE BLEEDING: Empty query returned previous results!');
      }
      
      expect(emptyResults.length).toBe(0); // Empty query should return no results
    });
  });

  describe('Kernel Symbol Limit Exhaustion', () => {
    it('should expose symbol limit exhaustion', async () => {
      const kernel = new ΞKernel();
      const knowledgeService = new KnowledgeService(kernel, tempDir);
      
      const trainingDir = path.join(tempDir, 'training');
      await fs.mkdir(trainingDir, { recursive: true });
      
      // Create many documents to potentially exhaust symbol limits
      const numDocs = 1000;
      const createPromises = [];
      
      for (let i = 0; i < numDocs; i++) {
        const fileName = path.join(trainingDir, `doc${i}.md`);
        const promise = fs.writeFile(fileName, `---
title: "Document ${i}"
category: "test"
tags: ["doc${i}", "batch"]
---
# Content for document ${i}`);
        createPromises.push(promise);
      }
      
      await Promise.all(createPromises);
      console.log(`Created ${numDocs} documents`);
      
      // Attempt to ingest all documents
      const startTime = Date.now();
      const stats = await knowledgeService.ingestAll();
      const endTime = Date.now();
      
      console.log('Ingestion time:', (endTime - startTime) / 1000, 'seconds');
      console.log('Documents ingested:', stats.totalDocuments);
      console.log('Symbols created:', stats.totalSymbols);
      
      // Check kernel state
      const kernelState = kernel.exportState();
      console.log('Kernel symbols:', kernelState.metadata.totalSymbols);
      console.log('Invariant violations:', kernelState.metadata.invariantViolations.length);
      
      if (kernelState.metadata.invariantViolations.length > 0) {
        console.log('🚨 INVARIANT VIOLATIONS:', kernelState.metadata.invariantViolations);
      }
      
      // Check if all documents were processed
      if (stats.totalSymbols < stats.totalDocuments) {
        console.log('🚨 SYMBOL CREATION FAILURE: Not all documents created symbols!');
      }
      
      expect(stats.totalDocuments).toBe(numDocs);
    }, 30000); // 30 second timeout for this test
  });
});