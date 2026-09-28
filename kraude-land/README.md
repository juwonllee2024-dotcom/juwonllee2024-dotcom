# KRAUDE LAND Runtime

KRAUDE LAND is an evidence-gated, local-first agent world runtime. The 3D world and Master UI are projections of authoritative SQLite state; they are not the source of truth.

This implementation follows the uploaded KRAUDE LAND master package in phase order. It intentionally keeps `REAL` and `DEMO` separate, requires evidence before CLEAR, keeps Agent identity independent from cognition providers, uses isolated Git worktrees for repository missions, and keeps Mother outside the worker/star/synthesis lifecycle.

## Requirements

- Node.js 22.5+ (uses built-in `node:sqlite`)
- Git
- No runtime npm dependencies

## Run

```bash
npm test
node scripts/dev.mjs
# http://127.0.0.1:3300
```

## Verified behavior

- Durable SQLite world state and append-only event/evidence ledgers.
- REAL/DEMO namespace separation and REAL mock-provider rejection.
- Real repository observation, mission contracts, isolated worktrees, deterministic assignment and evidence-gated CLEAR.
- Durable queue, leases, idempotency and crash recovery independent from the browser UI.
- Deterministic 1–5 member parties and independent reviewer rejection/approval.
- Persistent Agent memory/self-model with provider A → B swapping across restart.
- Evidence-driven growth, promotions and synthesis with non-worker failure attribution protection.
- Truth-driven fortress projection with nine facilities, organic demand expansion and Master/Walk/Building cameras.
- Durable Master authority controls and ledger-derived reports.
- Separate TEST_GENESIS Mother store/interface and worker-boundary enforcement.
- Project Atlas graph preserving project identity separately from repository identity.
- Safety policy for destructive/publish/credential operations.
- SQLite backup/restore rehearsal preserving immutability guards.
- Wall-clock pilot gates that cannot pass before their required real duration.

## Acceptance scripts

```bash
# Phase 1: create a REAL manual-provider bridge request.
node scripts/phase1_prepare.mjs ./evidence/phase1-real
# An external coding agent must read the request and modify only the mission worktree.
node scripts/phase1_verify.mjs ./evidence/phase1-real

# Phase 2 crash/restart/idempotency acceptance.
node scripts/phase2_acceptance.mjs ./evidence/phase2-runtime

# Phase 4 provider swap bridge acceptance.
node scripts/phase4_prepare_a.mjs ./evidence/phase4-swap
node scripts/phase4_finalize_a_prepare_b.mjs ./evidence/phase4-swap
node scripts/phase4_verify_b.mjs ./evidence/phase4-swap
```

## Current strict status

Implementation and automated gates through Phase 9 are present. The production pilot/rollout phases are deliberately **not** marked complete: the master contract requires real 24-hour and 72-hour pilots and then a real 7-day/10-repository rollout. The code contains gates that reject early or simulated completion.

See [`docs/implementation-status.md`](docs/implementation-status.md) for exact evidence and remaining gates.
