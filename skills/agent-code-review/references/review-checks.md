# Inspection criteria

Use these checks while tracing the affected behavior. A signal earns a finding only after its consequence is established against the contract.

| Area | Inspect | Evidence that resolves the concern |
| --- | --- | --- |
| Requirement fidelity | Missing conditions, changed defaults, scope expansion, and partial fixes advertised as complete. | Map the original requirement to an observable result. Preserve the distinction between a new regression and a requested fix that still fails. |
| Integration | Route/command registration, callers, dependency injection, feature flags, schema/migrations, and actual persistence. | Trace a real entry point through the changed path. A callable helper or direct unit test alone does not establish integration. |
| API and dependency validity | Imports, method names, signatures, sync/async behavior, return shapes, manifest/lockfile changes. | Verify the actual installed or locked version and its definitions. A mock that invents an API is not evidence the production API exists. Missing local information means unresolved, not hallucinated. |
| Test integrity | Removed assertions, relaxed expected values, hardcoded fixture answers, broad mocks, skips, exclusions, disabled checks, and early successful exits. | Determine which incorrect production behavior the check would reject. Confirm changes follow an authorized requirement, rather than merely making the suite green. |
| Error and state handling | Swallowed exceptions, default-success returns, silent fallback, partial writes, retries, and concurrent operations. | Trace failure outcomes and side effects. Check transactionality/idempotency when relevant. Narrow, specified fallbacks are legitimate; identify a violated result before flagging them. |
| Repository fit | Existing domain helpers, duplicated rules, unnecessary frameworks, compatibility shims, and extraction that only relocates branches. | Compare responsibilities and semantics. Recommend reuse when the shared policy actually applies; retain separate code where domains or contracts differ. |

## Common evidence traps

- **Green report:** verify which checks ran and what their assertions establish. Keep author claims labeled until independently checked.
- **Changed test:** compare with the new contract before classifying the change as weakened validation.
- **High coverage or low complexity:** inspect the behavior and assertions; neither number proves requirements are met.
- **Convincing summary or comment:** confirm it against callers, dependencies, and effects. Documented intent cannot override executable behavior.
- **Multiple reviewers agree:** seek independent evidence, deduplicate repeated claims, and preserve uncertainty. Consensus alone is not proof.
