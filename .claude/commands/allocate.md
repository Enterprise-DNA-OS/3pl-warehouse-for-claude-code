---
description: "Reserve stock for an outbound order"
---
# Reserve stock for an outbound order

Read CLAUDE.md and `docs/replace-cartoncloud.md` for imports, `docs/compliance.md` for safety or stock decisions. Run `npm run warehouse -- allocate --customer=<name> --lot=<name> --quantity=<units> --order=<reference> --due=<YYYY-MM-DD> --destination=<place>`. Use `--json` for analysis. Start with a read of the affected records. Ask the operator to resolve ambiguous names. Use actual source evidence for writes; never fabricate rates, quantities, dates or approvals. Read `scripts/lib/domain.mjs` for accepted add/set fields and `npm run warehouse -- help` for options. Quote arguments containing spaces. Report held actions and missing records clearly. Drafts remain local; nothing sends.

