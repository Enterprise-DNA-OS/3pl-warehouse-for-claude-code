---
description: "Export every warehouse record"
---
# Export every warehouse record

Read CLAUDE.md and `docs/replace-cartoncloud.md` for imports, `docs/compliance.md` for safety or stock decisions. Run `npm run warehouse -- export`. Use `--json` for analysis. Start with a read of the affected records. Ask the operator to resolve ambiguous names. Use actual source evidence for writes; never fabricate rates, quantities, dates or approvals. Read `scripts/lib/domain.mjs` for accepted add/set fields and `npm run warehouse -- help` for options. Quote arguments containing spaces. Report held actions and missing records clearly. Drafts remain local; nothing sends.

