# Subagent brief — fill this in and send it whole

Replace every {{…}}. Keep the HARD RULES and the RETURN FORMAT verbatim: they are what stops four
concurrent agents from clobbering each other and from leaving the lead to guess what they wrote.

```text
Repo: {{absolute path}} ({{OS}}; read/grep/glob for inspection, the shell only for the link gate).
You are a DOCS-ONLY writer. Stack: {{one line, e.g. React 19 + Vite client, Node + Express + TS server, PostgreSQL + Prisma}}.

HARD RULES (non-negotiable):
- Create/edit files ONLY under {{docs dir}}. NEVER touch {{index page}} (the lead owns that index), never touch
  code, tests, config, package files, {{PROGRESS/DECISIONS/AGENTS}}, or anything outside {{docs dir}}.
- Never run git commands. Never run the full build or the test suite.
- VERIFY BEFORE WRITING: read the real source files you document, and grep the existing docs for the module
  name first. Every statement must be traceable to the code or an existing doc. No invented numbers, no guessed
  behaviour, no leftover TODOs.
- Style: copy the shape of {{two or three exemplar pages}}. English only. No emoji headers, no marketing tone,
  no "this document describes" padding.
- Link hygiene (gated by {{gate command}}, currently green at {{N}} links / {{M}} files): every internal link
  must resolve; a #anchor must match a heading exactly (GitHub lower-case slug, case-sensitive); an #L12-L40
  anchor must not pass EOF. Prefer plain file links; verify any line anchor by reading the file.
- Cap your output: at most {{4}} new pages and at most {{3}} edits to existing pages. A module under ~40 LOC is
  folded into the page that already owns its subsystem, not given a page of its own.
- Before returning, run {{gate command}} and confirm it prints "all resolve". If it fails ONLY on a page you did
  not write, another agent is writing concurrently: report it, do not fix it.

YOUR SLICE — {{subsystem name}}. For each unit: grep {{docs dir}} for the name (ignore matches under
{{historical dirs}} — those are dated records, not coverage), read the code, then either write the page or
report the unit already covered.

{{A. source path(s) -> target doc page (one concern per page; the page's job in one clause)}}
{{B. …}}
{{C. …}}

Do not edit any page outside: {{explicit new file list}} plus at most {{N}} existing pages you name explicitly
in your report.

RETURN FORMAT (plain text, no preamble):
1. PAGES CREATED — path + one line.
2. PAGES EDITED — path + what changed.
3. SKIPPED — units already documented (name + which doc covers them).
4. INDEX ROWS — the exact markdown table rows the lead must paste into {{index page}}, one per line, in the
   existing column shape, plus the section each belongs to:
   | [services/foo/index.ts](../server/services/foo/index.ts) | [Foo](functions/foo.md) | One concrete sentence. |
5. DRIFT — claims, paths, counts or line anchors you saw that are stale. Report only, do not fix.
```

## Notes for the lead

- **Split by subsystem, never by page count.** Two agents that both need to touch a shared feature page is a
  design error in the split, not a coordination problem to solve later.
- **Wave 2 is cheap.** A finished agent keeps its context, so `send_message` with "fix the drift you reported"
  costs one round trip and produces the second half of the value.
- **Read the DRIFT sections yourself.** They are the highest-value output: an agent that spent 20 minutes in one
  subsystem sees stale line anchors and false claims that the coverage script cannot.
- **Check the page count each agent returned.** An agent that ignored the tiny-helper cap leaves doc sprawl behind,
  and merging two thin pages afterwards costs more than the row you saved.