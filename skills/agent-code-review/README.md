# Agent Code Review

An agent skill for reviewing code authored or substantially modified by AI coding agents. It applies to ordinary application code as well as agent systems, with a focus on requirements, observable behavior, and verifiable evidence.

Start with [SKILL.md](SKILL.md). It provides the review workflow and loads supporting references when relevant, including CC/CRAP guidance for complexity analysis. Reviews produce findings; implementation changes require a separate request.

## Install

Install the **repository root** as one skill named `agent-code-review` using your agent runtime's skill installer. Keep `SKILL.md`, `agents/`, and `references/` together. The `evals/` directory is for maintaining and evaluating the skill and is optional for using it.

For Codex, an example request to the built-in installer is:

```text
Use $skill-installer to install the skill at the repository root of
https://github.com/SEARO1/agent-code-review.
```

Other runtimes have their own installation and discovery mechanisms. See the [official Codex skills documentation](https://learn.chatgpt.com/docs/build-skills) for Codex setup. Cloning this repository into an arbitrary directory alone does not register the skill.

## Use it

From a local checkout, give your coding agent the path to the main skill, the code to review, and the original requirements. For example:

```text
Read /path/to/agent-code-review/SKILL.md and follow it
to review my staged and unstaged changes against HEAD.
The acceptance criteria are in docs/specs/cancellation.md.
Report findings and verification limits without editing the implementation.
```

Replace the paths with your actual checkout and requirements file. You can also supply requirements directly in the prompt and identify a branch or exact pair of revisions instead of local changes.

If your agent runtime has already installed and registered the skill, an example invocation is:

```text
Use $agent-code-review to review these AI-authored changes against
the original requirements and report evidence-backed findings.
```

For a focused complexity review, ask the same skill to inspect CC, CRAP, or weak coverage. It reads [references/complexity-review.md](references/complexity-review.md) when needed; no second skill installation is required.

## What the review checks

- **Requirement fidelity:** missing behavior, scope expansion, and requested fixes that remain incomplete.
- **Integration:** whether the public entry point reaches the new behavior and produces the required result or persisted effect.
- **API and dependency validity:** whether the actual dependency version supports the imported symbols, signatures, and return shapes.
- **Test integrity:** whether assertions, mocks, skips, and CI settings still reject incorrect behavior. Legitimate requirement changes can justify updating tests.
- **Error and state handling:** incorrect success responses, partial writes, retry effects, and relevant concurrency risks. Specified fallbacks are valid behavior.
- **Repository fit:** existing implementations and shared domain rules, with reuse recommendations grounded in semantics and maintenance cost.

The reviewer derives counterexamples for high-risk behavior and distinguishes author-reported results from its own executions and source inspection. CC and CRAP help locate review targets; scores alone do not establish correctness or justify blocking a change.

See the [inspection criteria](references/review-checks.md) and [research rationale](references/sources.md) for details.

## Expected output

A review states its scope and evidence limits, then reports findings ordered by impact. Each defect includes its location, trigger, expected and actual behavior, consequence, evidence, and a focused correction or regression-check direction.

Supported defects, unresolved questions, and maintenance suggestions remain distinct. Zero actionable findings is a valid result. The report ends with checks actually run and material areas left unverified.

## Evaluation

Run the maintained fixture checks from the repository root with Python 3; they use only the standard library:

```sh
python evals/check_cases.py
```

The script executes the maintained Python snippets in [evals/cases.md](evals/cases.md). Its seven checks verify fixture behavior; they do not run or score a coding agent.

The initial review evaluation used eight synthetic scenarios: five defect-bearing changes, two legitimate changes, and one case with insufficient evidence. Before consolidation into this single-skill layout, fresh reviewers using the original complexity skill and the main review skill both reached the expected judgments. **That evaluation demonstrated no detection improvement over the baseline.** It was one pass per variant, not a statistical benchmark or a test of large-repository navigation.

For a new behavioral evaluation, give a fresh reviewer the chosen skill and raw cases, withholding [evals/results.md](evals/results.md) and `evals/check_cases.py` until grading. Compare misses, false positives, and evidence errors. The [evaluation record](evals/results.md) documents the initial results and remaining limits.

## Repository layout

```text
.
├── README.md
├── SKILL.md                         # Single skill entry point
├── agents/
│   └── openai.yaml                  # UI metadata and example invocation
├── references/
│   ├── complexity-review.md         # CC/CRAP guidance, loaded when relevant
│   ├── review-checks.md
│   └── sources.md
└── evals/
    ├── cases.md                     # Raw review scenarios
    ├── check_cases.py               # Executable fixture checks / answer key
    └── results.md                   # Evaluation results and limitations
```
