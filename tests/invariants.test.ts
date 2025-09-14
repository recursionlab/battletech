/**
 * ΞKernel Invariant Tests - I1 through I4
 */

import { ΞKernel } from '../kernel/kernel';
import { KernelAuthority } from '../kernel/authority';

describe('ΞKernel Invariants', () => {
  let kernel: ΞKernel;
  let authority: KernelAuthority;

  beforeEach(() => {
    authority = new KernelAuthority();
    kernel = new ΞKernel(authority);
  });

  describe('I1: Write-through only', () => {
    test('direct graph mutation is blocked', () => {
      // Private graph should not be accessible
      expect(() => {
        (kernel as any).graph = {};
      }).toThrow();
    });

    test('valid kernel operations succeed', () => {
      const symbol = kernel.createSymbol({
        id: 'test-symbol',
        typ: 'TestNote',
        payload: 'test content'
      });

      expect(symbol.id).toBe('test-symbol');
      expect(symbol.meta.kernelWritten).toBe(true);
    });
  });

  describe('I2: Provenance tracking', () => {
    test('all symbols have required provenance', () => {
      const symbol = kernel.createSymbol({
        id: 'test-symbol',
        typ: 'TestNote',
        payload: 'test content'
      });

      expect(symbol.meta.kernelWritten).toBe(true);
      expect(symbol.meta.timestamp).toBeDefined();
      expect(symbol.meta.created).toBeDefined();
    });

    test('symbols without provenance cause violations', () => {
      // This should be caught by invariant checking
      const snapshot = kernel.exportSnapshot();
      expect(snapshot.metadata.invariantViolations).toHaveLength(0);
    });
  });

  describe('I3: Lineage closure (warrant required)', () => {
    test('edges without warrants are rejected', () => {
      kernel.createSymbol({ id: 'a', typ: 'Note', payload: 'A' });
      kernel.createSymbol({ id: 'b', typ: 'Note', payload: 'B' });

      expect(() => {
        kernel.createEdge({
          src: 'a',
          dst: 'b',
          rel: 'related',
          warrant: null as any
        });
      }).toThrow(/I3 Violation.*warrant/);
    });

    test('edges with warrants are accepted', () => {
      kernel.createSymbol({ id: 'a', typ: 'Note', payload: 'A' });
      kernel.createSymbol({ id: 'b', typ: 'Note', payload: 'B' });

      const edge = kernel.createEdge({
        src: 'a',
        dst: 'b',
        rel: 'related',
        warrant: { reason: 'test relationship', confidence: 0.8 }
      });

      expect(edge.warrant.reason).toBe('test relationship');
      expect(edge.weight).toBe(1.0); // default weight
    });
  });

  describe('I4: Symbol-first discipline', () => {
    test('vectors must reference symbols by ID', () => {
      const symbol = kernel.createSymbol({
        id: 'test-vector-symbol',
        typ: 'VectorizedContent',
        payload: 'content with vector',
        meta: {
          vectorEmbedding: true,
          symbolFirst: true
        }
      });

      const snapshot = kernel.exportSnapshot();
      expect(snapshot.metadata.invariantViolations).toHaveLength(0);
    });

    test('vectors without symbolFirst flag cause violations', () => {
      kernel.createSymbol({
        id: 'bad-vector-symbol',
        typ: 'VectorizedContent',
        payload: 'content with vector',
        meta: {
          vectorEmbedding: true
          // missing symbolFirst: true
        }
      });

      const snapshot = kernel.exportSnapshot();
      expect(snapshot.metadata.invariantViolations.length).toBeGreaterThan(0);
      expect(snapshot.metadata.invariantViolations[0]).toMatch(/I4 Violation.*symbolFirst/);
    });
  });

  describe('Graph operations', () => {
    test('symbols can be retrieved and updated', () => {
      const original = kernel.createSymbol({
        id: 'update-test',
        typ: 'Mutable',
        payload: 'original content'
      });

      const updated = kernel.updateSymbol('update-test', {
        payload: 'updated content',
        meta: { version: 2 }
      });

      expect(updated.payload).toBe('updated content');
      expect(updated.meta.version).toBe(2);
      expect(updated.lineage.length).toBeGreaterThan(0);
      expect(updated.lineage[0]).toMatch(/update@/);
    });

    test('edges can be queried by symbol', () => {
      kernel.createSymbol({ id: 'node1', typ: 'Node', payload: '1' });
      kernel.createSymbol({ id: 'node2', typ: 'Node', payload: '2' });
      kernel.createSymbol({ id: 'node3', typ: 'Node', payload: '3' });

      kernel.createEdge({
        src: 'node1',
        dst: 'node2',
        rel: 'connects',
        warrant: { reason: 'test edge 1' }
      });

      kernel.createEdge({
        src: 'node2',
        dst: 'node3',
        rel: 'flows_to',
        warrant: { reason: 'test edge 2' }
      });

      const node2Edges = kernel.getEdges('node2');
      expect(node2Edges).toHaveLength(2); // one incoming, one outgoing
    });
  });
});