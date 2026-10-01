import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {fields,tables} from './lib/domain.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
export const reads={
 customers:'select name,currency,storage_cents,handling_cents from customers order by name',
 products:'select p.id,c.name as customer,p.code,p.name,p.active,p.base_unit,p.units_per_pallet from products p join customers c on c.id=p.customer_id order by c.name,p.code',
 stock:'select lot,customer,product,location,batch,quantity,reserved,free,status,expires_on from stock_view order by customer,lot',
 'inbound-receipts':"select s.customer,s.lot,m.quantity,s.base_unit,m.occurred_on,m.note from movements m join stock_view s on s.id=m.lot_id where kind='receipt' order by m.occurred_on desc",
 'pick-list':"select order_ref,customer,lot,product,quantity,due_on,destination,release_check from dispatch_view where status='open' order by due_on,order_ref",
 orders:'select * from dispatch_view order by due_on,order_ref',
 capacity:'select * from capacity_view order by location',
 'expiry-watch':"select customer,lot,quantity,status,expires_on from stock_view where quantity>0 and expires_on<=current_date+30 order by expires_on",
 'storage-run':'select customer,currency,pallets,storage_cents,amount_cents from storage_view order by customer',
 charges:'select r.name as run,r.week_ending,r.status,c.name as customer,l.currency,l.kind,l.units,l.rate_cents,l.amount_cents from charge_lines l join charge_runs r on r.id=l.run_id join customers c on c.id=l.customer_id order by r.week_ending,c.name,l.kind',
 attention:'select * from attention_view order by issue,reference',
 compliance:'select * from compliance_view order by rule,reference',
 incidents:'select name,occurred_on,notifiable,notified_on,retain_until,note from incidents order by occurred_on desc',
 notes:'select c.name as customer,n.recorded_on,n.note from notes n join customers c on c.id=n.customer_id order by n.recorded_on desc',
 movements:'select s.customer,s.lot,m.kind,m.quantity,m.occurred_on,m.note from movements m join stock_view s on s.id=m.lot_id order by m.created_at',
 'customer-review':`select c.name as customer,c.currency,(select count(*) from orders o where o.customer_id=c.id and status='open' and due_on<current_date) as overdue_orders,(select coalesce(sum(pallets),0) from stock_view s where s.customer_id=c.id) as pallets,(select coalesce(sum(quantity),0) from stock_view s where s.customer_id=c.id and status='quarantine') as held_units,(select max(recorded_on) from notes n where n.customer_id=c.id) as last_note from customers c order by c.name`
};
const flag=(args,k)=>args.find(a=>a.startsWith('--'+k+'='))?.slice(k.length+3);
function required(v,label){if(v===undefined||v===null||String(v).trim()==='')throw Error('Required: '+label);return v;}
function integer(v,label,allowNegative=false){required(v,label);const n=Number(v);if(!Number.isSafeInteger(n)||(!allowNegative&&n<=0)||n===0)throw Error('Expected '+(allowNegative?'nonzero':'positive')+' integer: '+label);return n;}
function date(v){required(v,'date');if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error('Invalid date: '+v);return v;}
export async function resolve(db,t,q){
 if(!tables.includes(t))throw Error('Unknown record type');required(q,t+' name or id');
 const column=t==='products'?'code':'name';
 let rows=await db.query(`select id,${column} as name from ${t} where id::text=$1 or lower(${column})=lower($1)`,[q]);
 if(!rows.length)rows=await db.query(`select id,${column} as name from ${t} where starts_with(id::text,lower($1)) or position(lower($1) in lower(${column}))>0 order by ${column}`,[q]);
 if(rows.length!==1)throw Error(rows.length?'Ambiguous '+t+': '+JSON.stringify(rows):'Not found: '+q);
 return rows[0].id;
}
async function tx(db,fn){await db.exec('begin');try{const result=await fn();await db.exec('commit');return result;}catch(e){await db.exec('rollback');throw e;}}
async function one(db,t,id,lock=false){return (await db.query(`select * from ${t} where id=$1${lock?' for update':''}`,[id]))[0];}
function writeFile(dir,name,value){const base=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,dir);fs.mkdirSync(base,{recursive:true});const file=path.join(base,name);fs.writeFileSync(file,value);return file;}
export function format(rows){if(!Array.isArray(rows))return JSON.stringify(rows,null,2);if(!rows.length)return 'No records.';const keys=Object.keys(rows[0]);const str=v=>v instanceof Date?v.toISOString():v==null?'':typeof v==='object'?JSON.stringify(v):String(v);const widths=keys.map(k=>Math.max(k.length,...rows.map(r=>str(r[k]).length)));return [keys.map((k,i)=>k.padEnd(widths[i])).join('  '),widths.map(w=>'-'.repeat(w)).join('  '),...rows.map(r=>keys.map((k,i)=>str(r[k]).padEnd(widths[i])).join('  '))].join('\n');}
const syntax=[...Object.keys(reads),'customer <name>','add <customers|products|locations|incidents> --data=file.json','set <customers|products|locations|incidents> <id/name> --data=file.json','receive --product=code --location=name --lot=name --batch=ref --quantity=N [--expires=YYYY-MM-DD] [--status=quarantine]','allocate --customer=name --lot=name --quantity=N --order=ref --due=YYYY-MM-DD --destination=place','dispatch <order> --by=name','cancel <order>','adjust <lot> --quantity=signed-integer --reason=text','hold <lot> --reason=text','release <lot> --reason=text','bill-week --week=YYYY-MM-DD','approve-charges <run> --by=name','log --customer=name --note=text','draft-statement <customer>','import cartoncloud <products.csv> [--dry-run]','export','help'];
export async function run(db,args){
 const [cmd,...rest]=args;const f=k=>flag(rest,k);
 if(cmd==='help'||!cmd)return syntax.map(command=>({command}));
 if(reads[cmd])return db.query(reads[cmd]);
 if(cmd==='customer'){const id=await resolve(db,'customers',rest[0]);return {customer:await one(db,'customers',id),stock:await db.query('select * from stock_view where customer_id=$1',[id]),orders:await db.query('select * from orders where customer_id=$1',[id])};}
 if(cmd==='add'||cmd==='set'){
  const t=rest[0];if(!fields[t])throw Error('Unsupported record type');
  const data=JSON.parse(fs.readFileSync(required(f('data'),'--data'),'utf8'));
  if(!data||Array.isArray(data)||typeof data!=='object')throw Error('Expected object');
  const keys=Object.keys(data);if(!keys.length||keys.some(k=>!fields[t].includes(k)))throw Error('Unsupported or empty fields');
  for(const k of keys){if(k.endsWith('_on')||k==='retain_until'){if(data[k]!==null)date(data[k]);}if(k==='customer_id')data[k]=await resolve(db,'customers',data[k]);}
  if(cmd==='add')return db.query(`insert into ${t} (${keys.join(',')}) values (${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,keys.map(k=>data[k]));
  const id=await resolve(db,t,rest[1]);
  if(t==='products'&&('customer_id' in data||'units_per_pallet' in data||'base_unit' in data)&&(await db.query('select id from lots where product_id=$1 limit 1',[id])).length)throw Error('Stock exists: ownership and unit changes require a reviewed migration');
  return db.query(`update ${t} set ${keys.map((k,i)=>k+'=$'+(i+1)).join(',')} where id=$${keys.length+1} returning *`,[...keys.map(k=>data[k]),id]);
 }
 if(cmd==='receive')return tx(db,async()=>{
  const product=await resolve(db,'products',f('product')),location=await resolve(db,'locations',f('location'));const qty=integer(f('quantity'),'quantity');
  const p=await one(db,'products',product,true);if(!p.active)throw Error('Inactive product');
  const expiry=f('expires')?date(f('expires')):null,status=f('status')||'available';
  const lot=(await db.query('insert into lots(product_id,location_id,name,batch,quantity,expires_on,status) values($1,$2,$3,$4,$5,$6,$7) returning *',[product,location,required(f('lot'),'lot'),required(f('batch'),'batch'),qty,expiry,status]))[0];
  await db.query("insert into movements(lot_id,kind,quantity,note) values($1,'receipt',$2,$3)",[lot.id,qty,'Received batch '+f('batch')]);return [lot];
 });
 if(cmd==='allocate')return tx(db,async()=>{
  const customer=await resolve(db,'customers',f('customer')),id=await resolve(db,'lots',f('lot'));const lot=await one(db,'lots',id,true),qty=integer(f('quantity'),'quantity');
  const p=await one(db,'products',lot.product_id);if(p.customer_id!==customer)throw Error('Customer does not own this stock');if(!p.active)throw Error('Inactive product');
  const s=(await db.query('select *,expires_on<current_date as expired from stock_view where id=$1',[id]))[0];
  if(s.status!=='available'||s.expired||s.free<qty)throw Error('Allocation held: quarantine, expiry or insufficient free stock');
  return db.query('insert into orders(name,customer_id,lot_id,quantity,due_on,destination) values($1,$2,$3,$4,$5,$6) returning *',[required(f('order'),'order'),customer,id,qty,date(f('due')),required(f('destination'),'destination')]);
 });
 if(['dispatch','cancel'].includes(cmd))return tx(db,async()=>{
  const id=await resolve(db,'orders',rest[0]),o=await one(db,'orders',id,true);if(o.status!=='open')throw Error('Order is not open');
  if(cmd==='cancel')return db.query("update orders set status='cancelled' where id=$1 returning *",[id]);
  const who=required(f('by'),'--by');await one(db,'lots',o.lot_id,true);
  const check=(await db.query('select * from dispatch_view where id=$1',[id]))[0];if(check.release_check!=='Ready for supervisor')throw Error('Dispatch held: '+check.release_check);
  await db.query('update lots set quantity=quantity-$1 where id=$2',[o.quantity,o.lot_id]);
  await db.query("insert into movements(lot_id,order_id,kind,quantity,note) values($1,$2,'dispatch',$3,$4)",[o.lot_id,id,-o.quantity,'Released by '+who]);
  return db.query("update orders set status='dispatched',dispatched_on=current_date where id=$1 returning *",[id]);
 });
 if(['adjust','hold','release'].includes(cmd))return tx(db,async()=>{
  const id=await resolve(db,'lots',rest[0]),lot=await one(db,'lots',id,true),reason=required(f('reason'),'reason');
  if(cmd==='adjust'){
   const qty=integer(f('quantity'),'quantity',true),s=(await db.query('select free from stock_view where id=$1',[id]))[0];if(s.free+qty<0)throw Error('Adjustment would remove reserved stock');
   await db.query('update lots set quantity=quantity+$1 where id=$2',[qty,id]);await db.query("insert into movements(lot_id,kind,quantity,note) values($1,'adjustment',$2,$3)",[id,qty,reason]);
  }else{
   await db.query('update lots set status=$1 where id=$2',[cmd==='hold'?'quarantine':'available',id]);
   const p=await one(db,'products',lot.product_id);await db.query('insert into notes(customer_id,note) values($1,$2)',[p.customer_id,cmd+' '+lot.name+': '+reason]);
  }return db.query('select * from stock_view where id=$1',[id]);
 });
 if(cmd==='bill-week')return tx(db,async()=>{
  await db.exec('lock table charge_runs in share row exclusive mode');
  const week=date(f('week'));const today=(await db.query('select current_date::text as today'))[0].today;
  if(week!==today)throw Error('Storage snapshot must be for today; historical balances are not reconstructed');
  const existing=await db.query('select * from charge_runs where week_ending=$1',[week]);if(existing.length)return existing;
  const overlap=await db.query('select name from charge_runs where week_ending between $1::date-6 and $1::date+6',[week]);if(overlap.length)throw Error('Overlapping weekly charge period');
  if((await db.query('select name from customers where storage_cents is null or handling_cents is null')).length)throw Error('Missing agreed rate: check attention');
  // Freeze the balance and movement set while calculating this draft.
  await db.exec('lock table lots, movements, customers in share mode');
  const r=(await db.query('insert into charge_runs(name,week_ending) values($1,$2) returning *',['WEEK-'+week,week]))[0];
  await db.query("insert into charge_lines(run_id,customer_id,currency,kind,units,rate_cents,amount_cents) select $1,customer_id,currency,'storage',pallets,storage_cents,amount_cents from storage_view",[r.id]);
  await db.query(`insert into charge_lines(run_id,customer_id,currency,kind,units,rate_cents,amount_cents)
   select $1,c.id,c.currency,'handling',coalesce(sum(abs(m.quantity)),0)::integer,c.handling_cents,(coalesce(sum(abs(m.quantity)),0)*c.handling_cents)::integer
   from customers c left join products p on p.customer_id=c.id left join lots l on l.product_id=p.id left join movements m on m.lot_id=l.id and m.kind in ('receipt','dispatch') and m.occurred_on between $2::date-6 and $2::date group by c.id`,[r.id,week]);return [r];
 });
 if(cmd==='approve-charges'){const id=await resolve(db,'charge_runs',rest[0]);const result=await db.query("update charge_runs set status='approved',approved_by=$1 where id=$2 and status='draft' returning *",[required(f('by'),'--by'),id]);if(!result.length)throw Error('Charge run is already approved');return result;}
 if(cmd==='log'){const id=await resolve(db,'customers',f('customer'));return db.query('insert into notes(customer_id,note) values($1,$2) returning *',[id,required(f('note'),'note')]);}
 if(cmd==='draft-statement'){
  const id=await resolve(db,'customers',rest[0]),c=await one(db,'customers',id);const rows=await db.query('select lot,product,quantity,status,expires_on from stock_view where customer_id=$1 order by lot',[id]);
  return [{file:writeFile('drafts',`statement-${id}.md`,`# Draft stock statement: ${c.name}\n\nFor operator review. Not sent.\n\n${format(rows)}\n`)}];
 }
 if(cmd==='import'){
  if(rest[0]!=='cartoncloud')throw Error('Supported import: cartoncloud');
  const rows=parseCsv(fs.readFileSync(required(rest[1],'CSV file'),'utf8'));if(!rows.length)throw Error('Empty product export');
  const seen=new Set();const products=rows.map((r,i)=>{
   for(const k of ['Customer','Code','Name','Active','Type','Base Measurement'])required(pick(r,k),'row '+(i+2)+' '+k);
   const active=pick(r,'Active').trim().toLowerCase();if(!['yes','no'].includes(active))throw Error('Active must be Yes or No');
   const customer=pick(r,'Customer').trim(),code=pick(r,'Code').trim(),key=customer.toLowerCase()+'\0'+code.toLowerCase();if(seen.has(key))throw Error('Duplicate customer/product in CSV');seen.add(key);
   return {customer,code,name:pick(r,'Name'),active:active==='yes',type:pick(r,'Type'),unit:pick(r,'Base Measurement'),source_id:pick(r,'Id')||null,source_record:r};
  });
  if(rest.includes('--dry-run'))return [{products:products.length,customers:new Set(products.map(p=>p.customer)).size,note:'Product master only. No stock balances, orders or rates imported.'}];
  return tx(db,async()=>{
   for(const p of products){
    let c=await db.query('select id from customers where lower(name)=lower($1)',[p.customer]);if(c.length>1)throw Error('Ambiguous customer');
    if(!c.length)c=await db.query('insert into customers(name) values($1) returning id',[p.customer]);
    const existing=await db.query('select id,base_unit from products where customer_id=$1 and code=$2',[c[0].id,p.code]);
    if(existing.length&&existing[0].base_unit!==p.unit&&(await db.query('select id from lots where product_id=$1 limit 1',[existing[0].id])).length)throw Error('Unit changed for product with stock: '+p.code);
    await db.query(`insert into products(customer_id,code,name,active,product_type,base_unit,source_id,source_record) values($1,$2,$3,$4,$5,$6,$7,$8)
      on conflict(customer_id,code) do update set name=excluded.name,active=excluded.active,product_type=excluded.product_type,base_unit=excluded.base_unit,source_id=excluded.source_id,source_record=excluded.source_record`,[c[0].id,p.code,p.name,p.active,p.type,p.unit,p.source_id,JSON.stringify(p.source_record)]);
   }return [{imported:products.length,note:'Product master loaded. Set pallet conversions and agreed rates before stock receipt and billing.'}];
  });
 }
 if(cmd==='export'){
  const data={exported_at:new Date().toISOString(),records:{}};await db.exec('begin isolation level repeatable read');try{for(const t of tables)data.records[t]=await db.query(`select * from ${t} order by id`);await db.exec('commit');}catch(e){await db.exec('rollback');throw e;}
  return [{file:writeFile('exports','warehouse-'+Date.now()+'.json',JSON.stringify(data,null,2)+'\n'),record_types:tables.length}];
 }
 throw Error('Unknown command: '+cmd+'. Run help.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{db=await getDb();const args=process.argv.slice(2),out=await run(db,args.filter(x=>x!=='--json'));console.log(args.includes('--json')?JSON.stringify(out,null,2):format(out));}catch(e){console.error(e.message);process.exitCode=1;}finally{await db?.close();}
}
