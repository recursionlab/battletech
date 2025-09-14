/**
 * XiKernel Substrate Tests
 * Tests the actual kernel functionality, not just the chat veneer
 */

import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import { XiKernel } from "../kernel/kernel";
import { KernelAuthority } from "../kernel/authority";
import { Evaluator } from "../loops/evaluate";

describe("XiKernel Invariants I1-I4", () => {

  test("I1: Write-through only - kernel authority required", () => {
    const authority = new KernelAuthority();
    const kernel = new XiKernel(authority);

    // Valid write through kernel
    const symbol = kernel.createSymbol({
      id: "test_symbol_1",
      typ: "Note",
      payload: "test content",
      meta: {}
    });

    assert.equal(symbol.meta.kernelWritten, true);
    assert.ok(symbol.meta.created);

    // Invalid direct graph mutation should be impossible due to private fields
    // The authority token system prevents external mutation
    const snapshot = kernel.exportSnapshot();
    assert.equal(snapshot.nodes.length, 1);
  });

  test("I2: Provenance tracking - all symbols have metadata", () => {
    const authority = new KernelAuthority();
    const kernel = new XiKernel(authority);

    const symbol = kernel.createSymbol({
      id: "provenance_test",
      typ: "TestSymbol",
      payload: "test data",
      meta: { custom: "value" }
    });

    assert.equal(symbol.meta.kernelWritten, true);
    assert.ok(symbol.meta.created);
    assert.equal(symbol.meta.custom, "value");

    const timestamp = new Date(symbol.meta.created!);
    assert.ok(timestamp.getTime() <= Date.now());
  });

  test("I3: Lineage closure - edges require warrants", () => {
    const authority = new KernelAuthority();
    const kernel = new XiKernel(authority);

    // Create two symbols
    kernel.createSymbol({
      id: "symbol_a",
      typ: "Note",
      payload: "first",
      meta: {}
    });

    kernel.createSymbol({
      id: "symbol_b",
      typ: "Note",
      payload: "second",
      meta: {}
    });

    // Edge with proper warrant should succeed
    const edge = kernel.createEdge({
      src: "symbol_a",
      dst: "symbol_b",
      rel: "relates_to",
      weight: 1.0,
      warrant: {
        reason: "test_linkage",
        confidence: 0.9
      }
    });

    assert.ok(edge.warrant);
    assert.equal(edge.warrant.reason, "test_linkage");

    const snapshot = kernel.exportSnapshot();
    assert.equal(snapshot.edges.length, 1);
  });

  test("I4: Symbol-first discipline - operations reference symbol IDs", () => {
    const authority = new KernelAuthority();
    const kernel = new XiKernel(authority);

    const symbol = kernel.createSymbol({
      id: "embedding_test",
      typ: "Document",
      payload: "content for embedding",
      meta: {
        vectorEmbedding: false, // Will be synced later
        symbolFirst: true
      }
    });

    assert.equal(symbol.id, "embedding_test");
    assert.equal(symbol.meta.symbolFirst, true);

    // All operations should key off the symbol ID
    const retrieved = kernel.getSymbol("embedding_test");
    assert.equal(retrieved?.id, "embedding_test");
  });
});

describe("XiKernel Graph Statefulness", () => {

  test("Symbol creation and retrieval", () => {
    const authority = new KernelAuthority();
    const kernel = new XiKernel(authority);

    // Create symbol
    kernel.createSymbol({
      id: "state_test_1",
      typ: "StateTest",
      payload: "persistent data",
      meta: {}
    });

    // Verify in snapshot
    const snapshot1 = kernel.exportSnapshot();
    assert.equal(snapshot1.nodes.length, 1);
    assert.equal(snapshot1.nodes.find(n => n.id === "state_test_1")?.id, "state_test_1");

    // Create second symbol and link
    kernel.createSymbol({
      id: "state_test_2",
      typ: "StateTest",
      payload: "linked data",
      meta: {}
    });

    kernel.createEdge({
      src: "state_test_1",
      dst: "state_test_2",
      rel: "links_to",
      weight: 1.0,
      warrant: { reason: "state_test_linkage" }
    });

    // Verify final state
    const snapshot2 = kernel.exportSnapshot();
    assert.equal(snapshot2.nodes.length, 2);
    assert.equal(snapshot2.edges.length, 1);
    assert.deepEqual(snapshot2.metadata.invariantViolations, []);
  });
});

describe("XiKernel Deterministic Evaluation Loops", () => {

  test("Evaluator produces bounded steps with symbol chain", async () => {
    const authority = new KernelAuthority();
    const kernel = new XiKernel(authority);

    // Mock LLM port for deterministic testing
    const mockLLM = {
      run: async ({ prompt }: { prompt: string }) => {
        return {
          text: `Step response for: ${prompt.substring(0, 50)}...`,
          justification: {
            model: "mock-llm",
            promptHash: "test_hash",
            timestamp: new Date().toISOString(),
            tokensUsed: 100
          },
          confidence: 0.8
        };
      }
    };

    const evaluator = new Evaluator(kernel, mockLLM);

    const result = await evaluator.evaluate({
      id: "test_goal_1",
      spec: {
        task: "Test deterministic evaluation",
        description: "Verify step-by-step reasoning"
      },
      maxSteps: 3
    });

    // Verify evaluation result structure
    assert.equal(result.goalId, "test_goal_1");
    assert.ok(result.steps);
    assert.ok(result.steps.length <= 3);
    assert.ok(result.finalState);

    // Verify kernel contains step symbols
    const snapshot = kernel.exportSnapshot();
    assert.ok(snapshot.nodes.length > 0);

    // Look for step symbols in the graph
    const stepSymbols = snapshot.nodes.filter(
      symbol => symbol.id.includes("test_goal_1:step:")
    );
    assert.ok(stepSymbols.length > 0);
  });
});

describe("XiKernel Integration - Direct Kernel Operations", () => {

  test("Complex workflow: create, link, query, update", () => {
    const authority = new KernelAuthority();
    const kernel = new XiKernel(authority);

    // 1. Create initial knowledge
    kernel.createSymbol({
      id: "knowledge_base",
      typ: "KnowledgeBase",
      payload: "Initial knowledge repository",
      meta: { version: 1 }
    });

    // 2. Add related concept
    kernel.createSymbol({
      id: "concept_a",
      typ: "Concept",
      payload: "First concept in knowledge base",
      meta: { category: "fundamental" }
    });

    // 3. Link them
    kernel.createEdge({
      src: "knowledge_base",
      dst: "concept_a",
      rel: "contains",
      weight: 1.0,
      warrant: {
        reason: "concept_containment",
        confidence: 1.0
      }
    });

    // 4. Query state
    const snapshot = kernel.exportSnapshot();
    assert.equal(snapshot.nodes.length, 2);
    assert.equal(snapshot.edges.length, 1);
    assert.equal(snapshot.metadata.totalSymbols, 2);
    assert.equal(snapshot.metadata.totalEdges, 1);
    assert.deepEqual(snapshot.metadata.invariantViolations, []);

    // 5. Verify graph integrity
    const knowledgeBase = kernel.getSymbol("knowledge_base");
    const conceptA = kernel.getSymbol("concept_a");

    assert.equal(knowledgeBase?.meta.version, 1);
    assert.equal(conceptA?.meta.category, "fundamental");

    // 6. Get edges for knowledge base
    const edges = kernel.getEdges("knowledge_base");
    assert.equal(edges.length, 1);
    assert.equal(edges[0].rel, "contains");
  });
});