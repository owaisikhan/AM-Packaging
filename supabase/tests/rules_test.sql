-- Rule tests: each "expect" line says what should happen. Run with run.sh.
\set ON_ERROR_STOP 0
\pset footer off
insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000a','admin@am'), ('00000000-0000-0000-0000-00000000000b','worker@am');
insert into profiles (id, full_name, role) values ('00000000-0000-0000-0000-00000000000a','Ahmed Munir','admin'), ('00000000-0000-0000-0000-00000000000b','Ali Raza','worker');

-- as worker
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
\echo '--- worker creates item (expect RLS error)'
insert into items (kind, category_id, name, unit_id) select 'raw', (select id from item_categories where name='Paper Tube'), 'X', (select id from units where short_name='pcs');

-- as admin
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
\echo '--- admin creates items'
insert into brands (name) values ('Star Tubes'), ('Pak Box');
insert into microns (value) values (40);
insert into items (kind, category_id, name, code, unit_id, brand_id, micron_id, low_stock_level) values
 ('raw', (select id from item_categories where name='Jumbo Roll'), 'Jumbo Roll 40 micron Clear', 'JR-40C', (select id from units where short_name='m'), null, (select id from microns where value=40), 1000),
 ('raw', (select id from item_categories where name='Paper Tube'), 'Paper Tube 3 inch', 'PT-3', (select id from units where short_name='pcs'), (select id from brands where name='Star Tubes'), null, 500),
 ('raw', (select id from item_categories where name='Carton Box'), 'Carton Box 48mm', 'CB-48', (select id from units where short_name='pcs'), (select id from brands where name='Pak Box'), null, 20),
 ('raw', (select id from item_categories where name='Shrink Film'), 'Shrink Film', 'SF', (select id from units where short_name='kg'), null, null, 5);
insert into items (kind, category_id, name, code, unit_id, size_id, micron_id, color_id, rolls_per_carton, default_rate) values
 ('finished', (select id from item_categories where name='Tape Carton'), 'Tape 46mm x 72yd 40mic Clear', 'T-46-72-40C', (select id from units where short_name='ctn'), (select id from sizes where width_mm=46 and length_yd=72), (select id from microns where value=40), (select id from colors where name='Clear'), 72, 4800);
\echo '--- kind mismatch (expect error)'
insert into items (kind, category_id, name, unit_id) values ('finished', (select id from item_categories where name='Paper Tube'), 'bad', (select id from units where short_name='pcs'));

\echo '--- worker opening stock (expect admin error)'
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
select adjust_stock((select id from items where code='PT-3'), 1000, 'opening', '');
\echo '--- admin opening stock'
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
select adjust_stock(id, q, 'opening', 'Counted on day one') from (values ('JR-40C',50000),('PT-3',1000),('CB-48',30),('SF',10)) v(c,q) join items on code=c;
\echo '--- adjustment without reason (expect error)'
select adjust_stock((select id from items where code='SF'), -1, 'adjustment', '  ');

\echo '--- admin saves recipe'
select save_recipe((select id from items where code='T-46-72-40C'), jsonb_build_array(
  jsonb_build_object('raw_item_id',(select id from items where code='JR-40C'),'qty_per_unit',3950),
  jsonb_build_object('raw_item_id',(select id from items where code='PT-3'),'qty_per_unit',72),
  jsonb_build_object('raw_item_id',(select id from items where code='CB-48'),'qty_per_unit',1),
  jsonb_build_object('raw_item_id',(select id from items where code='SF'),'qty_per_unit',0.15)), 'Standard');

\echo '--- worker posts production of 10 cartons'
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
select post_production(jsonb_build_object('item_id',(select id from items where code='T-46-72-40C'),'qty_made',10,'materials', jsonb_build_array(
  jsonb_build_object('item_id',(select id from items where code='JR-40C'),'qty',39500),
  jsonb_build_object('item_id',(select id from items where code='PT-3'),'qty',725),
  jsonb_build_object('item_id',(select id from items where code='CB-48'),'qty',10),
  jsonb_build_object('item_id',(select id from items where code='SF'),'qty',1.5)))) is not null as posted;
\echo '--- worker posts production needing too many tubes (expect not enough stock)'
select post_production(jsonb_build_object('item_id',(select id from items where code='T-46-72-40C'),'qty_made',5,'materials', jsonb_build_array(
  jsonb_build_object('item_id',(select id from items where code='PT-3'),'qty',360))));
select code, on_hand, unit, stock_status from item_stock order by kind, code;

\echo '--- worker adds customer + supplier, purchase, sale'
insert into customers (name, opening_balance) values ('Faisalabad Traders (Pvt) Ltd', 25000);
insert into suppliers (name) values ('Lahore Films Co');
select post_purchase(jsonb_build_object('supplier_id',(select id from suppliers limit 1),'gst_rate',18,'discount',1000,
  'lines', jsonb_build_array(jsonb_build_object('item_id',(select id from items where code='CB-48'),'qty',100,'rate',85)),
  'payment', jsonb_build_object('amount',5000,'method','cash'))) is not null as purchased;
\echo '--- sale of raw item (expect kind error)'
select post_sale(jsonb_build_object('customer_id',(select id from customers limit 1),'lines', jsonb_build_array(jsonb_build_object('item_id',(select id from items where code='SF'),'qty',1,'rate',1))));
\echo '--- sale of 12 cartons with only 10 (expect not enough stock)'
select post_sale(jsonb_build_object('customer_id',(select id from customers limit 1),'lines', jsonb_build_array(jsonb_build_object('item_id',(select id from items where code='T-46-72-40C'),'qty',12,'rate',4800))));
\echo '--- sale of 8 cartons'
select post_sale(jsonb_build_object('customer_id',(select id from customers limit 1),'gst_rate',0,'lines', jsonb_build_array(jsonb_build_object('item_id',(select id from items where code='T-46-72-40C'),'qty',8,'rate',4800)),'payment',jsonb_build_object('amount',10000))) is not null as sold;
select invoice_no, subtotal, total from sales;
select purchase_no, subtotal, discount, gst_amount, total from purchases;
select name, billed, paid, balance from customer_balances;
select name, billed, paid, balance from supplier_balances;
\echo '--- worker updates sale (expect 0 rows), voids (expect admin error), reads log (expect 0)'
update sales set total = 1;
select total from sales;
select void_sale((select id from sales limit 1), 'mistake');
select count(*) as worker_sees_log from activity_log;
\echo '--- worker deletes stock movement (expect error or 0)'
delete from stock_movements;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
\echo '--- admin voids sale'
select void_sale((select id from sales limit 1), 'Customer cancelled');
select code, on_hand from item_stock where code='T-46-72-40C';
select name, balance from customer_balances;
\echo '--- admin edits activity log (expect error)'
update activity_log set summary='x';
select created_at::time(0), actor_name, action, module, summary from activity_log where actor_name <> 'System' order by id;
