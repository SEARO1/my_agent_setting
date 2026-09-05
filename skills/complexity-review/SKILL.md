---
name: complexity-review
description: Use when reviewing code changes for cyclomatic complexity, CRAP scores, or complex logic with weak test coverage, or when prioritizing refactoring by change risk.
---

# Complexity Review

Use metrics to locate review targets, then inspect their behavior. This is a focused supplement to correctness and requirements review. Return findings; edit code only when requested.

## Establish the evidence

1. Read repository instructions and identify the requested files or diff. Record the base and target revisions, including whether working-tree changes are included. If scope is absent, inspect local changes and state the scope used; ask only when ambiguity would change the review materially.
2. Inspect complete changed functions, their callers, tests, and existing analyzer/coverage configuration. Separate new or worsened risks from unchanged debt. Exclude generated and vendored code unless requested.
3. Prefer existing local tools and reports. Record analyzer/version/options, coverage type, measured unit, revision, and command or report path. Confirm reports match the reviewed code and comparable test scope. If tooling is unavailable, continue with clearly labeled manual CC estimates and qualitative coverage gaps. Do not install tools merely to produce a number.

## Interpret the metrics

**Cyclomatic complexity (CC)** measures independent control-flow paths. A function normally starts at 1; decisions increase it. Use the analyzer's language-specific counting rules: boolean operators, switch variants, optional chaining, and exception handling can differ. Do not treat nesting depth or regex keyword counts as measured CC.

**CRAP** combines CC with coverage of the same unit:

```text
CRAP = CC^2 * (1 - coverage_pct / 100)^3 + CC
```

Validate finite inputs and `0 <= coverage_pct <= 100`; normalize fractions using the report's declared units. If units are ambiguous (for example, bare `0.5`), confirm them before calculating an actual score; only conditional scenarios are valid meanwhile. A nonempty ordinary function has `CC >= 1`. Empty aggregates have no average.

Use current coverage mapped to the function/method, not repository coverage or the percentage of functions invoked. Label line, branch, or path coverage explicitly; preserve the report's definition when reproducing its CRAP. For file-level tool scores, retain the tool's aggregation semantics and label the unit. Do not combine file totals with function rows.

Missing, stale, or mismatched coverage means **CRAP unavailable**, not zero coverage. If useful, provide a separately labeled hypothetical range `[CC, CC^2 + CC]` for unknown coverage and known CC. CRAP derived from estimated CC is also an estimate. Executed lines do not prove branches or assertions are adequate.

Use repository thresholds first. Otherwise these advisory bands adapt the OtterWise article; exact boundary handling below is this skill's convention, resolving the article's overlap:

| Metric | Bands |
| --- | --- |
| CC | 1–6 low; 7–9 moderate; 10–20 high; >20 very high |
| CRAP | <30 lower concern; 30–<60 investigate; >=60 prioritize inspection |

A score alone is neither a defect nor a merge blocker. Fully covered code still has `CRAP = CC`.

## Turn hotspots into findings

Inspect uncovered decisions and their observable consequences: error handling, boundary inputs, authorization, state transitions, and interacting conditions. A finding needs a location, concrete risk, evidence, and a useful next action. Distinguish demonstrated defects from maintainability suggestions and unavailable evidence.

Prefer a test for a specific unprotected behavior before risky refactoring. Suggest focused extraction, guard clauses, or a dispatch table only when they clarify actual responsibilities. Guard clauses can reduce nesting without lowering CC. After extraction, inspect the helpers too; moving decisions does not prove total complexity disappeared. Use polymorphism only when the domain warrants it.

For trends, compare like-for-like units and report both sum and mean with unit counts and exclusions. Explain additions, removals, and renames; do not claim old hotspots improved because easy new code lowered the mean. Keep partial aggregates explicitly partial, and never substitute zero for missing metrics.

## Report

Lead with the review conclusion and evidence limits. Use a compact table when several units are involved:

`Location/function | CC (measured/estimated) | coverage % + type | CRAP/status | change from base`

Then list actionable findings in risk order: location, changed behavior or maintenance risk, evidence, recommended test/refactor. Keep pre-existing debt separate. Finish with checks run and any missing measurements. If no actionable findings are supported, say so without declaring the code safe from metrics alone.

Example: CC 12 with current same-function line coverage 50% gives `144 * 0.5^3 + 12 = 30`. At 80% it gives `13.152`; these are coverage scenarios, not measured improvement unless both reports exist. Inspect the uncovered behavior before recommending work.

## Sources

- [OtterWise: Understanding CRAP and Cyclomatic Complexity Metrics](https://getotterwise.com/blog/understanding-crap-and-cyclomatic-complexity-metrics) — formula, advisory bands, sum/mean tradeoffs, and refactoring ideas.
- [PHPUnit: Code Coverage](https://docs.phpunit.de/en/12.5/code-coverage.html) — coverage definitions and measurement limitations.
- [ESLint: complexity](https://eslint.org/docs/latest/rules/complexity) — examples of analyzer-specific counting and variants.

The evidence requirements and review workflow above are this skill's adaptations. Consult the installed analyzer's documentation when its semantics are uncertain.
