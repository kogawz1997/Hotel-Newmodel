'use client';

import { useState } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import {
  Bed, Users, Maximize2, Flame, CheckCircle, ChevronRight,
  Image as ImageIcon, X, Check, Coffee,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Tag } from 'lucide-react';

// ── Amenity maps (mirrored from page.tsx) ────────────────────────────────────
const AMENITY_TH: Record<string, string> = {
  wifi: 'WiFi ฟรี', 'wi-fi': 'WiFi ฟรี', internet: 'WiFi ฟรี',
  ac: 'แอร์', 'air conditioning': 'ปรับอากาศ', aircon: 'ปรับอากาศ',
  breakfast: 'อาหารเช้า', coffee: 'กาแฟ/ชา',
  pool: 'สระว่ายน้ำ', swimming: 'สระว่ายน้ำ',
  parking: 'ที่จอดรถ',
  gym: 'ฟิตเนส', fitness: 'ฟิตเนส', exercise: 'ฟิตเนส',
  restaurant: 'ร้านอาหาร', dining: 'ห้องอาหาร',
  spa: 'สปา', massage: 'นวด',
  tv: 'โทรทัศน์', cable: 'ทีวีเคเบิล',
  bath: 'อ่างอาบน้ำ', bathtub: 'อ่างอาบน้ำ',
  concierge: 'คอนเซียร์จ',
  airport: 'รับสนามบิน', shuttle: 'รถรับส่ง', transfer: 'รถรับส่ง',
  garden: 'สวน', terrace: 'ระเบียง', balcony: 'ระเบียง',
  fridge: 'ตู้เย็น', minibar: 'มินิบาร์',
};

function amenityTh(a: string): string {
  const key = a.toLowerCase();
  return AMENITY_TH[key] ?? AMENITY_TH[a] ?? a;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface RoomType {
  id: string;
  name: string;
  description?: string;
  size_sqm?: number;
  bed_type?: string;
  max_occupancy?: number;
  base_rate?: number;
  amenities?: string[];
  cancel_policy?: string;
  includes_breakfast?: boolean;
  room_type_images?: { image_url: string; display_order: number }[];
}

interface Props {
  roomTypes: RoomType[];
  slug: string;
  roomCountByType: Record<string, number>;
}

// ── Comparison table row definitions ─────────────────────────────────────────
const COMPARE_ROWS: { key: string; label: string; render: (rt: RoomType) => React.ReactNode }[] = [
  {
    key: 'base_rate',
    label: 'ราคา/คืน',
    render: (rt) => (
      <span className="font-bold text-[#C66A30] text-lg">
        {rt.base_rate != null ? formatCurrency(rt.base_rate) : '—'}
      </span>
    ),
  },
  {
    key: 'size_sqm',
    label: 'ขนาดห้อง',
    render: (rt) => rt.size_sqm ? `${rt.size_sqm} ตร.ม.` : '—',
  },
  {
    key: 'bed_type',
    label: 'ประเภทเตียง',
    render: (rt) => rt.bed_type || '—',
  },
  {
    key: 'max_occupancy',
    label: 'รองรับ (คน)',
    render: (rt) => rt.max_occupancy ? `${rt.max_occupancy} คน` : '—',
  },
  {
    key: 'includes_breakfast',
    label: 'อาหารเช้า',
    render: (rt) =>
      rt.includes_breakfast ? (
        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
          <Check className="h-4 w-4" /> รวม
        </span>
      ) : (
        <span className="text-[#2A2522]/40">ไม่รวม</span>
      ),
  },
  {
    key: 'cancel_policy',
    label: 'ยกเลิกฟรี',
    render: (rt) =>
      rt.cancel_policy && rt.cancel_policy !== 'non_refundable' ? (
        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
          <Check className="h-4 w-4" /> ได้
        </span>
      ) : (
        <span className="text-[#2A2522]/40">ไม่ได้</span>
      ),
  },
  {
    key: 'amenities',
    label: 'สิ่งอำนวยความสะดวก',
    render: (rt) => {
      const list = (rt.amenities || []).slice(0, 4);
      return list.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {list.map((a) => (
            <span key={a} className="text-xs bg-[#FAF7F2] text-[#2A2522]/60 px-2 py-0.5 rounded-full border border-black/5">
              {amenityTh(a)}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-[#2A2522]/40">—</span>
      );
    },
  },
];

// ── Main component ─────────────────────────────────────────────────────────────
export function RoomCompareSection({ roomTypes, slug, roomCountByType }: Props) {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  function toggleCompare(id: string) {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, id];
    });
  }

  const compareRooms = roomTypes.filter((rt) => compareIds.includes(rt.id));
  const showBar = compareIds.length >= 2;

  return (
    <>
      {/* ── Room card list ── */}
      <div className="space-y-5">
        {(roomTypes as any[]).map((rt, idx) => {
          const imgs = ((rt.room_type_images || []) as any[]).sort(
            (a: any, b: any) => a.display_order - b.display_order,
          );
          const amenities: string[] = rt.amenities || [];
          const availCount = roomCountByType[rt.id] || 0;
          const isPopular = idx === 0;
          const isLow = availCount > 0 && availCount <= 3;
          const isComparing = compareIds.includes(rt.id);

          return (
            <div
              key={rt.id}
              className={`rounded-2xl border overflow-hidden hover:shadow-md transition-shadow ${
                isComparing
                  ? 'border-[#C66A30] ring-2 ring-[#C66A30]/30'
                  : isPopular
                  ? 'border-[#C66A30]/40 ring-1 ring-[#C66A30]/20'
                  : 'border-black/8'
              }`}
            >
              {/* Popular badge strip */}
              {isPopular && (
                <div className="bg-[#C66A30] px-4 py-1.5 flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-white" />
                  <span className="text-white text-xs font-semibold">
                    ห้องยอดนิยม — เลือกมากที่สุด
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row">
                {/* Image */}
                <div className="sm:w-52 h-52 sm:h-auto bg-[#FAF7F2] shrink-0 relative overflow-hidden">
                  {imgs[0]?.image_url ? (
                    <NextImage
                      src={imgs[0].image_url}
                      alt={rt.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#2A2522]/10">
                      <Bed className="h-12 w-12" />
                    </div>
                  )}
                  {imgs.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-2xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      {imgs.length} รูป
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    {/* Header row with compare toggle */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-bold text-[#2A2522] text-base leading-tight">
                        {rt.name}
                      </h3>
                      <div className="flex items-center gap-3 shrink-0">
                        {/* Compare toggle button */}
                        <button
                          onClick={() => toggleCompare(rt.id)}
                          disabled={!isComparing && compareIds.length >= 3}
                          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                            isComparing
                              ? 'bg-[#C66A30] border-[#C66A30] text-white'
                              : compareIds.length >= 3
                              ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed'
                              : 'bg-white border-[#C66A30]/40 text-[#C66A30] hover:bg-[#C66A30]/5'
                          }`}
                          title={isComparing ? 'ยกเลิกการเปรียบเทียบ' : 'เพิ่มในการเปรียบเทียบ'}
                        >
                          {isComparing && <Check className="h-3 w-3" />}
                          เปรียบเทียบ
                        </button>
                        {/* Price */}
                        <div className="text-right">
                          <div className="font-bold text-xl text-[#C66A30]">
                            {formatCurrency(rt.base_rate)}
                          </div>
                          <div className="text-xs text-[#2A2522]/40">/ คืน (ราคาเริ่มต้น)</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-[#2A2522]/50 mb-3">
                      {rt.size_sqm && (
                        <span className="flex items-center gap-1">
                          <Maximize2 className="h-3.5 w-3.5" />
                          {rt.size_sqm} ตร.ม.
                        </span>
                      )}
                      {rt.max_occupancy && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          สูงสุด {rt.max_occupancy} คน
                        </span>
                      )}
                      {rt.bed_type && (
                        <span className="flex items-center gap-1">
                          <Bed className="h-3.5 w-3.5" />
                          {rt.bed_type}
                        </span>
                      )}
                    </div>

                    {rt.description && (
                      <p className="text-xs text-[#2A2522]/60 leading-relaxed mb-3 line-clamp-2">
                        {rt.description}
                      </p>
                    )}

                    {amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {amenities.slice(0, 6).map((a: string) => (
                          <span
                            key={a}
                            className="text-2xs bg-[#FAF7F2] text-[#2A2522]/60 px-2 py-0.5 rounded-full border border-black/5"
                          >
                            {amenityTh(a)}
                          </span>
                        ))}
                        {amenities.length > 6 && (
                          <span className="text-2xs text-[#2A2522]/40">
                            +{amenities.length - 6} อื่นๆ
                          </span>
                        )}
                      </div>
                    )}

                    {/* Status badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        <CheckCircle className="h-3.5 w-3.5" />
                        ยกเลิกฟรี 24 ชม.
                      </span>
                      {isLow && (
                        <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">
                          เหลือเพียง {availCount} ห้อง!
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/booking/${slug}?roomTypeId=${rt.id}`}
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto sm:self-end bg-[#C66A30] hover:bg-[#A4522A] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    เลือกห้องนี้ <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Sticky comparison bar ── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-black/10 px-4 py-3 flex items-center gap-3 transition-transform duration-300 ${
          showBar ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Room chips */}
        <div className="flex-1 flex items-center gap-2 overflow-x-auto">
          {[0, 1, 2].map((i) => {
            const rt = compareRooms[i];
            return (
              <div
                key={i}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm shrink-0 ${
                  rt
                    ? 'bg-[#FAF7F2] border-[#C66A30]/30 text-[#2A2522]'
                    : 'border-dashed border-black/20 text-[#2A2522]/30 min-w-[100px]'
                }`}
              >
                {rt ? (
                  <>
                    <span className="truncate max-w-[120px] font-medium">{rt.name}</span>
                    <button
                      onClick={() => toggleCompare(rt.id)}
                      className="text-[#2A2522]/40 hover:text-[#2A2522] ml-0.5 shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <span className="text-xs">ห้อง {i + 1}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-[#C66A30] hover:bg-[#A4522A] text-white text-sm font-semibold rounded-xl transition-colors"
          >
            เปรียบเทียบ ({compareIds.length})
          </button>
          <button
            onClick={() => setCompareIds([])}
            className="px-3 py-2 border border-black/15 text-[#2A2522]/60 hover:text-[#2A2522] text-sm rounded-xl transition-colors"
            title="ล้างการเปรียบเทียบ"
          >
            ×ล้าง
          </button>
        </div>
      </div>

      {/* ── Comparison modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />

          {/* Modal panel */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/8 shrink-0">
              <h2 className="text-lg font-bold text-[#2A2522]">เปรียบเทียบห้องพัก</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-full hover:bg-black/5 text-[#2A2522]/60 hover:text-[#2A2522] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable table area */}
            <div className="overflow-auto flex-1">
              <table className="w-full min-w-[480px] border-collapse">
                <thead>
                  <tr>
                    {/* Empty label column */}
                    <th className="w-36 px-4 py-3 text-left text-xs font-semibold text-[#2A2522]/50 uppercase tracking-wide bg-[#FAF7F2] border-b border-black/8 sticky left-0 z-10" />
                    {compareRooms.map((rt) => {
                      const imgs = ((rt.room_type_images || []) as any[]).sort(
                        (a: any, b: any) => a.display_order - b.display_order,
                      );
                      return (
                        <th
                          key={rt.id}
                          className="px-5 py-4 text-left bg-white border-b border-black/8 min-w-[200px]"
                        >
                          {imgs[0]?.image_url && (
                            <div className="relative w-full h-28 rounded-xl overflow-hidden mb-3">
                              <NextImage
                                src={imgs[0].image_url}
                                alt={rt.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="font-bold text-[#2A2522] text-base leading-tight mb-1">
                            {rt.name}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row, rowIdx) => (
                    <tr
                      key={row.key}
                      className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#FAF7F2]/50'}
                    >
                      <td className="px-4 py-3 text-xs font-semibold text-[#2A2522]/60 whitespace-nowrap sticky left-0 z-10 bg-inherit border-r border-black/5">
                        {row.label}
                      </td>
                      {compareRooms.map((rt) => (
                        <td key={rt.id} className="px-5 py-3 text-sm text-[#2A2522]">
                          {row.render(rt)}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* CTA row */}
                  <tr className="bg-white border-t border-black/8">
                    <td className="px-4 py-4 sticky left-0 z-10 bg-white border-r border-black/5" />
                    {compareRooms.map((rt) => (
                      <td key={rt.id} className="px-5 py-4">
                        <Link
                          href={`/booking/${slug}?roomTypeId=${rt.id}`}
                          onClick={() => setModalOpen(false)}
                          className="inline-flex items-center justify-center gap-1.5 w-full bg-[#C66A30] hover:bg-[#A4522A] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                        >
                          เลือกห้องนี้ <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
