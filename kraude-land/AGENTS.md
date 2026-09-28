# AGENTS.md — Binding Build Contract

This file is authoritative for any coding agent working in this repository.

## 1. Mission
Implement KRAUDE LAND exactly as specified in this package. Do not reinterpret the project into a generic dashboard, AI chat app, task manager, fake simulation, or fixed-Ollama agent demo.

## 2. Authority order
When sources conflict, use this order:
1. `AGENTS.md`
2. `MASTER/NON_NEGOTIABLES.md`
3. `MASTER/SOURCE_PRECEDENCE.md`
4. `MASTER/KRAUDE_MOTHER_BOUNDARY.md` for Mother identity/lineage
5. `AUTHORITATIVE/KRAUDE/` approved architecture/constitution
6. current KRAUDE LAND specs in `MASTER/`, `SPEC/`, `BUILD/`
7. `AUTHORITATIVE/PICK_ME_UP/` for reference facts only
8. user reference images for spatial/visual grounding
9. generated concept art for implementation guidance
10. legacy packages/historical prompts
11. engineering convenience

Never allow a lower source to silently override a higher one.

## 3. Phase order is mandatory
Follow `MACHINE/implementation_order.json`. A later phase may not begin until the previous phase gate passes. If a genuine design ambiguity blocks a phase, STOP with a precise conflict report instead of inventing a new philosophy.

## 4. No fake completion
The following do not count as real implementation:
- mock AI runs;
- `Math.random()` mission success, verification, growth, or promotion;
- timers presented as coding;
- hardcoded repo states presented as observation;
- animation that changes authoritative state;
- sample evidence presented as current evidence;
- a model name stored in a field with no actual provider call;
- localStorage-only background autonomy;
- a UI that says `WORKING` when no real process/run exists.

`Claim != Evidence` is a system invariant.

## 5. Agent identity must be provider-independent
`K-Agent != Ollama model != Codex != Claude != Gemini`.

A K-Agent owns persistent identity, memory, history, traits, skills, relationships, self-model, star rank and career. Cognition providers are replaceable engines used by the Agent. Endpoints and model names are configuration, never identity. Provider swap must preserve the Agent.

## 6. KRAUDE Mother boundary
Mother is never:
- a K-Agent worker;
- mission-queued by the assignment engine;
- assigned a ★ rank;
- synthesized;
- reduced to a prompt/persona around an external LLM;
- allowed to inherit foundation-model weights as neural identity.

Mother may inhabit/experience the 3D world through the bounded Mother interface specified in `SPEC/MOTHER_INTERFACE.md`.

## 7. Real repo safety
Default real work occurs only in isolated Git worktrees or equivalent reversible sandboxes. Do not modify a base repository directly. Every real mission records base HEAD, branch/worktree, allowed paths, diff, commands, exit codes, evidence and final state.

## 8. Authority
Safe local read/analyze/worktree/edit/test/local-commit can be policy-authorized. Push, merge, publish, release, external messages, credentials, payments, deletion, workflow activation, or other consequential actions require explicit authority according to policy.

## 9. TDD / verification
For every nontrivial feature:
- establish the failing/absent behavior;
- implement the minimum real path;
- run targeted tests;
- run relevant regression;
- capture evidence;
- update traceability.

Do not weaken a test or gate to make a phase pass.

## 10. Completion language
Never say `complete`, `production ready`, or `100%` unless the matching gate under `TESTS/` passes. Otherwise report the exact verified percentage and blocker.
