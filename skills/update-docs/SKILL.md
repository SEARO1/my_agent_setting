---
name: update-docs
description: >
  Audit a repo's documentation against its code and update what is missing or stale.
  Use when the user says "update the docs", "docs folder is out of date", "is anything
  missing in docs/", "audit docs against the code", "docs truth sweep", or after a
  feature lands undocumented. Measures first, fans out to at most 4 subagents, and the
  lead alone writes the index page.
---

# Update docs

The doc tree tells the truth about today's code, and the index points at files that exist.
Measure before writing; measure again after.

## Non-negotiables

- **Docs only.** No code, tests, config, package files, `.env`. No git write without the user's word.
- **One writer per file.** Every subagent gets an explicit, non-overlapping file list. The lead alone edits
  the index page (`docs/README.md`) — that is what keeps 4 agents from clobbering the same table.
- **No unmeasured number.** A count you did not run is not written; a guess is labelled `estimate`.
- **Verify before writing.** Read the source. A doc that restates another doc instead of the code rots twice.
- **Tiny helper rule.** A module under ~40 LOC gets an index row and a folded section in the page that already
  owns its subsystem — not a page of its own. Doc sprawl is the other failure mode.
- **Gate after every wave**, not only at the end.

## Step 0 — clock-in

Read the repo's own rules first (`AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`): session workflow, docs
policy, what must not be touched. Then:

1. `git status --porcelain` — a dirty tree means someone is mid-thought; do not "fix" their files.
2. If the repo keeps a progress/decisions record, read only the current-status block and the one topic the task touches.
3. Run the doc gate for a baseline **before** you change anything — `node scripts/check-doc-links.mjs`
   (or `make check-docs`) — and write the numbers down, e.g. "2049 links / 306 files".
4. Collision check when a second agent session may share the workspace (cross-session `overlaps` / `peers`).

## Step 1 — measure

    node ~/.dsh/skills/update-docs/references/coverage-audit.mjs --root <repo>

It prints the facts an index page usually gets wrong (doc pages and directories, Prisma models / enums /
tenant-owned, route declarations vs the endpoint reference, env keys vs their reference page, pages nobody
links) and the **documentation-relevant units with no mention in any current doc page**. Edit the `AREAS`
and `HIST_DIRS` constants at the top for a different layout.

The gap count is a lead, not a verdict: do Step 2 before writing a word.

## Step 2 — turn candidates into a gap list

For each candidate, grep the exact name (not the folder) across the **current** docs:

- **Historical trees do not count.** `progress/`, `reviews/`, `specs/`, `superpowers/`, `plans/` are
  dated records. A module named only there is undocumented.
- **Substrings lie.** `cer` matches "severity"; a short name matches inside longer words. Require a path, a
  backticked filename, or a whole word.
- **Folder coverage is not file coverage.** One sibling linked does not document `foo/bar.ts` — unless the
  repo's own module convention says the folder *is* the unit. Decide per repo, then state the rule you applied.
- Read each survivor before writing: many are already covered behaviourally by a feature page and need only an
  index row naming the path.

Then choose the shape per unit: **new page** (a concern nobody documents), **fold** (a section added to the page
that already owns the subsystem), or **row only** (tiny helper, already covered behaviourally).

## Step 3 — fan out, at most 4

Split by **subsystem**, not by file count — and never by page count. Each subagent gets the brief in
`references/subagent-brief.md`, filled in: its units, the page each should become, its writable-file list, its
caps (≤4 new pages, ≤3 edits), and the return format that ends with the exact index rows for the lead.

Dispatch all four in one message so they run concurrently. Then:

- **Wave 2 = each agent fixes the drift it reported.** `send_message` to the finished agent; it keeps its context.
- A failed subagent is not a reason to respawn blindly: check `git status` for partial writes, then do the small
  remainder yourself. Respawn only when the slice is big enough to be worth the round trip.

## Step 4 — lead pass: the index and the numbers

While the agents write, you own the index page. There:

- **Fix every stale count** from the Step 1 measurement, and say when it was counted — `(counted 2026-11-24)`.
- **Insert the rows** each agent returned, in the section that already exists. Never invent a section for one row.
- **Fix self-contradictions.** The same page stating two different counts is the signature of a stale index.
- **Add the pages nobody indexed**, and name the deliberate exceptions (a decisions tree indexed by its own
  `DECISIONS.md`; a gitignored artefact).
- **Retarget rows** whose link lands on a page that never mentions the module.

## Step 5 — close

1. `node scripts/check-doc-links.mjs` — must print "all resolve". Anchors are case-sensitive and an `#L44`
   past EOF fails, so verify any line anchor you wrote by reading the file.
2. `make check` (typecheck + lint + docs) and the test suite if there is one — record both counts. A docs-only
   diff still runs them: the rule exists so that "nothing broke" has evidence behind it.
3. Review the whole diff yourself (`git diff --stat`, then read the new pages). The integrating agent owns it.
4. Clock-out: progress entry, its index row, refreshed current-status block — if that is the repo's custom.
5. **Ask before committing.** Report what is open and what you deliberately left unfixed.

## Pitfalls measured on a real run (2026-11-24)

| pitfall | cost | fix |
| --- | --- | --- |
| Probe appended `.ts` to an id already ending in `.ts` | 172 false gaps | strip the extension before re-adding it |
| Counted folder coverage from one sibling link | 47 "gaps" that were one covered folder | probe the unit, not its neighbours |
| Counted historical hits as coverage | ~17 units marked done with no current page | exclude `progress/`, `reviews/`, `specs/`, `superpowers/` |
| Two agents both editing the index | would have raced | lead-only index writes; agents return rows as text |
| One agent's gate run sees another agent's half-written page | false failure | tell agents: report foreign breakage, do not fix it |
| Windows `path.join(root, absolutePath)` | `ENOENT ...\C:\...\docs` | keep paths root-relative, join once |
| Node template literal holding a backtick | `Expected a semicolon` | write scripts as real files, or build with `String.fromCharCode(96)` |
| `new RegExp("(?ms)...")` | `Invalid group` | JS has no inline flag syntax; pass flags or split on markers |
| grep pattern containing a newline escape | `rg: the literal is not allowed` | two greps, or read the line range |
| A blank line inside a markdown table | the row silently drops out | re-check inserted rows with a script |

## Files

- `references/coverage-audit.mjs` — the measurement script. Run it; do not re-derive its logic by hand.
- `references/subagent-brief.md` — the per-agent brief template with the ownership and return rules.