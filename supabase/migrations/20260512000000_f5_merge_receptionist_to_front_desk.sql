-- F.5: Merge receptionist role into front_desk
-- receptionist and front_desk had identical permissions; consolidate to one role.
UPDATE user_profiles SET role = 'front_desk' WHERE role = 'receptionist';
