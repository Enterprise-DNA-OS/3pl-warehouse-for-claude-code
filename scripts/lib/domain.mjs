export const fields={
  "customers": [
    "name",
    "currency",
    "storage_cents",
    "handling_cents"
  ],
  "products": [
    "customer_id",
    "code",
    "name",
    "active",
    "product_type",
    "base_unit",
    "units_per_pallet"
  ],
  "locations": [
    "name",
    "capacity_pallets"
  ],
  "incidents": [
    "name",
    "occurred_on",
    "notifiable",
    "notified_on",
    "retain_until",
    "note"
  ]
};
export const tables=["customers", "products", "locations", "lots", "orders", "movements", "charge_runs", "charge_lines", "incidents", "notes"];
