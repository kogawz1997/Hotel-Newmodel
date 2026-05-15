CREATE TABLE IF NOT EXISTS hotel_roles (
  role TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  is_platform BOOLEAN DEFAULT false
);
INSERT INTO hotel_roles (role, label, category) VALUES
  ('hotel_owner','เจ้าของโรงแรม','management'),
  ('general_manager','General Manager','management'),
  ('operations_manager','Operations Manager','management'),
  ('front_office_manager','Front Office Manager','front_office'),
  ('front_desk','Receptionist','front_office'),
  ('reservation_agent','Reservation Agent','front_office'),
  ('night_auditor','Night Auditor','front_office'),
  ('chat_admin','Chat Admin','communications'),
  ('guest_relations','Guest Relations','communications'),
  ('housekeeping_manager','Housekeeping Manager','housekeeping'),
  ('housekeeper','Housekeeper','housekeeping'),
  ('room_inspector','Room Inspector','housekeeping'),
  ('maintenance_manager','Maintenance Manager','engineering'),
  ('technician','Technician','engineering'),
  ('fnb_manager','F&B Manager','fnb'),
  ('kitchen_staff','Kitchen Staff','fnb'),
  ('room_service_staff','Room Service Staff','fnb'),
  ('restaurant_staff','Restaurant Staff','fnb'),
  ('concierge','Concierge','guest_services'),
  ('bellboy','Bellboy','guest_services'),
  ('transport_driver','Transport Driver','guest_services'),
  ('revenue_manager','Revenue Manager','revenue'),
  ('marketing_staff','Marketing Staff','revenue'),
  ('accounting_manager','Accounting Manager','accounting'),
  ('accounting_staff','Accounting Staff','accounting'),
  ('purchasing_manager','Purchasing Manager','purchasing'),
  ('purchasing_staff','Purchasing Staff','purchasing'),
  ('hr_manager','HR Manager','hr'),
  ('hr_staff','HR Staff','hr'),
  ('spa_manager','Spa Manager','spa'),
  ('spa_staff','Spa Staff','spa'),
  ('security_manager','Security Manager','security'),
  ('security_staff','Security Staff','security'),
  ('it_admin','IT Admin','it'),
  ('it_support','IT Support','it')
ON CONFLICT (role) DO NOTHING;

INSERT INTO hotel_roles (role, label, category, is_platform) VALUES
  ('platform_owner','Platform Owner','platform',true),
  ('billing_admin','Billing Admin','platform',true),
  ('support_admin','Support Admin','platform',true),
  ('platform_ops','Platform Ops','platform',true),
  ('security_admin','Security Admin','platform',true),
  ('sales_admin','Sales Admin','platform',true),
  ('product_admin','Product Admin','platform',true),
  ('dev_admin','Dev Admin','platform',true)
ON CONFLICT (role) DO NOTHING;

ALTER TABLE hotel_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY hotel_roles_read ON hotel_roles FOR SELECT USING (true);
