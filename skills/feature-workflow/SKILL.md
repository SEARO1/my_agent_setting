---
name: feature-workflow
description: >
  The gated feature loop: design plus plan, a reviewer subagent that must return
  APPROVE before any code, then independent slices built by at most four
  implementer subagents, then the lead runs the gates itself. Use it whenever a
  change lands schema, routes, permissions or a workflow, and for any request
  like "build this feature", "design X", "write the plan", "review my plan",
  "split this into tasks", "multi-step change", or "is this feature done yet".
  Also use it when resuming such work, to decide what step it is on and whether
  the loop has actually closed.
---

# feature-workflow

Four steps, in order. A one-line fix skips all of it; anything that lands schema, routes,
permissions or a workflow runs the whole loop.

If the repository's own AGENTS.md (or CLAUDE.md) already states a feature workflow, that
file wins on the specifics — artifacts, gate, commands — and this skill supplies the
mechanics and the reasons behind them. Do not run two loops.

1. Design + plan, before code.
2. A reviewer subagent attacks both documents.
3. APPROVE is the gate.
4. Code in slices, at most four subagents at once, then the lead verifies.

## Why

1. A plan is cheap to change and the code it produces is not. The cheapest place to
   find a design hole is a paragraph, not a migration.
2. A reviewer that has not been asked to attack will summarise. Give it the docs, the
   rules that bind the change, and the demand for numbered findings with file:line.
3. Reviewers are wrong sometimes, and confidently. Verify each finding against the
   code before applying it. Answering a finding with a reason is a valid disposition;
   applying a wrong one is a new bug with a citation.
4. Parallel implementers without slices fight over the same files. A slice owns its
   files, its tests and its commit, so four can run at once without coordination.
5. "Tests pass" from a subagent is a claim, not evidence. The lead runs the gates.

## Step 1 — design, then plan

Use the `brainstorming` discipline to settle intent before writing anything: who
asks for this, what the failure is today, which alternatives were rejected and why.

Then `writing-plans` produces two artifacts, in the repository's own docs tree:

| artifact | path | must contain |
| --- | --- | --- |
| spec | `docs/superpowers/specs/<date>-<slug>.md` | the gap in **measured** facts, the decision, the rules, what is answered rather than applied, out of scope, and how each claim will be verified |
| plan | `docs/superpowers/plans/<date>-<slug>.md` | slices as file-level steps, the tests each slice adds, the commands to run, the order, and the rollback |

If the repo has no such convention, keep the two-file split anyway and say where they
live. One plan file is not enough: the reviewer needs to see what will be *verified*,
not just what will be built.

Mark every claim about current behaviour with a `file:line`. A spec that says "the
route throws" without naming the line has already cost the reviewer a hunt.

## Step 2 — the reviewer gate

One reviewer subagent, `deepseek-flash` is fine. Send it **both** documents and a
self-contained brief, because it does not share your context:

- the repo and stack, in two sentences;
- the rules that bind this change (the repo's AGENTS.md invariants, import direction,
  tenancy or auth rules, test commands);
- the files it should read to check the doc's claims;
- the output format: `VERDICT: APPROVE` or `VERDICT: CHANGES`, then numbered findings,
  each with severity, `file:line`, one sentence of what is wrong, and the fix.

Tell it not to edit files and not to restate the documents. Cap the findings if the
reviewer tends to ramble; a short list of real problems beats an exhaustive one.

Then **every finding gets a disposition in the spec's review changelog**: applied, or
answered with the reason it is wrong or out of scope. Keep the changelog append-only and
per round, so the next round can see what was already decided and why.

## Step 3 — the gate

Implementation starts only after `VERDICT: APPROVE`. Not "approve with nits that I will
handle", not "the findings were minor so I started anyway". If the reviewer returned
CHANGES, apply and re-dispatch.

**Stop rule.** Two or three rounds is normal; four is the ceiling. When the findings
collapse into test-recipe corrections — a mock is missing a method, a file path is one
level off, an import is now unused — apply them and start coding. That is not the
design being wrong, it is the plan being underspecified at the level of keystrokes.
Say so in the changelog and move. A review loop longer than the implementation is a
loop that has stopped buying anything.

## Step 4 — code with subagents, in waves

Split the plan into slices that do not share files. Run at most four implementers at
once; more work is a second wave. Give each one:

- the exact files it owns, and the interfaces it must not change;
- the tests to add, and the command that runs them;
- the instruction to run it and report the counts, not the intention.

Then the lead integrates. Read the final diff yourself — a run of green suites does not
tell you whether the diff is the one that was planned. Run `make check` and the suites
with your own hands. Expect existing tests to break: a route that changes behaviour
breaks the fixture that asserted the old one, and updating those fixtures is part of
the slice, not fallout.

## What a slice owns

A slice is one commit. Its message says what changed and why the previous behaviour was
wrong. Never push; pushing is the user's step. Ask before committing unless the user
already told you to.

## Closing the loop

- a `docs/progress/<date>-<slug>.md` entry, copied in shape from the newest one;
- the progress index row and the current-status block refreshed;
- the gates **re-measured**, with real counts in the entry, and any flake named as a
  flake with the evidence that it is one;
- every deferred item written down with its reason, so the next session does not
  rediscover it.

## Red flags

- a spec edited after coding started, with no changelog line saying why;
- a slice with no test, or a test that asserts the mock;
- counts in the progress entry that nobody ran;
- the reviewer and the implementer are the same agent in different hats;
- a feature "done" with an open item that the acceptance criteria actually require.
