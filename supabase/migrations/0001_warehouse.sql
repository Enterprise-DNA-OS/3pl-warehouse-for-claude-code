create function touch_updated() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table customers (id uuid primary key default gen_random_uuid(), name text not null unique, currency text not null default 'NZD' check(currency ~ '^[A-Z]{3}$'), storage_cents integer check(storage_cents>=0), handling_cents integer check(handling_cents>=0), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger customers_updated before update on customers for each row execute function touch_updated();
create table products (id uuid primary key default gen_random_uuid(), customer_id uuid not null references customers, code text not null, name text not null, active boolean not null default true, product_type text not null default 'Ambient', base_unit text not null default 'CTN', units_per_pallet integer not null default 1 check(units_per_pallet>0), source_id text, source_record jsonb, unique(customer_id,code), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger products_updated before update on products for each row execute function touch_updated();
create table locations (id uuid primary key default gen_random_uuid(), name text not null unique, capacity_pallets integer not null check(capacity_pallets>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger locations_updated before update on locations for each row execute function touch_updated();
create table lots (id uuid primary key default gen_random_uuid(), product_id uuid not null references products, location_id uuid not null references locations, name text not null unique, batch text not null, received_on date not null default current_date, expires_on date, status text not null default 'available' check(status in ('available','quarantine')), quantity integer not null check(quantity>=0), check(expires_on is null or expires_on>=received_on), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger lots_updated before update on lots for each row execute function touch_updated();
create table orders (id uuid primary key default gen_random_uuid(), name text not null unique, customer_id uuid not null references customers, lot_id uuid not null references lots, quantity integer not null check(quantity>0), due_on date not null, destination text not null, status text not null default 'open' check(status in ('open','dispatched','cancelled')), dispatched_on date, check((status='dispatched')=(dispatched_on is not null)), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger orders_updated before update on orders for each row execute function touch_updated();
create table movements (id uuid primary key default gen_random_uuid(), lot_id uuid not null references lots, order_id uuid references orders, kind text not null check(kind in ('receipt','dispatch','adjustment')), quantity integer not null check(quantity<>0), occurred_on date not null default current_date, note text not null, unique(order_id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger movements_updated before update on movements for each row execute function touch_updated();
create table charge_runs (id uuid primary key default gen_random_uuid(), name text not null unique, week_ending date not null unique, status text not null default 'draft' check(status in ('draft','approved')), approved_by text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger charge_runs_updated before update on charge_runs for each row execute function touch_updated();
create table charge_lines (id uuid primary key default gen_random_uuid(), run_id uuid not null references charge_runs, customer_id uuid not null references customers, currency text not null, kind text not null, units integer not null, rate_cents integer not null, amount_cents integer not null, unique(run_id,customer_id,kind), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger charge_lines_updated before update on charge_lines for each row execute function touch_updated();
create table incidents (id uuid primary key default gen_random_uuid(), name text not null unique, occurred_on date not null, notifiable boolean not null default false, notified_on date, retain_until date, note text not null, check(notified_on is null or notified_on>=occurred_on), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger incidents_updated before update on incidents for each row execute function touch_updated();
create table notes (id uuid primary key default gen_random_uuid(), customer_id uuid not null references customers, note text not null, recorded_on date not null default current_date, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger notes_updated before update on notes for each row execute function touch_updated();

create view stock_view as
select l.id,l.name as lot,c.id as customer_id,c.name as customer,p.code,p.name as product,p.base_unit,p.units_per_pallet,
loc.name as location,l.batch,l.received_on,l.expires_on,l.status,l.quantity,
coalesce((select sum(o.quantity) from orders o where o.lot_id=l.id and o.status='open'),0)::integer as reserved,
(l.quantity-coalesce((select sum(o.quantity) from orders o where o.lot_id=l.id and o.status='open'),0))::integer as free,
ceil(l.quantity::numeric/p.units_per_pallet)::integer as pallets
from lots l join products p on p.id=l.product_id join customers c on c.id=p.customer_id join locations loc on loc.id=l.location_id;
create view dispatch_view as
select o.id,o.name as order_ref,c.name as customer,s.lot,s.product,o.quantity,o.due_on,o.destination,o.status,
case when s.status='quarantine' then 'Quarantine' when s.expires_on<current_date then 'Expired' when s.quantity<o.quantity then 'Short stock' when s.free<0 then 'Overallocated' else 'Ready for supervisor' end as release_check
from orders o join customers c on c.id=o.customer_id join stock_view s on s.id=o.lot_id;
create view storage_view as
select c.id as customer_id,c.name as customer,c.currency,coalesce(sum(s.pallets),0)::integer as pallets,c.storage_cents,
(coalesce(sum(s.pallets),0)*c.storage_cents)::integer as amount_cents
from customers c left join stock_view s on s.customer_id=c.id group by c.id;
create view capacity_view as
select l.name as location,l.capacity_pallets,coalesce(sum(s.pallets),0)::integer as occupied_pallets,
(l.capacity_pallets-coalesce(sum(s.pallets),0))::integer as free_pallets
from locations l left join stock_view s on s.location=l.name group by l.id;
create view attention_view as
select 'Overdue dispatch' as issue,order_ref as reference,customer,due_on::text as detail from dispatch_view where status='open' and due_on<current_date
union all select 'Quarantined stock',lot,customer,quantity::text||' units' from stock_view where status='quarantine' and quantity>0
union all select 'Expiry within 30 days',lot,customer,expires_on::text from stock_view where expires_on<=current_date+30 and quantity>0
union all select 'Stock older than 60 days',lot,customer,received_on::text from stock_view where received_on<current_date-60 and quantity>0
union all select 'Missing agreed rate',name,name,'Storage or handling rate missing' from customers where storage_cents is null or handling_cents is null
union all select 'Over capacity',location,'Warehouse',occupied_pallets::text||' pallets' from capacity_view where free_pallets<0;
create view compliance_view as
select 'NZ-HSWA-56' as rule,name as reference,'Notifiable event has no notification date' as finding,'https://www.worksafe.govt.nz/notifications/what-events-need-to-be-notified/' as source from incidents where notifiable and notified_on is null
union all select 'NZ-HSWA-57',name,'Retention date must cover five years after notification','https://www.worksafe.govt.nz/notifications/what-events-need-to-be-notified/' from incidents where notifiable and notified_on is not null and (retain_until is null or retain_until < (notified_on+interval '5 years')::date)
union all select 'POLICY-EXPIRY',lot,'Expired stock requires review','docs/compliance.md' from stock_view where expires_on<current_date and quantity>0
union all select 'POLICY-QUARANTINE',lot,'Quarantined stock cannot be dispatched','docs/compliance.md' from stock_view where status='quarantine' and quantity>0;
