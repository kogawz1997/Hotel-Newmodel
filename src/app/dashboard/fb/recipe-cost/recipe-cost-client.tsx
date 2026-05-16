'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChefHat, Plus, AlertTriangle, TrendingUp, Package } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';

type MenuItem = { id: string; name: string; price: number; available: boolean };
type Ingredient = { id: string; name: string; unit: string; cost_per_unit: number; quantity: number; min_stock: number };
type RecipeItem = { id: string; menu_item_id: string; ingredient_id: string; quantity: number; fb_ingredients: { name: string; unit: string } | null };

export function RecipeCostClient({ hotelId, menuItems, ingredients: initIngredients, recipes }: {
  hotelId: string; menuItems: MenuItem[]; ingredients: Ingredient[]; recipes: RecipeItem[];
}) {
  const supabase = createClient();
  const [ingredients, setIngredients] = useState(initIngredients);
  const [selectedMenu, setSelectedMenu] = useState<string>(menuItems[0]?.id || '');
  const [showIngForm, setShowIngForm] = useState(false);
  const [ingForm, setIngForm] = useState({ name: '', unit: 'กรัม', costPerUnit: '', quantity: '100', minStock: '50' });
  const [saving, setSaving] = useState(false);

  const recipeByMenu = useMemo(() => {
    const map: Record<string, RecipeItem[]> = {};
    recipes.forEach(r => {
      if (!map[r.menu_item_id]) map[r.menu_item_id] = [];
      map[r.menu_item_id].push(r);
    });
    return map;
  }, [recipes]);

  const menuCosts = useMemo(() => {
    return menuItems.map(m => {
      const items = recipeByMenu[m.id] || [];
      const cost = items.reduce((s, r) => {
        const ing = ingredients.find(i => i.id === r.ingredient_id);
        return s + (ing ? ing.cost_per_unit * r.quantity : 0);
      }, 0);
      const margin = m.price > 0 ? ((m.price - cost) / m.price) * 100 : 0;
      return { ...m, cost, margin };
    });
  }, [menuItems, ingredients, recipeByMenu]);

  const lowStockIngredients = ingredients.filter(i => i.quantity <= i.min_stock);
  const selectedItem = menuItems.find(m => m.id === selectedMenu);
  const selectedCost = menuCosts.find(m => m.id === selectedMenu);
  const selectedRecipes = recipeByMenu[selectedMenu] || [];

  async function saveIngredient() {
    if (!ingForm.name || !ingForm.costPerUnit) { toast.error('กรอกชื่อและราคา'); return; }
    setSaving(true);
    const { data, error } = await supabase.from('fb_ingredients').insert({
      hotel_id: hotelId, name: ingForm.name, unit: ingForm.unit,
      cost_per_unit: Number(ingForm.costPerUnit),
      quantity: Number(ingForm.quantity),
      min_stock: Number(ingForm.minStock),
    }).select().single();
    setSaving(false);
    if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
    setIngredients(p => [...p, data].sort((a, b) => a.name.localeCompare(b.name)));
    setShowIngForm(false);
    setIngForm({ name: '', unit: 'กรัม', costPerUnit: '', quantity: '100', minStock: '50' });
    toast.success('เพิ่มวัตถุดิบแล้ว');
  }

  return (
    <div className="space-y-4">
      {lowStockIngredients.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p><strong>{lowStockIngredients.length}</strong> วัตถุดิบใกล้หมด: {lowStockIngredients.slice(0, 3).map(i => i.name).join(', ')}{lowStockIngredients.length > 3 ? '...' : ''}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" />เมนูและ Margin</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
              {menuCosts.map(m => (
                <button key={m.id} onClick={() => setSelectedMenu(m.id)}
                  className={cn('flex items-center justify-between w-full px-3 py-2.5 text-sm text-left transition-colors', selectedMenu === m.id ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/50')}>
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(m.price)}</p>
                  </div>
                  <Badge className={cn('border-0 text-2xs', m.margin >= 65 ? 'bg-emerald-100 text-emerald-700' : m.margin >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>
                    {m.cost > 0 ? `${Math.round(m.margin)}%` : '—'}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {selectedItem && selectedCost && (
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ChefHat className="h-4 w-4" />Recipe — {selectedItem.name}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-secondary/40 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">ราคาขาย</p>
                    <p className="font-bold text-sm">{formatCurrency(selectedCost.price)}</p>
                  </div>
                  <div className="bg-secondary/40 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">ต้นทุน</p>
                    <p className="font-bold text-sm text-red-600">{formatCurrency(selectedCost.cost)}</p>
                  </div>
                  <div className="bg-secondary/40 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Gross Margin</p>
                    <p className={cn('font-bold text-sm', selectedCost.margin >= 65 ? 'text-emerald-600' : selectedCost.margin >= 40 ? 'text-amber-600' : 'text-red-600')}>
                      {selectedCost.cost > 0 ? `${Math.round(selectedCost.margin)}%` : 'N/A'}
                    </p>
                  </div>
                </div>

                {selectedRecipes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">ยังไม่มี Recipe</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border bg-secondary/40">
                      {['วัตถุดิบ', 'ปริมาณ', 'ต้นทุน'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {selectedRecipes.map(r => {
                        const ing = ingredients.find(i => i.id === r.ingredient_id);
                        return (
                          <tr key={r.id} className="border-b border-border/50 last:border-0">
                            <td className="px-3 py-2">{r.fb_ingredients?.name || '—'}</td>
                            <td className="px-3 py-2 text-muted-foreground">{r.quantity} {r.fb_ingredients?.unit || ''}</td>
                            <td className="px-3 py-2">{ing ? formatCurrency(ing.cost_per_unit * r.quantity) : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4" />วัตถุดิบ ({ingredients.length})</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowIngForm(true)}>
                <Plus className="h-3.5 w-3.5" />เพิ่มวัตถุดิบ
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-secondary/40">
                  {['วัตถุดิบ', 'ราคา/หน่วย', 'คงเหลือ', 'ขั้นต่ำ'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {ingredients.slice(0, 20).map(i => (
                    <tr key={i.id} className={cn('border-b border-border/50 last:border-0', i.quantity <= i.min_stock ? 'bg-amber-50/50' : '')}>
                      <td className="px-4 py-2.5 font-medium">{i.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{formatCurrency(i.cost_per_unit)}/{i.unit}</td>
                      <td className="px-4 py-2.5">
                        <span className={i.quantity <= i.min_stock ? 'text-amber-600 font-medium' : ''}>{i.quantity} {i.unit}</span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{i.min_stock} {i.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showIngForm} onOpenChange={o => !o && setShowIngForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>เพิ่มวัตถุดิบ</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div style={{ gridColumn: 'span 2' }}>
              <label className="text-xs text-muted-foreground block mb-1">ชื่อวัตถุดิบ *</label>
              <input value={ingForm.name} onChange={e => setIngForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">หน่วย</label>
              <select value={ingForm.unit} onChange={e => setIngForm(p => ({ ...p, unit: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {['กรัม', 'กิโลกรัม', 'มิลลิลิตร', 'ลิตร', 'ชิ้น', 'กล่อง', 'ถุง'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">ราคาต่อหน่วย (฿) *</label>
              <input type="number" step="0.01" value={ingForm.costPerUnit} onChange={e => setIngForm(p => ({ ...p, costPerUnit: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">จำนวนคงเหลือ</label>
              <input type="number" value={ingForm.quantity} onChange={e => setIngForm(p => ({ ...p, quantity: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">ขั้นต่ำ (alert)</label>
              <input type="number" value={ingForm.minStock} onChange={e => setIngForm(p => ({ ...p, minStock: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIngForm(false)}>ยกเลิก</Button>
            <Button onClick={saveIngredient} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
