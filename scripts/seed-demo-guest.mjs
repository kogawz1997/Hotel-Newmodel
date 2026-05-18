/**
 * สร้างบัญชีทดสอบ Guest Portal โดยไม่ต้องยืนยันอีเมล
 *
 * ใช้งาน:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   node scripts/seed-demo-guest.mjs
 *
 * หรือสร้าง .env.local ก่อนแล้วรัน:
 *   node -r dotenv/config scripts/seed-demo-guest.mjs dotenv_config_path=.env.local
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ ต้องตั้งค่า SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY');
  console.error('   เช่น: SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/seed-demo-guest.mjs');
  process.exit(1);
}

const DEMO_ACCOUNTS = [
  {
    email: 'demo@maitri.co',
    password: 'Demo2026!',
    firstName: 'Demo',
    lastName: 'Guest',
    phone: '0812345678',
  },
  {
    email: 'test.guest@maitri.co',
    password: 'TestGuest2026!',
    firstName: 'ทดสอบ',
    lastName: 'ระบบ',
    phone: '0898765432',
  },
];

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'apikey': SERVICE_ROLE_KEY,
};

async function createDemoAccount({ email, password, firstName, lastName, phone }) {
  // 1. สร้าง auth user (auto-confirm, ไม่ต้องยืนยันอีเมล)
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `${firstName} ${lastName}`.trim(),
        user_type: 'guest',
      },
    }),
  });

  const authData = await authRes.json();

  if (!authRes.ok) {
    if (authData.message?.includes('already been registered') || authData.code === 'email_exists') {
      console.log(`⚠️  ${email} — มีบัญชีอยู่แล้ว ข้ามไป`);
      return null;
    }
    throw new Error(`Auth error: ${JSON.stringify(authData)}`);
  }

  const userId = authData.id;

  // 2. upsert guest_accounts row
  const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/guest_accounts`, {
    method: 'POST',
    headers: {
      ...headers,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName || null,
      phone: phone || null,
      marketing_consent: false,
    }),
  });

  if (!profileRes.ok) {
    const err = await profileRes.text();
    throw new Error(`Profile error: ${err}`);
  }

  return userId;
}

async function main() {
  console.log(`🔗 Supabase: ${SUPABASE_URL}`);
  console.log('');

  for (const account of DEMO_ACCOUNTS) {
    process.stdout.write(`👤 สร้างบัญชี ${account.email} ... `);
    try {
      const id = await createDemoAccount(account);
      if (id) {
        console.log(`✅ สำเร็จ (id: ${id})`);
        console.log(`   📧 Email   : ${account.email}`);
        console.log(`   🔑 Password: ${account.password}`);
        console.log('');
      }
    } catch (err) {
      console.log(`❌ ล้มเหลว`);
      console.error(`   ${err.message}`);
      console.log('');
    }
  }

  console.log('เสร็จแล้ว! ใช้ข้อมูลด้านบนเข้าสู่ระบบที่ /portal/login');
}

main();
