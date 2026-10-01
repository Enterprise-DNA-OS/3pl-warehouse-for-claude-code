# Replace CartonCloud: product master first

Checked 1 October 2026 against [CartonCloud’s product export instructions](https://help.cartoncloud.com/knowledge/exporting-and-importing-products) and [Customer Stock Report](https://help.cartoncloud.com/knowledge/customer-stock-report).

Export the product master from CartonCloud’s Products screen using its export function. Keep the original CSV. This base accepts the documented `Customer`, `Id`, `Active`, `Name`, `Code`, `Type` and `Base Measurement` columns. Extra columns are retained verbatim in `source_record` for a later mapping, not applied as rules. Example data is synthetic and uses documented headers.

```bash
npm run migrate
npm run warehouse -- import cartoncloud /path/to/products.csv --dry-run
npm run warehouse -- import cartoncloud /path/to/products.csv
```

One command imports the product master after migration. Each customer plus product code identifies a product. Repeat imports update descriptive product fields without duplication. The entire import rolls back on an error. A changed base unit on a product that has stock is rejected. Keep customer names and product codes stable. Importing does not delete products absent from the file. Ambiguous customer names fail.

| Source | Destination |
|---|---|
| Customer | Customer name, created without agreed rates |
| Id | Original product id |
| Code, Name | Product code and description |
| Active | Yes or No product availability |
| Type, Base Measurement | Product type and base unit |
| Other columns | Original source record retained for mapping |

Set each product’s units per pallet explicitly before receiving stock. The default is one base unit per pallet and must not be used for a customer bill without checking it. Storage methods, conversion hierarchies, rate cards, selection rules, integrations, orders, attachments, transport movements and history are not automatically recreated.

For opening stock, export the Customer Stock Report as CSV with unit scaling disabled. That report is a reconciliation source, not a lot importer: the documented view is insufficient to infer every lot, pallet, hold and location. Agree the mapping of detailed stock records, then record verified lots with `receive`, including batch, location, quantity, expiry and quarantine status. The helper is one lot per receipt. Detailed bulk stock and order migration is custom work. Reconcile totals by customer, product and base unit before dispatching. Do not claim a full account migration in one day from the product file alone.

Run a parallel storage calculation against a real billing week. This base rounds pallets up separately for each lot, bills the current snapshot for the whole week, and counts base units received and dispatched during seven calendar days. It does not reproduce every CartonCloud tariff, daily maximum, minimum charge or GST invoice. Configure agreed rates, opening-stock handling treatment and currencies before a charge run. Do not import a rate as though it were a known customer contract.

Enterprise DNA maps the rest of the exports, reconciles counts and charges, and builds the agreed warehouse interface through Omni by Enterprise DNA. [Book a call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=cartoncloud).
