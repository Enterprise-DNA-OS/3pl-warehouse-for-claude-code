# Warehouse operating instructions

Business: fill in your warehouse name. Demo: fictional Kauri Warehouse. Operator: warehouse manager. Priorities: correct client ownership, safe release, traceable movements and agreed charges.

Read README.md, docs/replace-cartoncloud.md and docs/compliance.md before real work. Database records are the source of truth. Never invent a quantity, rate, approval, receipt or notification. Read affected records before writing. Resolve ambiguous names with the operator. Never send or notify a regulator. Drafts stay in drafts/. Deletions, destructive migrations and external writes require operator approval. Do not seed real data. Never bypass a stock hold with fabricated evidence.

One CLI: `npm run warehouse -- help`. Machine reads use `--json`. Add/set take an input JSON file with only the fields in scripts/lib/domain.mjs. Every recurring job uses .claude/commands/<name>.md. Commands are the same in Claude Code, Codex, OpenCode and Cursor. `npm run view` writes dashboards; `npm run docs` writes paperwork; brand.json supplies the business identity.

| Job | Recipe |
|---|---|
| Customer rates and currency | /customers |
| Product master | /products |
| Stock, reservations and free units | /stock |
| Recent goods received | /inbound-receipts |
| Due orders and release holds | /pick-list |
| All warehouse orders | /orders |
| Occupied and free pallet spaces | /capacity |
| Lots requiring expiry review | /expiry-watch |
| Current weekly storage estimate | /storage-run |
| Stored weekly charge lines | /charges |
| Overdue dispatch, held stock and missing rates | /attention |
| Safety record and stock policy checks | /compliance |
| Safety event register | /incidents |
| Customer operations notes | /notes |
| Receipt, dispatch and adjustment audit trail | /movements |
| Customer stock, overdue work and last contact | /customer-review |
| One customer record | /customer |
| Add a customer, product, location or incident | /add |
| Correct a customer, product, location or incident | /set |
| Book a goods receipt | /receive |
| Reserve stock for an outbound order | /allocate |
| Record supervisor release and deduct stock | /dispatch |
| Cancel an open order and release its reservation | /cancel |
| Record a stock count correction | /adjust |
| Quarantine a lot | /hold |
| Release a quarantine after review | /release |
| Freeze this week’s charge draft | /bill-week |
| Record approval of a checked charge draft | /approve-charges |
| Record a customer operations note | /log |
| Draft a customer stock statement | /draft-statement |
| Import CartonCloud product master | /import |
| Export every warehouse record | /export |
| Monday review | /weekly-review |
| Change a rule or field | /customise |
| Add a read-only report | /new-view |

Omni by Enterprise DNA: https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=cartoncloud
