<!-- .github/copilot-instructions.md for recursionlab/battletech -->

# Quick agent instructions — battletech (project-119)

This file gives focused, actionable guidance to AI coding agents working in this repository. Keep responses concise, reference concrete files, and follow the project's patterns.

1. Big picture (what to edit and why)
   - The runtime lives under `src/`. `src/index.ts` is the program entry and `src/server.ts` starts the web server.
   - Core symbolic/agent logic is in `src/core/` (for example `xi-llm-agent.ts` and `llm-providers/*`). Changes that affect LLM behavior should update these files and corresponding provider adapters.
   - `models/`, `utils/`, and `test/` contain supplementary code and small test runners — prefer to change core behavior in `src/core` and add tests under `tests/unit` or `test/`.

2. Build / run / test (explicit commands)
   - Dev (TSX watch): `npm run dev` (general), `npm run dev:web` (web server). Use `npm run dev:web:openrouter` to fail fast if `OPENROUTER_API_KEY` is missing.
   - Build: `npm run build` (runs `tsc` -> emits `dist/`). After build web start: `npm run start:web`.
   - Tests: `npm test` (runs `vitest`). Quick smoke: `npm run test:smoke` executes `test/smoke/smoke.sh`.
   - Typecheck: `npm run type-check`. Lint & format: `npm run lint` / `npm run format`.

3. Environment / secrets
   - Optional OpenRouter/OpenAI/Anthropic keys are read from `.env` (see `.env.example`). Do NOT commit secrets.
   - Use `npm run dev:web:openrouter` or `node bin/verify-openrouter.js` to validate keys and connectivity.

4. Project conventions and patterns
   - Type aliases & path aliases: TypeScript `paths` are configured in `tsconfig.json` and mirrored by `vitest.config.ts` aliases (`@core`, `@modules`, `@services`, `@utils`, `@types`). Use these imports rather than relative deep paths.
   - LLM providers implement a common interface (`LLMProvider`) in `src/core/xi-llm-agent.ts`. Add new providers by extending `LLMProvider` and adding factory helpers in `ΞLLMAgentFactory`.
   - Symbolic prompts: Providers expect structured system prompts that embed symbolic context. See `ΞPrompts.symbolicAwareness` and `OpenRouterProvider.buildSystemPrompt` for exact phrasing and available directives (e.g., `SPAWN: id: description`, `LINK: a -> b: relation`, `MEMORY: key: value`). If adding directives, update parser logic in `parseAndSpawnChildren`.
   - Cost & telemetry: providers return usage/cost estimates (`tokensUsed`, `cost`) — preserve these fields when modifying providers.

5. Tests and small runners
   - Unit tests live under `tests/unit/`. Use `vitest` config in `vitest.config.ts` (node environment, aliases). When writing tests, mock provider calls (use `MockLLMProvider`) to avoid network calls.
   - Small CLI runners and smoke tests exist under `test/` (see `test/field_test.py` mentioned in README and `test/smoke` scripts). Use `npm run test:smoke` for environment-level smoke checks.

6. Typical edit checklist for PRs
   - Update `src/` code only; add new files under `src/` or `test/` unless intentionally changing top-level scripts.
   - Add or update unit tests (happy path + one edge case). Use `MockLLMProvider` to avoid calling real APIs.
   - Run `npm run type-check`, `npm test`, `npm run lint` locally. Fix failures before opening PR.
   - If adding provider secrets or sample `.env` keys, modify `.env.example` (never `.env`). If adding public docs, update `README.md` or `USAGE-EXAMPLES.md`.

7. Debugging tips specific to this repo
   - To debug OpenRouter issues, run `node bin/verify-openrouter.js` — it prints HTTP status and redacted response head.
   - For local development without keys, the code falls back to `mock` behavior in many places; run `npm run dev` to exercise the mock flows.
   - To inspect an agent's last response and spawned symbols: `ΞLLMAgent.getLastResponse()` and `toSymbolic()` on the agent instance (see `xi-llm-agent.ts`).

8. Examples (copyable snippets)
   - Creating a mock agent in code:

     const agent = ΞLLMAgentFactory.createMockAgent('test_1', 'summarize dataset');

   - Provider system prompt directive example (OpenRouter):

     // Use in provider system prompt: 
     "Use \"SPAWN: symbol_id: description\" to create child nodes. Use \"MEMORY: key: value\" to persist context."

9. What not to change
   - Do not commit `.env` or API keys.
   - Avoid changing large content in `GAME_CHANGERS/` — those are research artifacts and not required for typical code changes.

10. If you need more context
    - Read `src/core/xi-llm-agent.ts`, `src/core/llm-providers/*`, and `package.json` scripts first.
    - For architecture rationale and agent design, `GAME_CHANGERS/` contains design documents and examples of prompt conventions.

Feedback
 - If any instruction here is unclear or you want more examples (tests, provider wiring, or expected JSON shapes), ask and I'll expand specific sections.
