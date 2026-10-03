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
\echo '--- worker purchase with a payment (expect: only an admin can record a payment)'
select post_purchase(jsonb_build_object('supplier_id',(select id from suppliers limit 1),'gst_rate',18,'discount',1000,
  'lines', jsonb_build_array(jsonb_build_object('item_id',(select id from items where code='CB-48'),'qty',100,'rate',85)),
  'payment', jsonb_build_object('amount',5000,'method','cash')));
\echo '--- worker purchase without a payment (expect purchased = t)'
select post_purchase(jsonb_build_object('supplier_id',(select id from suppliers limit 1),'gst_rate',18,'discount',1000,
  'lines', jsonb_build_array(jsonb_build_object('item_id',(select id from items where code='CB-48'),'qty',100,'rate',85)))) is not null as purchased;
\echo '--- worker reads supplier payments (expect 0) and records one (expect admin error)'
select count(*) as worker_sees_supplier_payments from supplier_payments;
select record_supplier_payment(jsonb_build_object('supplier_id',(select id from suppliers limit 1),'amount',100));
\echo '--- sale of raw item (expect kind error)'
select post_sale(jsonb_build_object('customer_id',(select id from customers limit 1),'lines', jsonb_build_array(jsonb_build_object('item_id',(select id from items where code='SF'),'qty',1,'rate',1))));
\echo '--- sale of 12 cartons with only 10 (expect not enough stock)'
select post_sale(jsonb_build_object('customer_id',(select id from customers limit 1),'lines', jsonb_build_array(jsonb_build_object('item_id',(select id from items where code='T-46-72-40C'),'qty',12,'rate',4800))));
\echo '--- sale of 8 cartons'
select post_sale(jsonb_build_object('customer_id',(select id from customers limit 1),'gst_rate',0,'lines', jsonb_build_array(jsonb_build_object('item_id',(select id from items where code='T-46-72-40C'),'qty',8,'rate',4800)),'payment',jsonb_build_object('amount',10000))) is not null as sold;
select invoice_no, subtotal, total from sales;
select purchase_no, subtotal, discount, gst_amount, total from purchases;
select name, billed, paid, balance from customer_balances;
\echo '--- (worker view of supplier_balances: paid reads 0 because payments are admin-only)'
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

\echo ''
\echo '=== Phase 2: supplier payments and ledger (as admin) ==='
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
insert into suppliers (name, opening_balance) values ('Karachi Core Mills', 2000);
\echo '--- admin records 5,000 against PUR-00001 (expect id)'
select record_supplier_payment(jsonb_build_object('supplier_id',(select id from suppliers where name='Lahore Films Co'),
  'purchase_id',(select id from purchases where purchase_no='PUR-00001'),'amount',5000,'method','bank','reference','TT-778')) is not null as paid;
\echo '--- payment linked to another supplier''s bill (expect: different supplier)'
select record_supplier_payment(jsonb_build_object('supplier_id',(select id from suppliers where name='Karachi Core Mills'),
  'purchase_id',(select id from purchases where purchase_no='PUR-00001'),'amount',10));
\echo '--- zero payment (expect: above zero)'
select record_supplier_payment(jsonb_build_object('supplier_id',(select id from suppliers where name='Karachi Core Mills'),'amount',0));
\echo '--- purchase list status (expect PUR-00001 partly, paid 5000 of 8850)'
select purchase_no, total, paid, payment_status, line_count from purchase_list order by purchase_no;
select * from purchase_totals();
\echo '--- ledger (expect last balance 3850 = supplier_balances)'
select entry_date, kind, ref, description, debit, credit, balance from supplier_ledger((select id from suppliers where name='Lahore Films Co'));
select balance as view_balance from supplier_balances where name='Lahore Films Co';
\echo '--- ledger from tomorrow (expect one brought forward row of 3850)'
select kind, description, debit, credit, balance from supplier_ledger((select id from suppliers where name='Lahore Films Co'), current_date + 1);
\echo '--- void payment without reason (expect reason error), then with reason (expect balance back to 8850)'
select void_supplier_payment((select id from supplier_payments where reference='TT-778'), ' ');
select void_supplier_payment((select id from supplier_payments where reference='TT-778'), 'Cheque bounced');
select void_supplier_payment((select id from supplier_payments where reference='TT-778'), 'again');
select balance from supplier_balances where name='Lahore Films Co';
select payment_status from purchase_list where purchase_no='PUR-00001';
\echo '--- worker opens the ledger (expect admin error)'
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
select * from supplier_ledger((select id from suppliers where name='Lahore Films Co'));
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
\echo '--- admin voids PUR-00001 (expect CB-48 back to 20 pcs, list status void)'
select void_purchase((select id from purchases where purchase_no='PUR-00001'), 'Entered twice');
select code, on_hand from item_stock where code='CB-48';
select payment_status from purchase_list where purchase_no='PUR-00001';
select summary from activity_log where module in ('payment','purchase') order by id;
\echo '--- supplier totals (expect 2 suppliers, payable 2000 = Karachi opening balance, 1 with balance)'
select * from supplier_totals();

\echo ''
\echo '=== Phase 3: production list, totals and voiding ==='
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
\echo '--- worker lists runs (expect PRD-00001, made 10 ctn by Ali Raza, 4 materials, 1 over recipe: tubes 725 vs 720)'
select run_no, item_name, qty_made, unit, created_by_name, materials, over_recipe, status from production_list;
\echo '--- duplicate material rows (expect: listed twice)'
select post_production(jsonb_build_object('item_id',(select id from items where code='T-46-72-40C'),'qty_made',1,'materials', jsonb_build_array(
  jsonb_build_object('item_id',(select id from items where code='PT-3'),'qty',72),
  jsonb_build_object('item_id',(select id from items where code='PT-3'),'qty',1))));
\echo '--- worker voids a run (expect admin error)'
select void_production((select id from production_runs where run_no='PRD-00001'), 'test');
select production_totals();
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
\echo '--- admin sells 6 cartons, then voids the run (expect: not enough stock of the tape, only 4 left)'
select post_sale(jsonb_build_object('customer_id',(select id from customers limit 1),'lines', jsonb_build_array(jsonb_build_object('item_id',(select id from items where code='T-46-72-40C'),'qty',6,'rate',4800)))) is not null as sold;
select void_production((select id from production_runs where run_no='PRD-00001'), 'Counted wrong');
\echo '--- admin records a second run of 2 and voids it (expect materials back: tubes 275 -> 131 -> 275)'
select post_production(jsonb_build_object('item_id',(select id from items where code='T-46-72-40C'),'qty_made',2,'materials', jsonb_build_array(
  jsonb_build_object('item_id',(select id from items where code='PT-3'),'qty',144)))) is not null as made;
select code, on_hand from item_stock where code='PT-3';
select void_production((select id from production_runs where run_no='PRD-00002'), 'Wrong product picked');
select code, on_hand from item_stock where code in ('PT-3','T-46-72-40C') order by code;
select run_no, status, void_reason from production_list order by run_no;

\echo ''
\echo '=== Phase 4: sales, customer payments and ledger ==='
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
\echo '--- admin makes 20 cartons so there is stock to sell'
select post_production(jsonb_build_object('item_id',(select id from items where code='T-46-72-40C'),'qty_made',20,'materials', jsonb_build_array(
  jsonb_build_object('item_id',(select id from items where code='PT-3'),'qty',144)))) is not null as made;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000b',false);
\echo '--- worker sells 5 cartons at 4800 with 10,000 cash at the counter (expect sold, paid 10000 recorded by Ali Raza)'
select post_sale(jsonb_build_object('customer_id',(select id from customers limit 1),'due_date', (current_date - 3)::text,
  'lines', jsonb_build_array(jsonb_build_object('item_id',(select id from items where code='T-46-72-40C'),'qty',5,'rate',4800)),
  'payment', jsonb_build_object('amount',10000,'method','cash'))) is not null as sold;
\echo '--- worker reads customer payments (expect 0), records a separate payment (expect admin error), opens a ledger (expect admin error)'
select count(*) as worker_sees_customer_payments from customer_payments;
select record_customer_payment(jsonb_build_object('customer_id',(select id from customers limit 1),'amount',100));
select * from customer_ledger((select id from customers limit 1));
\echo '--- worker inserts a payment directly (expect row-level security error)'
insert into customer_payments (customer_id, amount) values ((select id from customers limit 1), 1);
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000a',false);
select p.amount, pr.full_name as recorded_by from customer_payments p join profiles pr on pr.id = p.created_by where p.status = 'posted';
insert into customers (name) values ('Sialkot Exporters');
\echo '--- payment linked to another customer''s invoice (expect: different customer)'
select record_customer_payment(jsonb_build_object('customer_id',(select id from customers where name='Sialkot Exporters'),
  'sale_id',(select id from sales where invoice_no='INV-00003'),'amount',10));
\echo '--- admin records 4,000 against the invoice (expect id)'
select record_customer_payment(jsonb_build_object('customer_id',(select id from customers where name='Faisalabad Traders (Pvt) Ltd'),
  'sale_id',(select id from sales where invoice_no='INV-00003'),'amount',4000,'method','bank','reference','MCB-1')) is not null as received;
\echo '--- sale list (expect INV-00001 void; INV-00002 (phase 3 sale) unpaid; INV-00003 partly paid 14000 of 24000, overdue = t)'
select invoice_no, total, paid, payment_status, overdue from sale_list order by invoice_no;
select * from sale_totals();
\echo '--- ledger (expect: opening 25000, invoices 28800 and 24000, payments 10000 and 4000, last balance 63800 = customer_balances)'
select entry_date, kind, ref, description, debit, credit, balance from customer_ledger((select id from customers where name='Faisalabad Traders (Pvt) Ltd'));
select balance as view_balance from customer_balances where name='Faisalabad Traders (Pvt) Ltd';
select * from customer_totals();
\echo '--- void the 4,000 payment (expect balance 67800)'
select void_customer_payment((select id from customer_payments where reference='MCB-1'), 'Cheque returned');
select balance from customer_balances where name='Faisalabad Traders (Pvt) Ltd';
\echo '--- void the invoice (expect INV-00003: tape back up by 5, its cash payment void, status void; balance 25000 + 28800 = 53800)'
select on_hand as tape_before from item_stock where code='T-46-72-40C';
select void_sale((select id from sales where invoice_no='INV-00003'), 'Customer returned the goods');
select on_hand as tape_after from item_stock where code='T-46-72-40C';
select invoice_no, payment_status from sale_list order by invoice_no;
select status, void_reason from customer_payments order by created_at;
select balance from customer_balances where name='Faisalabad Traders (Pvt) Ltd';
