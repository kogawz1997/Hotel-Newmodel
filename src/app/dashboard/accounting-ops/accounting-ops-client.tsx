'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Check, XCircle, DollarSign, Receipt, FileText, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type CashierSession = {
  id: string;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at?: string;
  opening_balance: number;
  closing_balance?: number;
  discrepancy?: number;
  notes?: string;
  staff_id: string;
  user_profiles?: { full_name: string } | null;
};

type ExpenseItem = {
  id: string;
  title: string;
  amount: number;
  expense_date: string;
  category?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_by: string;
  user_profiles?: { full_name: string } | null;
};

type TaxInvoice = {
  id: string;
  buyer_name: string;
  buyer_tax_id?: string;
  buyer_address?: string;
  amount: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  issued_at: string;
};

type Tab = 'cashier' | 'expenses' | 'invoices';

// ── Shared UI ─────────────────────────────────────────────────────────────────

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium', className)}>
      {children}
    </span>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn('w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring', className)}
      {...props}
    />
  );
}

function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn('w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring', className)}
      {...props}
    >
      {children}
    </select>
  );
}

function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn('w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none', className)}
      {...props}
    />
  );
}

function fmt(n: number) {
  return '฿' + n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Status helpers ─────────────────────────────────────────────────────────────

const EXPENSE_STATUS: Record<string, { label: string; cls: string }> = {
  pending:  { label: 'รอดำเนินการ', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  approved: { label: 'อนุมัติแล้ว',  cls: 'bg-green-100 text-green-700 border-green-200' },
  rejected: { label: 'ปฏิเสธ',       cls: 'bg-red-100 text-red-700 border-red-200' },
};

const EXPENSE_CATEGORIES = [
  { value: 'อาหาร', label: 'อาหาร' },
  { value: 'อุปกรณ์', label: 'อุปกรณ์' },
  { value: 'ซ่อมบำรุง', label: 'ซ่อมบำรุง' },
  { value: 'ค่าเดินทาง', label: 'ค่าเดินทาง' },
  { value: 'อื่นๆ', label: 'อื่นๆ' },
];

// ── Main Component ────────────────────────────────────────────────────────────

export function AccountingOpsClient({
  profile,
}: {
  profile: { id: string; role: string };
}) {
  const [tab, setTab] = useState<Tab>('cashier');

  // Cashier state
  const [sessions, setSessions] = useState<CashierSession[]>([]);
  const [showOpenShift, setShowOpenShift] = useState(false);
  const [showCloseShift, setShowCloseShift] = useState<CashierSession | null>(null);
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  // Expense state
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [showNewExpense, setShowNewExpense] = useState(false);
  const [newExp, setNewExp] = useState({ title: '', amount: '', expense_date: '', category: 'อาหาร', notes: '' });

  // Tax invoice state
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [newInv, setNewInv] = useState({ buyer_name: '', buyer_tax_id: '', buyer_address: '', amount: '' });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isManager = ['owner', 'admin', 'manager', 'hotel_owner', 'general_manager', 'operations_manager', 'accounting_manager'].includes(profile.role);

  // ── Fetch helpers ──────────────────────────────────────────────────────────

  const loadSessions = useCallback(async () => {
    const res = await fetch('/api/accounting/cashier');
    if (res.ok) {
      const json = await res.json();
      setSessions(json.sessions || []);
    }
  }, []);

  const loadExpenses = useCallback(async () => {
    const res = await fetch('/api/accounting/expenses');
    if (res.ok) {
      const json = await res.json();
      setExpenses(json.expenses || []);
    }
  }, []);

  const loadInvoices = useCallback(async () => {
    const res = await fetch('/api/accounting/tax-invoices');
    if (res.ok) {
      const json = await res.json();
      setInvoices(json.invoices || []);
    }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);
  useEffect(() => { if (tab === 'expenses') loadExpenses(); }, [tab, loadExpenses]);
  useEffect(() => { if (tab === 'invoices') loadInvoices(); }, [tab, loadInvoices]);

  // ── Cashier actions ────────────────────────────────────────────────────────

  const handleOpenShift = async () => {
    setSaving(true);
    setError(null);
    const res = await fetch('/api/accounting/cashier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opening_balance: Number(openingBalance) || 0 }),
    });
    if (res.ok) {
      setOpeningBalance('');
      setShowOpenShift(false);
      await loadSessions();
    } else {
      const j = await res.json();
      setError(j.error || 'เกิดข้อผิดพลาด');
    }
    setSaving(false);
  };

  const handleCloseShift = async () => {
    if (!showCloseShift) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/accounting/cashier/${showCloseShift.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ closing_balance: Number(closingBalance) || 0, notes: closeNotes }),
    });
    if (res.ok) {
      setClosingBalance('');
      setCloseNotes('');
      setShowCloseShift(null);
      await loadSessions();
    } else {
      const j = await res.json();
      setError(j.error || 'เกิดข้อผิดพลาด');
    }
    setSaving(false);
  };

  // ── Expense actions ────────────────────────────────────────────────────────

  const handleCreateExpense = async () => {
    if (!newExp.title.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch('/api/accounting/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newExp.title,
        amount: Number(newExp.amount) || 0,
        expense_date: newExp.expense_date || new Date().toISOString().slice(0, 10),
        category: newExp.category,
        notes: newExp.notes,
      }),
    });
    if (res.ok) {
      setNewExp({ title: '', amount: '', expense_date: '', category: 'อาหาร', notes: '' });
      setShowNewExpense(false);
      await loadExpenses();
    } else {
      const j = await res.json();
      setError(j.error || 'เกิดข้อผิดพลาด');
    }
    setSaving(false);
  };

  const handleExpenseAction = async (id: string, action: 'approve' | 'reject') => {
    const res = await fetch(`/api/accounting/expenses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (res.ok) await loadExpenses();
  };

  // ── Invoice actions ────────────────────────────────────────────────────────

  const handleCreateInvoice = async () => {
    if (!newInv.buyer_name.trim()) return;
    setSaving(true);
    setError(null);
    const amount = Number(newInv.amount) || 0;
    const vat_amount = amount * 0.07;
    const res = await fetch('/api/accounting/tax-invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyer_name: newInv.buyer_name,
        buyer_tax_id: newInv.buyer_tax_id || undefined,
        buyer_address: newInv.buyer_address || undefined,
        amount,
        vat_rate: 7,
      }),
    });
    if (res.ok) {
      setNewInv({ buyer_name: '', buyer_tax_id: '', buyer_address: '', amount: '' });
      setShowNewInvoice(false);
      await loadInvoices();
    } else {
      const j = await res.json();
      setError(j.error || 'เกิดข้อผิดพลาด');
    }
    setSaving(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const TABS = [
    { id: 'cashier' as Tab, label: 'กะ Cashier', icon: DollarSign },
    { id: 'expenses' as Tab, label: 'ค่าใช้จ่าย', icon: Receipt },
    { id: 'invoices' as Tab, label: 'ใบกำกับภาษี', icon: FileText },
  ];

  return (
    <main className="space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Accounting Operations</h1>
          <p className="text-sm text-muted-foreground mt-1">จัดการกะ Cashier, ค่าใช้จ่าย และใบกำกับภาษี</p>
        </div>
        {tab === 'cashier' && (
          <button
            onClick={() => setShowOpenShift(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> เปิดกะใหม่
          </button>
        )}
        {tab === 'expenses' && (
          <button
            onClick={() => setShowNewExpense(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> เพิ่มค่าใช้จ่าย
          </button>
        )}
        {tab === 'invoices' && (
          <button
            onClick={() => setShowNewInvoice(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> สร้างใบกำกับ
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setTab(id); setError(null); }}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              tab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Cashier Tab ──────────────────────────────────────────────────────── */}
      {tab === 'cashier' && (
        <div className="space-y-3">
          {sessions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">ยังไม่มีกะ Cashier</p>
            </div>
          )}
          {sessions.map((s) => (
            <div key={s.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm">
                    {s.user_profiles?.full_name || 'พนักงาน'}
                  </p>
                  <Badge className={s.status === 'open' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}>
                    {s.status === 'open' ? 'เปิดอยู่' : 'ปิดแล้ว'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    เปิด {new Date(s.opened_at).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                  </span>
                  <span>เงินตั้งต้น: {fmt(s.opening_balance)}</span>
                  {s.closing_balance !== undefined && s.closing_balance !== null && (
                    <span>ปิดกะ: {fmt(s.closing_balance)}</span>
                  )}
                  {s.discrepancy !== undefined && s.discrepancy !== null && (
                    <span className={cn('font-medium', s.discrepancy !== 0 ? 'text-red-600' : 'text-green-600')}>
                      ผลต่าง: {fmt(s.discrepancy)}
                    </span>
                  )}
                </div>
                {s.notes && <p className="text-xs text-muted-foreground italic">{s.notes}</p>}
              </div>
              {s.status === 'open' && (
                <button
                  onClick={() => {
                    setShowCloseShift(s);
                    setClosingBalance('');
                    setCloseNotes('');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-secondary transition-colors shrink-0"
                >
                  ปิดกะ
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Expenses Tab ─────────────────────────────────────────────────────── */}
      {tab === 'expenses' && (
        <div className="space-y-3">
          {expenses.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">ยังไม่มีรายการค่าใช้จ่าย</p>
            </div>
          )}
          <div className="overflow-x-auto">
            {expenses.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 pr-3 font-medium text-muted-foreground">รายการ</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground text-right">จำนวน</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground">วันที่</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground">หมวด</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground">ผู้ยื่น</th>
                    <th className="pb-2 font-medium text-muted-foreground">สถานะ</th>
                    {isManager && <th className="pb-2 pl-3 font-medium text-muted-foreground">การดำเนินการ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {expenses.map((e) => (
                    <tr key={e.id}>
                      <td className="py-3 pr-3 font-medium">{e.title}</td>
                      <td className="py-3 pr-3 text-right tabular-nums">{fmt(e.amount)}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{e.expense_date}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{e.category || '-'}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{e.user_profiles?.full_name || '-'}</td>
                      <td className="py-3">
                        <Badge className={EXPENSE_STATUS[e.status]?.cls}>
                          {EXPENSE_STATUS[e.status]?.label}
                        </Badge>
                      </td>
                      {isManager && (
                        <td className="py-3 pl-3">
                          {e.status === 'pending' && (
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleExpenseAction(e.id, 'approve')} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium transition-colors">
                                <Check className="h-3.5 w-3.5" /> อนุมัติ
                              </button>
                              <button onClick={() => handleExpenseAction(e.id, 'reject')} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium transition-colors">
                                <XCircle className="h-3.5 w-3.5" /> ปฏิเสธ
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Tax Invoices Tab ─────────────────────────────────────────────────── */}
      {tab === 'invoices' && (
        <div className="space-y-3">
          {invoices.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">ยังไม่มีใบกำกับภาษี</p>
            </div>
          )}
          {invoices.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 pr-3 font-medium text-muted-foreground">ชื่อผู้ซื้อ</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground">เลขภาษี</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground text-right">ราคา</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground text-right">VAT (7%)</th>
                    <th className="pb-2 pr-3 font-medium text-muted-foreground text-right">รวม</th>
                    <th className="pb-2 font-medium text-muted-foreground">วันที่ออก</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-3 pr-3 font-medium">{inv.buyer_name}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{inv.buyer_tax_id || '-'}</td>
                      <td className="py-3 pr-3 text-right tabular-nums">{fmt(inv.amount)}</td>
                      <td className="py-3 pr-3 text-right tabular-nums">{fmt(inv.vat_amount)}</td>
                      <td className="py-3 pr-3 text-right tabular-nums font-medium">{fmt(inv.total_amount)}</td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(inv.issued_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Open Shift Modal ──────────────────────────────────────────────────── */}
      {showOpenShift && (
        <Modal title="เปิดกะใหม่" onClose={() => { setShowOpenShift(false); setError(null); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">เงินตั้งต้น (บาท)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="0.00"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { setShowOpenShift(false); setError(null); }} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition-colors">ยกเลิก</button>
              <button onClick={handleOpenShift} disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {saving ? 'กำลังบันทึก...' : 'เปิดกะ'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Close Shift Modal ─────────────────────────────────────────────────── */}
      {showCloseShift && (
        <Modal title="ปิดกะ" onClose={() => { setShowCloseShift(null); setError(null); }}>
          <div className="space-y-4">
            <div className="rounded-lg bg-secondary p-3 text-sm space-y-1">
              <p>พนักงาน: <span className="font-medium">{showCloseShift.user_profiles?.full_name || '-'}</span></p>
              <p>เงินตั้งต้น: <span className="font-medium">{fmt(showCloseShift.opening_balance)}</span></p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">ยอดเงินปิดกะ (บาท) *</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={closingBalance}
                onChange={(e) => setClosingBalance(e.target.value)}
                placeholder="0.00"
              />
              {closingBalance && (
                <p className={cn('text-xs mt-1.5 font-medium', Number(closingBalance) - showCloseShift.opening_balance !== 0 ? 'text-red-600' : 'text-green-600')}>
                  ผลต่าง: {fmt(Number(closingBalance) - showCloseShift.opening_balance)}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">หมายเหตุ</label>
              <Textarea value={closeNotes} onChange={(e) => setCloseNotes(e.target.value)} rows={2} placeholder="หมายเหตุเพิ่มเติม..." />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { setShowCloseShift(null); setError(null); }} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition-colors">ยกเลิก</button>
              <button onClick={handleCloseShift} disabled={saving || !closingBalance} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {saving ? 'กำลังบันทึก...' : 'ปิดกะ'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── New Expense Modal ─────────────────────────────────────────────────── */}
      {showNewExpense && (
        <Modal title="เพิ่มค่าใช้จ่าย" onClose={() => { setShowNewExpense(false); setError(null); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">ชื่อรายการ *</label>
              <Input value={newExp.title} onChange={(e) => setNewExp((r) => ({ ...r, title: e.target.value }))} placeholder="เช่น ซื้อน้ำดื่ม, ค่าซ่อมเครื่องปรับอากาศ" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">จำนวนเงิน (บาท) *</label>
                <Input type="number" min="0" step="0.01" value={newExp.amount} onChange={(e) => setNewExp((r) => ({ ...r, amount: e.target.value }))} placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">วันที่</label>
                <Input type="date" value={newExp.expense_date} onChange={(e) => setNewExp((r) => ({ ...r, expense_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">หมวดหมู่</label>
              <Select value={newExp.category} onChange={(e) => setNewExp((r) => ({ ...r, category: e.target.value }))}>
                {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">หมายเหตุ</label>
              <Textarea value={newExp.notes} onChange={(e) => setNewExp((r) => ({ ...r, notes: e.target.value }))} rows={2} placeholder="รายละเอียดเพิ่มเติม..." />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { setShowNewExpense(false); setError(null); }} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition-colors">ยกเลิก</button>
              <button onClick={handleCreateExpense} disabled={saving || !newExp.title.trim()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {saving ? 'กำลังบันทึก...' : 'เพิ่มรายการ'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── New Tax Invoice Modal ─────────────────────────────────────────────── */}
      {showNewInvoice && (
        <Modal title="สร้างใบกำกับภาษี" onClose={() => { setShowNewInvoice(false); setError(null); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">ชื่อผู้ซื้อ *</label>
              <Input value={newInv.buyer_name} onChange={(e) => setNewInv((r) => ({ ...r, buyer_name: e.target.value }))} placeholder="ชื่อบริษัท / ชื่อบุคคล" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">เลขประจำตัวผู้เสียภาษี</label>
              <Input value={newInv.buyer_tax_id} onChange={(e) => setNewInv((r) => ({ ...r, buyer_tax_id: e.target.value }))} placeholder="0000000000000" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">ที่อยู่</label>
              <Textarea value={newInv.buyer_address} onChange={(e) => setNewInv((r) => ({ ...r, buyer_address: e.target.value }))} rows={2} placeholder="ที่อยู่สำหรับออกใบกำกับ" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">ราคาก่อน VAT (บาท) *</label>
              <Input type="number" min="0" step="0.01" value={newInv.amount} onChange={(e) => setNewInv((r) => ({ ...r, amount: e.target.value }))} placeholder="0.00" />
              {newInv.amount && Number(newInv.amount) > 0 && (
                <div className="mt-2 rounded-lg bg-secondary p-3 text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">VAT 7%</span><span className="font-medium">{fmt(Number(newInv.amount) * 0.07)}</span></div>
                  <div className="flex justify-between border-t border-border pt-1"><span className="font-medium">รวมทั้งสิ้น</span><span className="font-semibold">{fmt(Number(newInv.amount) * 1.07)}</span></div>
                </div>
              )}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { setShowNewInvoice(false); setError(null); }} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition-colors">ยกเลิก</button>
              <button onClick={handleCreateInvoice} disabled={saving || !newInv.buyer_name.trim()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {saving ? 'กำลังบันทึก...' : 'สร้างใบกำกับ'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}
