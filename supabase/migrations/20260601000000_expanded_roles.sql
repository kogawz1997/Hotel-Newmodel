-- Expand role constraint to all 35 hotel + platform roles
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_role_check CHECK (
    role IN (
      -- Management
      'hotel_owner', 'owner', 'general_manager', 'operations_manager',
      'admin', 'manager',
      -- Front of House
      'front_office_manager', 'front_desk', 'receptionist',
      'reservation_agent', 'night_auditor',
      -- Communications
      'chat_admin', 'guest_relations',
      -- Housekeeping
      'housekeeping_manager', 'housekeeping', 'housekeeper', 'room_inspector',
      -- Engineering
      'maintenance_manager', 'maintenance', 'technician', 'engineering',
      -- F&B
      'fnb_manager', 'kitchen_staff', 'room_service_staff', 'restaurant_staff',
      -- Guest Services
      'concierge', 'bellboy', 'transport_driver',
      -- Revenue & Marketing
      'revenue_manager', 'marketing_staff', 'sales',
      -- Back of House
      'accounting_manager', 'accounting', 'accounting_staff',
      'purchasing_manager', 'purchasing_staff', 'purchasing',
      -- HR
      'hr_manager', 'hr_staff',
      -- Spa
      'spa_manager', 'spa_staff',
      -- Security
      'security_manager', 'security', 'security_staff',
      -- IT
      'it_admin', 'it_support',
      -- Platform (SaaS)
      'platform_owner', 'billing_admin', 'support_admin',
      'platform_ops', 'security_admin', 'sales_admin',
      'product_admin', 'dev_admin',
      -- Generic
      'dept_head', 'shift_supervisor', 'staff', 'viewer'
    )
  );
