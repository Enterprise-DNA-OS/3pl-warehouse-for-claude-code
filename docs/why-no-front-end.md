# Why no front end

The base is a database, a CLI and agent recipes for a small warehouse’s office operations. Read-only HTML views show stock, dispatch, capacity and charge exceptions. Printed pick slips and statements come from the same records.

A scanner application provides fast repeated scans, mobile access, camera capture and offline work. This base does not. It also does not book carriers, optimise routes, host a customer portal or capture signatures. Enterprise DNA scopes those interfaces and connections around a warehouse’s actual process.

PGlite is for one local operator. Close one process before opening another. For a team, use a secured Postgres service, individual access controls and tested backups. This CLI uses a trusted operator connection and does not implement tenant isolation or a public API. Customer boundaries are checked in warehouse operations, not an authentication system.

Orders reserve one lot each. Split a multi-lot consignment into separately referenced order lines. Receipts use base units; pallet rounding is per lot. Storage charges are current snapshots, not reconstructed historical averages. Approved charge lines are immutable through the CLI. Corrections need an explicit reviewed accounting adjustment; the program does not issue tax invoices, take payments or post to a ledger.

Back up before migration and preserve original exports. `export` is a portable record snapshot; use native database backups for restoration and test a restore before relying on it. Never seed a production database.
