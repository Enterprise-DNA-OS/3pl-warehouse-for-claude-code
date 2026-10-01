insert into customers(id,name,storage_cents,handling_cents) values
('10000000-0000-0000-0000-000000000001','Harbour Pantry',450,35),
('10000000-0000-0000-0000-000000000002','Southern Homewares',600,50),
('10000000-0000-0000-0000-000000000003','Coastal Imports',null,null) on conflict do nothing;
insert into products(id,customer_id,code,name,units_per_pallet) values
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','TEA-12','Tea cartons',48),
('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','JAR-06','Glass jars',24) on conflict do nothing;
insert into locations(id,name,capacity_pallets) values
('30000000-0000-0000-0000-000000000001','A-01',20),('30000000-0000-0000-0000-000000000002','HOLD-01',4) on conflict do nothing;
insert into lots(id,product_id,location_id,name,batch,received_on,expires_on,status,quantity) values
('40000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','TEA-A','TA-01',current_date-70,current_date+15,'available',144),
('40000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002','TEA-HOLD','TA-02',current_date-10,current_date+90,'quarantine',48),
('40000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','JAR-A','JA-01',current_date-8,null,'available',72) on conflict do nothing;
insert into movements(id,lot_id,kind,quantity,occurred_on,note) select id,id,'receipt',quantity,received_on,'Demo opening receipt' from lots where name in ('TEA-A','TEA-HOLD','JAR-A') on conflict do nothing;
insert into orders(id,name,customer_id,lot_id,quantity,due_on,destination) values
('50000000-0000-0000-0000-000000000001','SO-101','10000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001',48,current_date-2,'Tauranga retail depot'),
('50000000-0000-0000-0000-000000000002','SO-102','10000000-0000-0000-0000-000000000002','40000000-0000-0000-0000-000000000003',24,current_date+1,'Hamilton shop') on conflict do nothing;
insert into incidents(id,name,occurred_on,notifiable,notified_on,retain_until,note) values
('60000000-0000-0000-0000-000000000001','INC-01',current_date-1,true,null,null,'Fictional example: supervisor has classified rack collapse as notifiable'),
('60000000-0000-0000-0000-000000000002','INC-02',current_date-30,true,current_date-30,current_date+365,'Fictional example: retention date entered too early') on conflict do nothing;
insert into notes(id,customer_id,note) values ('70000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Customer asked for expiry review before next dispatch') on conflict do nothing;
