# 3PL Warehouse for Claude Code

Stock, dispatch and weekly warehouse charges in a database you own. Built by Enterprise DNA. Works with Claude Code, Codex, OpenCode or Cursor.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free, MIT. Install and try the demo. | Your warehouse rules, export mappings and scanner interface. [Book a call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=cartoncloud). | Installed and operated through **Omni by Enterprise DNA**. One setup fee, then a retainer. [See the offer](https://enterprisedna.co/omni/instead-of/cartoncloud). |

## Start here

```bash
git clone https://github.com/Enterprise-DNA-OS/3pl-warehouse-for-claude-code.git
cd 3pl-warehouse-for-claude-code
npm install
npm run demo
npm test
npm run view
npm run docs
```

Node 20 or newer. Embedded PGlite needs no server. Demo records use dates relative to their first seed. Re-seeding preserves records. For a fresh demonstration use a new DATA_DIR. For shared Postgres, set DATABASE_URL in your environment and run npm run migrate. Never seed real records.

## What is included

Ten record types cover customers, products, locations, stock lots, orders, movements, charge runs, charge lines, incidents and notes. The demo deliberately includes overdue dispatch, old stock, quarantine, approaching expiry, missing rates and incomplete safety records.

Receive by lot, reserve for the owning customer, print pick slips and record supervisor dispatch. Stock deductions and movements are one transaction. Quarantine, expiry and insufficient stock stop dispatch. Reservations cannot consume another client’s stock. Every adjustment needs a reason. Cancelled orders free their reservation.

The weekly storage estimate rounds each lot up to pallets. A charge run freezes today’s snapshot plus seven days of receipt and dispatch handling in base units. Agreed rates are mandatory. Same-date reruns return the stored run; overlapping weeks fail. A named reviewer approves the draft. These are internal charge records, not tax invoices. See the [operating limits](docs/why-no-front-end.md).

## Commands

Each command is an agent recipe. Reads offer human output or --json. Names match without case sensitivity; partial ids and names work only when unique. Ambiguous matches print candidates and exit 1. Product codes shared by customers require the product’s id.

| Command | Job |
|---|---|
| /customers | Customer rates and currency |
| /products | Product master |
| /stock | Stock, reservations and free units |
| /inbound-receipts | Recent goods received |
| /pick-list | Due orders and release holds |
| /orders | All warehouse orders |
| /capacity | Occupied and free pallet spaces |
| /expiry-watch | Lots requiring expiry review |
| /storage-run | Current weekly storage estimate |
| /charges | Stored weekly charge lines |
| /attention | Overdue dispatch, held stock and missing rates |
| /compliance | Safety record and stock policy checks |
| /incidents | Safety event register |
| /notes | Customer operations notes |
| /movements | Receipt, dispatch and adjustment audit trail |
| /customer-review | Customer stock, overdue work and last contact |
| /customer | One customer record |
| /add | Add a customer, product, location or incident |
| /set | Correct a customer, product, location or incident |
| /receive | Book a goods receipt |
| /allocate | Reserve stock for an outbound order |
| /dispatch | Record supervisor release and deduct stock |
| /cancel | Cancel an open order and release its reservation |
| /adjust | Record a stock count correction |
| /hold | Quarantine a lot |
| /release | Release a quarantine after review |
| /bill-week | Freeze this week’s charge draft |
| /approve-charges | Record approval of a checked charge draft |
| /log | Record a customer operations note |
| /draft-statement | Draft a customer stock statement |
| /import | Import CartonCloud product master |
| /export | Export every warehouse record |
| /weekly-review | Monday brief from four operational reads |
| /customise | A tested migration for your fields or rules |
| /new-view | A read-only report in your brand |

## Documents and views

`npm run docs` writes stock statements, pick slips, charge statements and incident records under docs-out/. `npm run view` writes week, attention, capacity and storage dashboards under views/. Edit brand.json for business name, colours and logo_path. Open in a browser or print to PDF. Statement drafts stay in drafts/. Nothing sends.

## Ten questions to ask your own records

These cross-record questions are implemented today. They are not a claim that CartonCloud cannot produce equivalent answers with configuration.

1. Which overdue orders compete with soon-expiring stock? (`pick-list`)
2. Which clients have quarantined units and late dispatches together? (`customer-review`)
3. Which lots have sat here for more than sixty days? (`attention`)
4. Where are we reserving stock that now needs a quarantine review? (`stock`)
5. Which locations have room for the next receipt? (`capacity`)
6. Which customers have no agreed storage or handling rate? (`attention`)
7. What does each customer’s current pallet footprint cost at their agreed rate? (`storage-run`)
8. Which charge lines came from storage and which from handling? (`charges`)
9. Which safety event needs notification or a corrected retention date? (`compliance`)
10. Which customers have stock on hand but no recorded operations note? (`customer-review`)

## Your first hour: ten things to ask for

1. Put our warehouse name and logo on the paperwork.
2. Preview this CartonCloud product export.
3. Import the checked product master.
4. Set the verified pallet conversions and client rates.
5. Add the actual warehouse locations and capacities.
6. Receive one reconciled opening lot with its batch and expiry.
7. Reserve stock for a customer dispatch.
8. Show all expired, quarantined and overdue work.
9. Draft a customer stock statement for review.
10. Add our site reference field with a tested migration.

## Switching and compliance

The [replacement guide](docs/replace-cartoncloud.md) documents the one-command product import and the separate mapping needed for balances, orders and rates. Full stock history is not inferred from a product export. The [compliance guide](docs/compliance.md) cites NZ notification and retention rules and clearly separates them from warehouse stock policies. Configure the relevant Australian rules before use there.

CartonCloud describes package tiers plus usage volume and quotes the amount for each operation. No public price figure is claimed here. [Vendor pricing explanation](https://www.cartoncloud.com/resources/cartoncloud-reviews-pricing-and-alternatives-what-3pls-actually-want-to-know), checked 1 October 2026.

## Validation

`npm test` runs on a temporary database and checks every CLI route, imports, reservations, dispatch holds, charge calculations, repeat runs, migrations, seed idempotence and generated HTML. CI uses Windows and Linux. SQL uses standard Postgres features and no extensions. The embedded database is tested locally; shared Postgres needs deployment-specific backup and access checks.

MIT. Copyright 2026 Enterprise DNA.
