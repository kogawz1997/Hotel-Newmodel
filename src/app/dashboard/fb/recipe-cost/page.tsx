export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { RecipeCostClient } from './recipe-cost-client';

export default async function RecipeCostPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager', 'fnb_manager'] as any[]);
  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const [menuRes, ingredientsRes, recipeRes] = await Promise.all([
    supabase.from('fb_menu_items').select('id, name, price, available').eq('hotel_id', hotel.id).order('name'),
    supabase.from('fb_ingredients').select('*').eq('hotel_id', hotel.id).order('name'),
    supabase.from('fb_recipes').select('*, fb_ingredients(name, unit)').eq('hotel_id', hotel.id),
  ]);

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <TopBar title="Recipe Costing & Inventory" description="ต้นทุนวัตถุดิบและ Gross Margin ต่อเมนู" />
      <RecipeCostClient hotelId={hotel.id} menuItems={menuRes.data || []} ingredients={ingredientsRes.data || []} recipes={recipeRes.data || []} />
    </div>
  );
}
