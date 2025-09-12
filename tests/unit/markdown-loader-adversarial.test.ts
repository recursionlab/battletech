/**
 * Adversarial Tests for Markdown Loader
 * 
 * Designed to break the markdown loader with edge cases, malformed data,
 * race conditions, and security vulnerabilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { MarkdownLoader } from '../../src/utils/markdown-loader';
import { KnowledgeService } from '../../src/services/knowledge-service';
import { ΞKernel } from '../../src/core/xi-kernel';

describe('MarkdownLoader Adversarial Tests', () => {
  let tempDir: string;
  let loader: MarkdownLoader;

  beforeEach(async () => {
    tempDir = path.join(__dirname, 'adversarial-test-data');
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

  describe('Malformed Frontmatter Attacks', () => {
    it('should handle malformed YAML frontmatter', async () => {
      const testFile = path.join(tempDir, 'malformed.md');
      const malformedContent = `---
title: "Test Document"
tags: [unclosed array
category: missing quotes
invalid: yaml: structure: here
---

# Content after malformed YAML`;

      await fs.writeFile(testFile, malformedContent);
      
      // Should not crash, but handle gracefully
      await expect(loader.loadFile(testFile)).rejects.toThrow();
    });

    it('should handle infinite recursion in YAML references', async () => {
      const testFile = path.join(tempDir, 'recursive.md');
      const recursiveContent = `---
a: &anchor
  b: *anchor
---

# This should not crash the parser`;

      await fs.writeFile(testFile, recursiveContent);
      
      const doc = await loader.loadFile(testFile);
      // Should handle circular references without infinite loops
      expect(doc.metadata.a).toBeDefined();
    });

    it('should handle extremely large YAML frontmatter', async () => {
      const testFile = path.join(tempDir, 'large-yaml.md');
      const largeArray = Array(10000).fill('item').map((_, i) => `item${i}`);
      const largeContent = `---
title: "Large YAML Test"
largeArray: [${largeArray.map(item => `"${item}"`).join(', ')}]
---

# Content after large YAML`;

      await fs.writeFile(testFile, largeContent);
      
      const doc = await loader.loadFile(testFile);
      expect(doc.metadata.largeArray).toHaveLength(10000);
    });
  });

  describe('Path Traversal and Security', () => {
    it('should reject path traversal attempts', async () => {
      const maliciousPath = '../../../etc/passwd';
      
      await expect(loader.loadFile(maliciousPath)).rejects.toThrow();
    });

    it('should handle symlink attacks', async () => {
      // Create a file outside the temp directory
      const externalFile = path.join(__dirname, '../../package.json');
      const symlinkPath = path.join(tempDir, 'malicious-symlink.md');
      
      try {
        await fs.symlink(externalFile, symlinkPath);
        
        // Should either reject or resolve the symlink safely
        const doc = await loader.loadFile(symlinkPath);
        
        // If it loads, it should not contain sensitive information
        expect(doc.content).not.toContain('devDependencies');
      } catch (error) {
        // Acceptable to reject symlinks entirely
        expect(error).toBeDefined();
      }
    });

    it('should handle files with null bytes', async () => {
      const testFile = path.join(tempDir, 'null-bytes.md');
      const contentWithNulls = `---
title: "Null Test"
---

# Content\x00with\x00null\x00bytes`;

      await fs.writeFile(testFile, contentWithNulls);
      
      const doc = await loader.loadFile(testFile);
      // Should handle null bytes gracefully
      expect(doc.content).toContain('Content');
    });
  });

  describe('Memory and Performance Attacks', () => {
    it('should handle extremely large markdown files', async () => {
      const testFile = path.join(tempDir, 'huge.md');
      const hugeContent = `---
title: "Huge File Test"
---

${'# '.repeat(100000)}Very large content that might exhaust memory`;

      await fs.writeFile(testFile, hugeContent);
      
      const doc = await loader.loadFile(testFile);
      expect(doc.title).toBe('Huge File Test');
    });

    it('should handle deeply nested directory structures', async () => {
      // Create deeply nested directory (100 levels)
      let currentPath = tempDir;
      for (let i = 0; i < 100; i++) {
        currentPath = path.join(currentPath, `level${i}`);
        await fs.mkdir(currentPath, { recursive: true });
      }
      
      const deepFile = path.join(currentPath, 'deep.md');
      await fs.writeFile(deepFile, `---
title: "Deep File"
---

# Content at depth 100`);

      // Should handle deep paths without stack overflow
      const docs = await loader.loadDirectory('.');
      expect(docs.some(doc => doc.title === 'Deep File')).toBe(true);
    });

    it('should handle files with extremely long lines', async () => {
      const testFile = path.join(tempDir, 'long-lines.md');
      const longLine = 'x'.repeat(1000000); // 1MB line
      const content = `---
title: "Long Lines Test"
---

# Normal heading
${longLine}
# Another heading`;

      await fs.writeFile(testFile, content);
      
      const doc = await loader.loadFile(testFile);
      expect(doc.content).toContain(longLine);
    });
  });

  describe('Character Encoding Attacks', () => {
    it('should handle various character encodings', async () => {
      const testFile = path.join(tempDir, 'encoding.md');
      const unicodeContent = `---
title: "Unicode Test 🚀"
tags: ["测试", "テスト", "тест"]
---

# Unicode Content
Emoji: 🎯💻🔥
Chinese: 你好世界
Japanese: こんにちは
Russian: Привет мир
Arabic: مرحبا بالعالم
Right-to-left: ‏مرحبا‎`;

      await fs.writeFile(testFile, unicodeContent);
      
      const doc = await loader.loadFile(testFile);
      expect(doc.title).toBe('Unicode Test 🚀');
      expect(doc.tags).toContain('测试');
    });

    it('should handle control characters and invisible characters', async () => {
      const testFile = path.join(tempDir, 'control-chars.md');
      const controlContent = `---
title: "Control\tChars\nTest"
---

# Content with \r\n different \v line \f endings
Invisible chars: \u200B\u200C\u200D\uFEFF`;

      await fs.writeFile(testFile, controlContent);
      
      const doc = await loader.loadFile(testFile);
      expect(doc.title).toContain('Control');
    });
  });

  describe('Race Conditions and Concurrent Access', () => {
    it('should handle concurrent file loading', async () => {
      // Create multiple test files
      const files = [];
      for (let i = 0; i < 10; i++) {
        const testFile = path.join(tempDir, `concurrent${i}.md`);
        await fs.writeFile(testFile, `---
title: "Concurrent Test ${i}"
---
# Content ${i}`);
        files.push(testFile);
      }

      // Load all files concurrently
      const loadPromises = files.map(file => loader.loadFile(file));
      const docs = await Promise.all(loadPromises);
      
      expect(docs).toHaveLength(10);
      docs.forEach((doc, i) => {
        expect(doc.title).toBe(`Concurrent Test ${i}`);
      });
    });

    it('should handle file modifications during loading', async () => {
      const testFile = path.join(tempDir, 'modified-during-load.md');
      await fs.writeFile(testFile, `---
title: "Original"
---
# Original content`);

      // Start loading and modify file during load
      const loadPromise = loader.loadFile(testFile);
      
      // Immediately modify the file
      setTimeout(async () => {
        try {
          await fs.writeFile(testFile, `---
title: "Modified"
---
# Modified content`);
        } catch (error) {
          // File might be locked on some systems
        }
      }, 10);

      const doc = await loadPromise;
      // Should get either original or modified version, but not corrupted
      expect(['Original', 'Modified']).toContain(doc.title);
    });
  });

  describe('Integration Breaking Attacks', () => {
    it('should handle malicious frontmatter that breaks kernel integration', async () => {
      const kernel = new ΞKernel();
      const knowledgeService = new KnowledgeService(kernel, tempDir);
      
      const testFile = path.join(tempDir, 'training', 'malicious.md');
      await fs.mkdir(path.dirname(testFile), { recursive: true });
      
      // Frontmatter with properties that might break symbol creation
      await fs.writeFile(testFile, `---
title: null
tags: null
category: null
id: "../../../malicious"
payload: { "__proto__": { "polluted": true } }
---

# Malicious content`);

      // Should handle malicious metadata gracefully
      const stats = await knowledgeService.ingestAll();
      expect(stats.totalDocuments).toBeGreaterThanOrEqual(0);
    });

    it('should handle circular references in document linking', async () => {
      const kernel = new ΞKernel();
      const knowledgeService = new KnowledgeService(kernel, tempDir);
      
      const trainingDir = path.join(tempDir, 'training');
      await fs.mkdir(trainingDir, { recursive: true });
      
      // Create documents that might cause circular linking
      await fs.writeFile(path.join(trainingDir, 'doc1.md'), `---
title: "Doc 1"
tags: ["circular", "ref1", "ref2"]
---
# Document 1 references Document 2`);

      await fs.writeFile(path.join(trainingDir, 'doc2.md'), `---
title: "Doc 2"  
tags: ["circular", "ref2", "ref1"]
---
# Document 2 references Document 1`);

      // Should handle circular references without infinite loops
      const stats = await knowledgeService.ingestAll({ linkRelated: true });
      expect(stats.totalDocuments).toBe(2);
    });
  });

  describe('Search and Query Injection', () => {
    it('should handle regex injection in search queries', async () => {
      const trainingDir = path.join(tempDir, 'training');
      await fs.mkdir(trainingDir, { recursive: true });
      
      await fs.writeFile(path.join(trainingDir, 'normal.md'), `---
title: "Normal Document"
---
# Normal content`);

      const docs = await loader.loadTrainingData();
      
      // Potentially malicious regex patterns
      const maliciousQueries = [
        '(.*)+',  // Catastrophic backtracking
        '(?:a+)+',  // Nested quantifiers
        '\\x00',  // Null byte
        '.*\\n.*\\n.*',  // Complex multiline
      ];

      for (const query of maliciousQueries) {
        // Should not hang or crash
        const results = loader.searchDocuments(query, docs);
        expect(Array.isArray(results)).toBe(true);
      }
    });
  });

  describe('File System Edge Cases', () => {
    it('should handle non-existent directories gracefully', async () => {
      const nonExistentLoader = new MarkdownLoader('/non/existent/path');
      
      const docs = await nonExistentLoader.loadAll();
      expect(docs).toEqual([]);
    });

    it('should handle permission denied errors', async () => {
      // Create a directory with restricted permissions (Unix-like systems)
      const restrictedDir = path.join(tempDir, 'restricted');
      await fs.mkdir(restrictedDir, { recursive: true });
      
      try {
        await fs.chmod(restrictedDir, 0o000);  // No permissions
        
        const restrictedLoader = new MarkdownLoader(restrictedDir);
        const docs = await restrictedLoader.loadAll();
        
        // Should handle permission errors gracefully
        expect(Array.isArray(docs)).toBe(true);
      } catch (error) {
        // Some systems might not support chmod or throw differently
        expect(error).toBeDefined();
      } finally {
        // Restore permissions for cleanup
        try {
          await fs.chmod(restrictedDir, 0o755);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    });

    it('should handle files that disappear during processing', async () => {
      const testFile = path.join(tempDir, 'disappearing.md');
      await fs.writeFile(testFile, `---
title: "Disappearing File"
---
# This file will disappear`);

      // Start loading and delete file during processing
      const loadPromise = loader.loadFile(testFile);
      
      setTimeout(async () => {
        try {
          await fs.unlink(testFile);
        } catch (error) {
          // File might already be read
        }
      }, 5);

      // Should either succeed (file read before deletion) or fail gracefully
      try {
        const doc = await loadPromise;
        expect(doc.title).toBe('Disappearing File');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});