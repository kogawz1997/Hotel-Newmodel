'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Building2,
  Plus,
  MapPin,
  ArrowRight,
  Loader2,
  Lock,
  CheckCircle2,
  X,
  Hotel,
  Sparkles,
  BarChart3,
  Users,
  Zap,
  Globe,
  Bot,
  Repeat2,
  TrendingUp,
  Utensils,
  Waves,
  Cpu,
  Smartphone,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────────────────

type HotelRow = {
  id: string;
  name: string;
  slug: string;
  type: string;
  city: string | null;
  status: string | null;
  created_at: string;
};

type Organization = {
  id: string;
  name: string;
  slug: string;
  subscription_plan: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
} | null;

type PlanInfo = {
  key: string;
  name: string;
  monthlyPrice: number;
  limits: { hotels: number | 'custom'; rooms: number | 'custom'; staff: number | 'custom' };
};

type HotelsResponse = {
  hotels: HotelRow[];
  organization: Organization;
  plan: PlanInfo;
};

// ─── Feature grid data ────────────────────────────────────────────────────────

type FeatureItem = {
  key: string;
  label: string;
  requiredPlan: 'starter' | 'standard' | 'pro' | 'enterprise';
  icon: React.ReactNode;
};

const FEATURES: FeatureItem[] = [
  { key: 'core_pms',        label: 'Core PMS',          requiredPlan: 'starter',    icon: <Hotel className="h-4 w-4" /> },
  { key: 'guest_portal',    label: 'Guest Portal',       requiredPlan: 'starter',    icon: <Users className="h-4 w-4" /> },
  { key: 'ai_inbox',        label: 'AI Inbox',           requiredPlan: 'standard',   icon: <Bot className="h-4 w-4" /> },
  { key: 'channel_manager', label: 'Channel Manager',    requiredPlan: 'standard',   icon: <Repeat2 className="h-4 w-4" /> },
  { key: 'reports_export',  label: 'รายงาน Export',      requiredPlan: 'standard',   icon: <BarChart3 className="h-4 w-4" /> },
  { key: 'team_roles',      label: 'Team Roles',         requiredPlan: 'standard',   icon: <Users className="h-4 w-4" /> },
  { key: 'fb_module',       label: 'F&B Module',         requiredPlan: 'pro',        icon: <Utensils className="h-4 w-4" /> },
  { key: 'spa_module',      label: 'Spa Module',         requiredPlan: 'pro',        icon: <Waves className="h-4 w-4" /> },
  { key: 'automation',      label: 'Automation',         requiredPlan: 'pro',        icon: <Zap className="h-4 w-4" /> },
  { key: 'dynamic_pricing', label: 'Dynamic Pricing',    requiredPlan: 'pro',        icon: <TrendingUp className="h-4 w-4" /> },
  { key: 'multi_property',  label: 'Multi-Property',     requiredPlan: 'pro',        icon: <Building2 className="h-4 w-4" /> },
  { key: 'api_access',      label: 'API Access',         requiredPlan: 'pro',        icon: <Cpu className="h-4 w-4" /> },
  { key: 'revenue_manager', label: 'Revenue Manager',    requiredPlan: 'pro',        icon: <Sparkles className="h-4 w-4" /> },
  { key: 'mobile_key',      label: 'Mobile Key',         requiredPlan: 'pro',        icon: <Smartphone className="h-4 w-4" /> },
  { key: 'white_label',     label: 'White Label',        requiredPlan: 'enterprise', icon: <Tag className="h-4 w-4" /> },
  { key: 'custom_domain',   label: 'Custom Domain',      requiredPlan: 'enterprise', icon: <Globe className="h-4 w-4" /> },
];

const PLAN_ORDER = ['starter', 'standard', 'pro', 'enterprise'];
const PLAN_PRICES: Record<string, string> = {
  starter: 'ฟรี (Starter)',
  standard: '฿2,990/เดือน',
  pro: '฿5,990/เดือน',
  enterprise: 'ติดต่อเรา',
};
const PLAN_LABELS: Record<string, string> = {
  starter:    'Starter',
  standard:   'Standard',
  pro:        'Pro',
  enterprise: 'Enterprise',
};

const HOTEL_TYPE_LABELS: Record<string, string> = {
  hotel:                'Hotel',
  resort:               'Resort',
  boutique:             'Boutique',
  hostel:               'Hostel',
  pool_villa:           'Pool Villa',
  serviced_apartment:   'Serviced Apartment',
};

// ─── Add Hotel Modal ──────────────────────────────────────────────────────────

type AddHotelModalProps = {
  onClose: () => void;
  onCreated: () => void;
};

function AddHotelModal({ onClose, onCreated }: AddHotelModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('hotel');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error('กรุณากรอกชื่อโรงแรม'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/owner/hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), type, city: city.trim() || undefined }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        if (res.status === 402) {
          toast.error(`เกินขีดจำกัดของแพลน (${payload?.limit} โรงแรม) กรุณาอัปเกรดเป็น ${payload?.upgrade?.toUpperCase()}`);
          return;
        }
        toast.error(payload?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
        return;
      }
      toast.success('เพิ่มโรงแรมสำเร็จ!');
      onCreated();
      onClose();
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">เพิ่มโรงแรมใหม่</h2>
              <p className="text-xs text-muted-foreground">กรอกข้อมูลเบื้องต้นของโรงแรม</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <Input
            label="ชื่อโรงแรม *"
            placeholder="เช่น The Grand Palace Hotel"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoFocus
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">ประเภท</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            >
              <option value="hotel">Hotel</option>
              <option value="resort">Resort</option>
              <option value="boutique">Boutique</option>
              <option value="hostel">Hostel</option>
              <option value="pool_villa">Pool Villa</option>
              <option value="serviced_apartment">Serviced Apartment</option>
            </select>
          </div>

          <Input
            label="เมือง (ไม่บังคับ)"
            placeholder="เช่น กรุงเทพมหานคร, เชียงใหม่"
            value={city}
            onChange={e => setCity(e.target.value)}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" />กำลังสร้าง...</>
              ) : (
                <>สร้างโรงแรม</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Hotel Card ───────────────────────────────────────────────────────────────

function HotelCard({ hotel }: { hotel: HotelRow }) {
  const statusVariant = hotel.status === 'active' ? 'success' : 'warning';
  const statusLabel = hotel.status === 'active' ? 'Active' : hotel.status === 'trial' ? 'Trial' : (hotel.status ?? 'Trial');

  return (
    <div className="group rounded-2xl border border-border bg-card p-5 flex flex-col gap-4 hover:border-primary/30 hover:shadow-sm transition-all">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{hotel.name}</h3>
            <span className="text-xs text-muted-foreground">
              {HOTEL_TYPE_LABELS[hotel.type] ?? hotel.type}
            </span>
          </div>
        </div>
        <Badge variant={statusVariant} className="shrink-0 capitalize">
          {statusLabel}
        </Badge>
      </div>

      {/* City */}
      {hotel.city && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{hotel.city}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">0 ห้อง</span>
        <Link
          href={`/owner/overview?hotel=${hotel.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          จัดการโรงแรม
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ─── Feature Grid ─────────────────────────────────────────────────────────────

function FeatureGrid({ currentPlan }: { currentPlan: string }) {
  const rank = (plan: string) => PLAN_ORDER.indexOf(plan);
  const currentRank = rank(currentPlan);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">ฟีเจอร์ในแพลนของคุณ</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          แพลนปัจจุบัน: <span className="font-medium text-foreground">{PLAN_LABELS[currentPlan] ?? currentPlan}</span>
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {FEATURES.map(feature => {
          const isUnlocked = rank(feature.requiredPlan) <= currentRank;
          return (
            <div
              key={feature.key}
              className={`flex items-center gap-3 rounded-xl p-3 border transition-colors ${
                isUnlocked
                  ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30'
                  : 'border-border bg-secondary/40'
              }`}
            >
              <div className={`shrink-0 ${isUnlocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/50'}`}>
                {isUnlocked ? <CheckCircle2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-medium truncate ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {feature.label}
                </p>
                {!isUnlocked && (
                  <span className="text-[10px] text-muted-foreground/70">
                    {PLAN_LABELS[feature.requiredPlan]} · {PLAN_PRICES[feature.requiredPlan]}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OwnerHotelsPage() {
  const [data, setData] = useState<HotelsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchHotels = useCallback(async () => {
    try {
      const res = await fetch('/api/owner/hotels');
      if (!res.ok) throw new Error('fetch failed');
      const json: HotelsResponse = await res.json();
      setData(json);
    } catch {
      toast.error('ไม่สามารถโหลดข้อมูลโรงแรมได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHotels(); }, [fetchHotels]);

  const hotelCount = data?.hotels.length ?? 0;
  const hotelLimit = data?.plan.limits.hotels ?? 1;
  const atLimit = hotelLimit !== 'custom' && hotelCount >= (hotelLimit as number);
  const currentPlan = data?.plan.key ?? 'starter';

  return (
    <>
      {showModal && (
        <AddHotelModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setLoading(true); fetchHotels(); }}
        />
      )}

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">โรงแรมของฉัน</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              จัดการโรงแรมทั้งหมดของคุณในที่เดียว
            </p>
          </div>

          {/* Plan badge + usage */}
          {data && (
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-foreground">
                  {PLAN_LABELS[currentPlan] ?? currentPlan}
                </span>
                <span className="text-xs text-muted-foreground">
                  {hotelLimit === 'custom'
                    ? `${hotelCount} โรงแรม`
                    : `${hotelCount} / ${hotelLimit} โรงแรม`}
                </span>
              </div>

              <div className="relative group/add">
                <Button
                  onClick={() => !atLimit && setShowModal(true)}
                  disabled={atLimit}
                  size="icon"
                  className="h-10 w-10 rounded-xl"
                  aria-label="เพิ่มโรงแรม"
                >
                  <Plus className="h-5 w-5" />
                </Button>
                {atLimit && (
                  <div className="absolute top-full right-0 mt-2 w-56 rounded-xl border border-border bg-popover shadow-lg p-3 text-xs text-muted-foreground hidden group-hover/add:block z-10">
                    <p className="font-medium text-foreground mb-1">ถึงขีดจำกัดแล้ว</p>
                    <p>แพลนของคุณรองรับสูงสุด {hotelLimit} โรงแรม อัปเกรดเพื่อเพิ่มโรงแรมได้มากขึ้น</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!loading && hotelCount === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary">
              <Building2 className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">ยังไม่มีโรงแรม</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                เริ่มต้นด้วยการเพิ่มโรงแรมแรกของคุณ เพื่อจัดการการจองและห้องพัก
              </p>
            </div>
            <Button onClick={() => setShowModal(true)} size="lg" className="gap-2 rounded-xl px-8">
              <Plus className="h-5 w-5" />
              เพิ่มโรงแรมแรกของคุณ
            </Button>
          </div>
        )}

        {/* Hotel cards grid */}
        {!loading && hotelCount > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {data!.hotels.map(hotel => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}

              {/* Add hotel card — only show if not at limit */}
              {!atLimit && (
                <button
                  onClick={() => setShowModal(true)}
                  className="rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-transparent hover:bg-secondary/30 p-5 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground transition-all min-h-[160px]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-dashed border-current">
                    <Plus className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium">เพิ่มโรงแรม</span>
                </button>
              )}
            </div>

            {/* Feature grid */}
            <FeatureGrid currentPlan={currentPlan} />
          </>
        )}

        {/* Feature grid for empty state too (after empty state message) */}
        {!loading && hotelCount === 0 && data && (
          <FeatureGrid currentPlan={currentPlan} />
        )}
      </div>
    </>
  );
}
