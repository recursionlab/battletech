/**
 * /evaluate Endpoint Tests - HTTP Interface to Evaluation Loops
 * Tests substrate conformance of evaluation endpoint
 */

import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';

describe("/evaluate Endpoint Substrate Conformance", () => {

  test("POST /evaluate returns steps + snapshot structure", async () => {
    const response = await fetch('http://localhost:8005/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goalId: "test_goal_endpoint",
        spec: {
          task: "Test endpoint evaluation",
          description: "Verify HTTP endpoint returns proper structure"
        },
        maxSteps: 2
      })
    });

    assert.equal(response.status, 200);

    const result = await response.json();
    assert.equal(result.success, true);
    assert.ok(result.data);
    assert.equal(result.data.goalId, "test_goal_endpoint");
    assert.ok(result.data.steps);
    assert.ok(Array.isArray(result.data.steps));
    assert.ok(result.data.steps.length <= 2);
    assert.ok(result.data.finalSnapshot);
  });

  test("POST /evaluate creates symbols with I1-I4 compliance", async () => {
    const response = await fetch('http://localhost:8005/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goalId: "test_invariants_endpoint",
        spec: { task: "Invariant compliance test" },
        maxSteps: 1
      })
    });

    const result = await response.json();

    // Verify snapshot contains properly formed symbols
    const snapshot = result.data.finalSnapshot;
    assert.ok(snapshot.nodes);
    assert.ok(snapshot.edges);
    assert.ok(snapshot.metadata);

    // I1: Only kernel mutations (implicit - no direct access to verify)
    // I2: Provenance tracking
    const goalSymbols = snapshot.nodes.filter((n: any) =>
      n.id.includes("test_invariants_endpoint"));
    assert.ok(goalSymbols.length > 0);

    for (const symbol of goalSymbols) {
      assert.equal(symbol.meta.kernelWritten, true); // I2
      assert.ok(symbol.meta.created); // I2
    }

    // I3: Edges have warrants (if any exist)
    for (const edge of snapshot.edges) {
      assert.ok(edge.warrant); // I3
      assert.ok(edge.warrant.reason); // I3
    }

    // I4: No orphan embeddings (implicit - vectors reference symbolIds)
    assert.deepEqual(snapshot.metadata.invariantViolations, []);
  });

  test("POST /evaluate with missing required fields returns 400", async () => {
    const response = await fetch('http://localhost:8005/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing goalId and spec
        maxSteps: 1
      })
    });

    assert.equal(response.status, 400);

    const result = await response.json();
    assert.equal(result.success, false);
    assert.equal(result.error, 'missing_required_fields');
    assert.deepEqual(result.required, ['goalId', 'spec']);
  });

  test("POST /evaluate maintains kernel state isolation", async () => {
    // Get initial kernel state
    const healthResponse = await fetch('http://localhost:8005/api/health');
    const initialHealth = await healthResponse.json();
    const initialSymbolCount = initialHealth.kernel.totalSymbols;

    // Run evaluation
    await fetch('http://localhost:8005/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goalId: "test_isolation",
        spec: { task: "State isolation test" },
        maxSteps: 1
      })
    });

    // Verify kernel state changed (symbols added)
    const finalHealthResponse = await fetch('http://localhost:8005/api/health');
    const finalHealth = await finalHealthResponse.json();
    const finalSymbolCount = finalHealth.kernel.totalSymbols;

    assert.ok(finalSymbolCount > initialSymbolCount);
    assert.equal(finalHealth.kernel.invariantViolations, 0);
  });
});