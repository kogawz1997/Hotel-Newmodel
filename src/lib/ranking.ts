export const DEFAULT_WEIGHTS = {
  rating:     35,
  reviews:    20,
  photos:     15,
  freeCancel: 10,
  stars:      10,
  content:     5,
  breakfast:   5,
  featured:   50,
};

export type RankingWeights = typeof DEFAULT_WEIGHTS;

export interface RankingSignals {
  avg_rating:     number | null;
  review_count:   number;
  gallery_count:  number;
  is_free_cancel: boolean;
  is_breakfast:   boolean;
  star_rating:    number | null;
  is_featured:    boolean;
  has_content:    boolean;
}

export function computeScore(h: RankingSignals, w: RankingWeights): number {
  let score = 0;
  score += ((h.avg_rating ?? 0) / 5) * w.rating;
  score += Math.min(1, Math.log10((h.review_count || 0) + 1) / 2) * w.reviews;
  score += Math.min(1, (h.gallery_count || 0) / 5) * w.photos;
  score += h.is_free_cancel ? w.freeCancel : 0;
  score += ((h.star_rating ?? 0) / 5) * w.stars;
  score += h.has_content ? w.content : 0;
  score += h.is_breakfast ? w.breakfast : 0;
  score += h.is_featured ? w.featured : 0;
  return Math.round(score * 10) / 10;
}

export const WEIGHT_META: Record<keyof RankingWeights, { label: string; desc: string; max: number }> = {
  rating:     { label: 'คะแนนรีวิว',        desc: 'avg_rating 0–5 → normalize แล้วคูณ weight', max: 100 },
  reviews:    { label: 'จำนวนรีวิว',        desc: 'log scale (review_count) — ป้องกัน outlier',  max: 100 },
  photos:     { label: 'รูปภาพ',            desc: 'gallery ≥ 5 รูป = เต็ม weight',               max: 100 },
  freeCancel: { label: 'ยกเลิกฟรี',         desc: 'มีนโยบาย free cancel อย่างน้อย 1 ห้อง',       max: 100 },
  stars:      { label: 'ดาว (star rating)', desc: 'star_rating 1–5 → normalize',                 max: 100 },
  content:    { label: 'Content คุณภาพ',    desc: 'มี description + tagline ทั้งคู่',             max: 100 },
  breakfast:  { label: 'รวมอาหารเช้า',      desc: 'มีห้องที่รวม breakfast อย่างน้อย 1 ประเภท',   max: 100 },
  featured:   { label: 'Featured Boost',    desc: 'paid placement — บวกเพิ่มบน score ปกติ',      max: 200 },
};
