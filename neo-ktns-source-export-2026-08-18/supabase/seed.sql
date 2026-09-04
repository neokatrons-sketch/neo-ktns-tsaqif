insert into public.products (id, slug, name_id, name_en, description_id, material, weight_gsm_min, weight_gsm_max, production_days_min)
values ('00000000-0000-4000-8000-000000000001', 'premium-polo', 'Polo Lengan Pendek Premium', 'Premium Short Sleeve Polo', 'Polo custom premium untuk siswa, komunitas, dan organisasi.', 'Premium Piqué 24s', 200, 220, 15)
on conflict (id) do update set name_id = excluded.name_id, name_en = excluded.name_en, material = excluded.material;

insert into public.product_colors (id, product_id, slug, name_id, name_en, hex_color, sort_order) values
('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000001','white','Putih','White','#F4F2EC',1),
('00000000-0000-4000-8000-000000000012','00000000-0000-4000-8000-000000000001','black','Hitam','Black','#151617',2),
('00000000-0000-4000-8000-000000000013','00000000-0000-4000-8000-000000000001','maroon','Maroon','Maroon','#641F2A',3),
('00000000-0000-4000-8000-000000000014','00000000-0000-4000-8000-000000000001','chili-red','Merah Cabe','Chili Red','#B12C2B',4),
('00000000-0000-4000-8000-000000000015','00000000-0000-4000-8000-000000000001','navy','Navy','Navy','#152A43',5),
('00000000-0000-4000-8000-000000000016','00000000-0000-4000-8000-000000000001','army-green','Hijau Army','Army Green','#4C5742',6),
('00000000-0000-4000-8000-000000000017','00000000-0000-4000-8000-000000000001','dark-gray','Abu Tua','Dark Gray','#4C5052',7)
on conflict (id) do nothing;

insert into public.product_sizes (id, product_id, code, length_cm, chest_circumference_cm, is_public, sort_order) values
('00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000001','S',66,92,true,1),
('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000001','M',69,98,true,2),
('00000000-0000-4000-8000-000000000103','00000000-0000-4000-8000-000000000001','L',72,104,true,3),
('00000000-0000-4000-8000-000000000104','00000000-0000-4000-8000-000000000001','XL',75,110,true,4),
('00000000-0000-4000-8000-000000000105','00000000-0000-4000-8000-000000000001','XXL',null,null,false,5)
on conflict (id) do nothing;

insert into public.embroidery_packages (id, code, name_id, name_en, description_id, small_point_count, includes_back, allowed_placement_sets, sort_order) values
('00000000-0000-4000-8000-000000000201','one-point','1 Titik','1 Point','Satu posisi dada atau lengan.',1,false,'[["left-chest"],["right-chest"],["left-sleeve"],["right-sleeve"]]',1),
('00000000-0000-4000-8000-000000000202','one-point-back','1 Titik + Belakang','1 Point + Back','Satu posisi kecil dan punggung.',1,true,'[["left-chest","back"],["right-chest","back"],["left-sleeve","back"],["right-sleeve","back"]]',2),
('00000000-0000-4000-8000-000000000203','two-points','2 Titik','2 Points','Satu lengan dan satu dada berlawanan.',2,false,'[["left-sleeve","right-chest"],["right-sleeve","left-chest"]]',3),
('00000000-0000-4000-8000-000000000204','two-points-back','2 Titik + Belakang','2 Points + Back','Dada, lengan, dan punggung.',2,true,'[["left-sleeve","right-chest","back"],["right-sleeve","left-chest","back"]]',4),
('00000000-0000-4000-8000-000000000205','three-points','3 Titik','3 Points','Satu lengan dan dua sisi dada.',3,false,'[["left-sleeve","left-chest","right-chest"],["right-sleeve","left-chest","right-chest"]]',5),
('00000000-0000-4000-8000-000000000206','three-points-back','3 Titik + Belakang','3 Points + Back','Tiga posisi kecil dan punggung.',3,true,'[["left-sleeve","left-chest","right-chest","back"],["right-sleeve","left-chest","right-chest","back"]]',6),
('00000000-0000-4000-8000-000000000207','four-points','4 Titik','4 Points','Kedua lengan dan kedua sisi dada.',4,false,'[["left-sleeve","right-sleeve","left-chest","right-chest"]]',7),
('00000000-0000-4000-8000-000000000208','five-points-full','5 Titik (Full)','5 Points Full','Semua posisi bordir.',4,true,'[["left-sleeve","right-sleeve","left-chest","right-chest","back"]]',8),
('00000000-0000-4000-8000-000000000209','back-only','Belakang Aja','Back Only','Bordir punggung saja.',0,true,'[["back"]]',9)
on conflict (id) do nothing;

with costs(package_code, size_code, base_cost) as (values
('one-point','S',74600),('one-point','M',89800),('one-point','L',89800),('one-point','XL',89800),('one-point','XXL',89900),
('one-point-back','S',118800),('one-point-back','M',118800),('one-point-back','L',118800),('one-point-back','XL',118800),('one-point-back','XXL',123900),
('two-points','S',98400),('two-points','M',98400),('two-points','L',98400),('two-points','XL',98400),('two-points','XXL',103400),
('two-points-back','S',127300),('two-points-back','M',127300),('two-points-back','L',127300),('two-points-back','XL',127300),('two-points-back','XXL',132400),
('three-points','S',106800),('three-points','M',106800),('three-points','L',106800),('three-points','XL',106800),('three-points','XXL',111800),
('three-points-back','S',118800),('three-points-back','M',118800),('three-points-back','L',118800),('three-points-back','XL',118800),('three-points-back','XXL',123900),
('four-points','S',110300),('four-points','M',110300),('four-points','L',110300),('four-points','XL',110300),('four-points','XXL',115400),
('five-points-full','S',135800),('five-points-full','M',135800),('five-points-full','L',135800),('five-points-full','XL',135800),('five-points-full','XXL',140900),
('back-only','S',110300),('back-only','M',110300),('back-only','L',110300),('back-only','XL',110300),('back-only','XXL',115400)
)
insert into public.embroidery_price_rules (embroidery_package_id, product_size_id, base_cost)
select ep.id, ps.id, costs.base_cost from costs
join public.embroidery_packages ep on ep.code = costs.package_code
join public.product_sizes ps on ps.code = costs.size_code and ps.product_id = '00000000-0000-4000-8000-000000000001'
on conflict (embroidery_package_id, product_size_id) do update set base_cost = excluded.base_cost;

insert into public.settings (key, value, description, is_public) values
('default_margin','50000','Margin default per item',false),
('psychological_pricing','true','Round selling prices to an ending of 9.900',false),
('whatsapp_number','"6285725935431"','Admin WhatsApp number',true),
('minimum_dp_percentage','50','Minimum down payment percentage',true),
('payment_deadline_hours','24','Payment deadline after checkout',true),
('production_days_min','15','Minimum production time',true),
('payment_info','{"qris":null,"cash":true,"confirm_with_admin":true}','Current payment configuration',false)
on conflict (key) do update set value = excluded.value, description = excluded.description, is_public = excluded.is_public;

-- After creating each Supabase Auth user, grant access explicitly:
-- insert into public.admin_users (user_id, email, display_name, role) values ('<auth-user-id>', 'admin@example.com', 'Admin Name', 'admin');
