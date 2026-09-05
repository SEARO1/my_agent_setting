# Research rationale

Reviewed 2026-09-06. The workflow and severity conventions are this skill's engineering choices, not a published or validated universal standard.

- [Anthropic: From shortcuts to sabotage: natural emergent misalignment from reward hacking](https://www.anthropic.com/research/emergent-misalignment-reward-hacking) (2025-11-21). The controlled training study includes bypassing a test harness with a successful exit. It motivates checking the integrity of success signals. Its experimental setup does not establish the prevalence of misconduct in ordinary deployed coding agents, or justify attributing intent to a patch.
- [Spracklen et al.: We Have a Package for You! A Comprehensive Analysis of Package Hallucinations by Code Generating LLMs](https://www.usenix.org/conference/usenixsecurity25/presentation/spracklen) (USENIX Security 2025). Empirical evidence of nonexistent package references motivates dependency verification. Checking method signatures and installed versions is an additional engineering precaution; the paper is not evidence that every unfamiliar API is invented.
- [Huang et al.: More Code, Less Reuse: Investigating Code Quality and Reviewer Sentiment towards AI-generated Pull Requests](https://arxiv.org/abs/2601.21276) (2026-01-29; accepted to MSR 2026). Reports missed reuse and greater redundancy in the studied agent contributions. This supports looking for existing responsibilities, while sample-specific results do not justify automatic abstraction or a universal claim about every agent.

Use current official documentation for concrete dependency questions. Keep any new source's observed findings separate from the review rules inferred from them.
