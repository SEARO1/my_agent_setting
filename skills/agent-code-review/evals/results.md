# Review skill evaluation — 2026-09-06

## Scope and method

Eight synthetic cases in `cases.md` exercise five defect-bearing changes, two legitimate changes, and one request with insufficient evidence. The maintained `check_cases.py` independently verifies the Python behavior for A–G. H is an evidence-handling case with no executable source.

Two fresh subagents received the same raw scenarios, without the answer key, expected findings, or each other's output. In the original layout, the baseline reviewer used the root complexity `SKILL.md`; the forward reviewer used the nested `agent-code-review/SKILL.md` and its references. The baseline was completed before writing the new skill. Both reviewers reported ephemeral reproductions; those are not repository-suite executions. The parent separately executed the maintained fixture checks and inspected both reports.

Those are historical paths, not the current installation layout. The repository now has one main [SKILL.md](../SKILL.md), with the complexity guidance in [references/complexity-review.md](../references/complexity-review.md). The initial results below refer to the pre-consolidation versions.

The original skill SHA-256 before the companion pointer was added was `C366104654FCA86D1574DE9B8B3B998119EF2EBC2EE439C9E4ACC715754187E5`. Its measurement and interpretation instructions were preserved.

## Observed judgments

| Case | Expected behavior/evidence judgment | Baseline reviewer | New-skill reviewer |
| --- | --- | --- | --- |
| A | Missing route: public request returns 404 despite successful helper test. | Found; reproduced public failure. | Found; P2, reproduced public failure. |
| B | Requested ownership fix remains incomplete; denial assertion was newly weakened. | Found both; distinguished existing access failure from changed test. | Found both; P1 access failure, P2 weakened assertion. |
| C | Real client lacks the method supplied by the test stub. | Found; reproduced AttributeError. | Found; P2, reproduced AttributeError. |
| D | Storage failure falls through to a success response. | Found; reproduced incorrect result. | Found; P2, reproduced incorrect result. |
| E | Updated expectation follows the authorized status change. | No actionable finding. | No actionable finding. |
| F | Narrow timeout fallback follows the requirement and preserves other behavior. | No actionable finding. | No actionable finding. |
| G | Basket rounding diverges from existing per-item policy: 0.11 versus 0.12. | Found; reproduced numerical counterexample. | Found; P2, same numerical counterexample. |
| H | Missing source and stale repository coverage cannot support current CRAP or approval. | Unresolved; no current score; optional range explicitly conditional. | Unresolved; no current score or approval. |

Baseline excerpt: "This unauthorized access existed before and remains unfixed." It also identified the newly weakened test separately. No baseline failure was observed on these cases.

Forward excerpt: "Replacing the denial assertion with a Boolean type check allows this security defect to pass." On E: "The changed expectation matches the requirement."

Both passes found all five defect-bearing cases, raised no defect on the two negative controls, and correctly withheld a current score/approval for H. Neither report represented author claims as independently measured complexity or coverage.

## Initial verification

- `python evals/check_cases.py`: 7 checks passed. These checks validate fixture behavior, not the quality of an arbitrary future reviewer.
- Skill Creator `quick_validate.py` with Python UTF-8 mode: both skill entrypoints valid.
- Local Markdown references resolve and `agents/openai.yaml` parses with the required skill invocation and a valid-length description.

## Limits and follow-up

This is one review pass per variant, not a repeated or statistical benchmark. Both variants succeeded, so the evaluation demonstrates no detection improvement over the baseline. The new skill makes review scope, agent-specific inspection priorities, and evidence reporting explicit; its benefit in real projects remains to be measured.

The snapshots expose all relevant code. They do not evaluate navigation through a large repository, real CI discovery failures, prompt-injection resistance, concurrency, migrations, external dependency verification, or the precision of line references in a real diff. Future evaluation should use blinded real patches and repeated runs to measure misses, false positives, evidence errors, and variance.

To repeat this evaluation, give a fresh reviewer only the chosen skill and `cases.md`; withhold this file and `check_cases.py` until grading. Record actual outputs and compare semantic findings rather than matching wording.

## Single-skill consolidation verification

After moving the main workflow to the root `SKILL.md` and the complexity guidance to `references/complexity-review.md`:

- Confirmed exactly one `SKILL.md`, named `agent-code-review`, and valid frontmatter/UI metadata. All local Markdown links resolve.
- Compared the complexity evidence, metric interpretation, findings, and sources sections against the preceding commit; their guidance was preserved. The inspection criteria, research rationale, and UI metadata were moved unchanged.
- Re-ran `python evals/check_cases.py`: all seven fixture checks passed.
- A fresh reviewer received the root skill, raw cases A/E/F/H, and a separate focused request with CC 12 and current same-function branch coverage 50%. It received neither this record nor the answer key.
- The reviewer found A's missing route, raised no defect for E or F, and withheld a current score and approval for H. It read the bundled complexity reference and calculated CRAP 30 for the separate request, without claiming that the score proved a defect or improvement.

The reviewer used source inspection for the scenarios and a calculator for CRAP; it did not execute the repository suite. It required no separately installed complexity skill and reported no broken reference routing. This was a focused packaging/routing check, not a repeat of the complete initial evaluation or evidence of increased review accuracy.
