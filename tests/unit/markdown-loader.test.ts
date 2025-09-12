/**
 * Tests for Markdown Loader functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { MarkdownLoader, createTrainingLoader, createKnowledgeLoader, quickLoadAll } from '../../src/utils/markdown-loader';

describe('MarkdownLoader', () => {
  let tempDir: string;
  let loader: MarkdownLoader;

  beforeEach(async () => {
    // Create temporary test directory
    tempDir = path.join(__dirname, 'temp-test-data');
    await fs.mkdir(tempDir, { recursive: true });
    await fs.mkdir(path.join(tempDir, 'training'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'knowledge'), { recursive: true });

    loader = new MarkdownLoader(tempDir);
  });

  afterEach(async () => {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('loadFile', () => {
    it('should load a markdown file with frontmatter', async () => {
      const testFile = path.join(tempDir, 'test.md');
      const content = `---
title: "Test Document"
tags: ["test", "example"]
category: "testing"
---

# Test Content

This is a test document.`;

      await fs.writeFile(testFile, content);
      
      const doc = await loader.loadFile(testFile);
      
      expect(doc.title).toBe('Test Document');
      expect(doc.content).toContain('# Test Content');
      expect(doc.tags).toEqual(['test', 'example']);
      expect(doc.category).toBe('testing');
      expect(doc.htmlContent).toContain('<h1>Test Content</h1>');
    });

    it('should handle files without frontmatter', async () => {
      const testFile = path.join(tempDir, 'simple.md');
      const content = `# Simple Document

Just markdown content.`;

      await fs.writeFile(testFile, content);
      
      const doc = await loader.loadFile(testFile);
      
      expect(doc.title).toBe('simple');
      expect(doc.content).toContain('# Simple Document');
      expect(doc.tags).toEqual([]);
    });
  });

  describe('loadDirectory', () => {
    it('should load all markdown files from training directory', async () => {
      // Create test files
      const file1 = path.join(tempDir, 'training', 'doc1.md');
      const file2 = path.join(tempDir, 'training', 'doc2.md');
      
      await fs.writeFile(file1, `---
title: "Training Doc 1"
---
# Content 1`);
      
      await fs.writeFile(file2, `---
title: "Training Doc 2"  
---
# Content 2`);

      const docs = await loader.loadTrainingData();
      
      expect(docs).toHaveLength(2);
      expect(docs.map(d => d.title)).toContain('Training Doc 1');
      expect(docs.map(d => d.title)).toContain('Training Doc 2');
    });

    it('should handle empty directories gracefully', async () => {
      const docs = await loader.loadKnowledgeBase();
      expect(docs).toEqual([]);
    });
  });

  describe('search functionality', () => {
    beforeEach(async () => {
      // Create searchable test data
      const file1 = path.join(tempDir, 'training', 'systems.md');
      const file2 = path.join(tempDir, 'knowledge', 'patterns.md');
      
      await fs.writeFile(file1, `---
title: "Systems Thinking"
tags: ["systems", "thinking"]
---
# Systems and Complex Interactions`);
      
      await fs.writeFile(file2, `---
title: "Design Patterns"
tags: ["patterns", "design"]
---
# Software Design Patterns`);
    });

    it('should search documents by content', async () => {
      const allDocs = await loader.loadAll();
      const results = loader.searchDocuments('systems', allDocs);
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Systems Thinking');
    });

    it('should search documents by tags', async () => {
      const allDocs = await loader.loadAll();
      const results = loader.getDocumentsByTag('patterns', allDocs);
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Design Patterns');
    });
  });

  describe('factory functions', () => {
    it('should create training loader with correct config', () => {
      const trainingLoader = createTrainingLoader();
      expect(trainingLoader).toBeInstanceOf(MarkdownLoader);
    });

    it('should create knowledge loader with correct config', () => {
      const knowledgeLoader = createKnowledgeLoader();
      expect(knowledgeLoader).toBeInstanceOf(MarkdownLoader);
    });
  });

  describe('caching', () => {
    it('should cache loaded documents', async () => {
      const testFile = path.join(tempDir, 'cached.md');
      await fs.writeFile(testFile, `---
title: "Cached Doc"
---
# Cached Content`);

      await loader.loadFile(testFile);
      const stats = loader.getCacheStats();
      
      expect(stats.size).toBe(1);
      expect(stats.documents).toContain('cached');
    });

    it('should clear cache when requested', async () => {
      const testFile = path.join(tempDir, 'cached.md');
      await fs.writeFile(testFile, '# Test');
      
      await loader.loadFile(testFile);
      loader.clearCache();
      const stats = loader.getCacheStats();
      
      expect(stats.size).toBe(0);
    });
  });
});