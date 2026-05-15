export const dynamic = 'force-dynamic';
import { createAdminClient } from '@/lib/supabase/server';
import { ProductAdminClient } from './product-client';

export default async function ProductAdminPage() {
  const admin = createAdminClient();
  const [{ data: flags }, { data: tests }] = await Promise.all([
    admin.from('feature_flags').select('*').order('key'),
    admin.from('ab_tests').select('*').order('created_at', { ascending: false }),
  ]);
  return <ProductAdminClient flags={flags || []} abTests={tests || []} />;
}
