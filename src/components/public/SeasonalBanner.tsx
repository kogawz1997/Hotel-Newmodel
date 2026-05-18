'use client';

import Link from 'next/link';

interface Campaign {
  month: number[];
  emoji: string;
  title: string;
  subtitle: string;
  cta: string;
  gradient: string;
  query: string;
}

const CAMPAIGNS: Campaign[] = [
  { month: [12, 1],  emoji: '🎆', title: 'ส่งท้ายปีเก่า ต้อนรับปีใหม่',  subtitle: 'จองที่พักช่วงปีใหม่ล่วงหน้า รับส่วนลดสูงสุด 20%', cta: 'ดูโปรโมชั่นปีใหม่', gradient: 'from-[#1a1a2e] to-[#16213e]', query: 'new-year' },
  { month: [2],      emoji: '💕', title: "Valentine's Day Special",        subtitle: 'แพ็กเกจโรแมนติก ดอกไม้+อาหารค่ำ+ห้อง Deluxe', cta: 'ดูแพ็กเกจคู่รัก', gradient: 'from-rose-700 to-pink-600', query: 'romantic' },
  { month: [4],      emoji: '🌊', title: 'สงกรานต์ฟีเวอร์',               subtitle: 'จองที่พักรับสงกรานต์ติดสระน้ำหรือติดทะเล ราคาพิเศษ', cta: 'จองก่อนหมด', gradient: 'from-sky-600 to-blue-700', query: 'pool' },
  { month: [6, 7],   emoji: '☀️', title: 'High Season ภาคเหนือ',           subtitle: 'เดือนกุมภาพันธ์-เมษายน อากาศดีที่สุดของภาคเหนือ', cta: 'ค้นหาที่พักเชียงใหม่', gradient: 'from-amber-500 to-orange-600', query: 'Chiang+Mai' },
  { month: [10, 11], emoji: '🌺', title: 'ท่องเที่ยวภาคใต้ High Season',  subtitle: 'ฤดูกาลท่องเที่ยวทะเลอันดามัน วิวสวย น้ำใส ฟ้าแจ่ม', cta: 'ดูที่พักภูเก็ต-กระบี่', gradient: 'from-teal-600 to-cyan-700', query: 'Phuket' },
];

function getActiveCampaign(): Campaign | null {
  const month = new Date().getMonth() + 1;
  return CAMPAIGNS.find(c => c.month.includes(month)) ?? null;
}

export function SeasonalBanner() {
  const campaign = getActiveCampaign();
  if (!campaign) return null;

  return (
    <section className={`bg-gradient-to-r ${campaign.gradient} py-10 px-4`}>
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <div className="text-4xl mb-2">{campaign.emoji}</div>
          <h2 className="text-2xl font-bold text-white mb-1">{campaign.title}</h2>
          <p className="text-white/70 text-sm">{campaign.subtitle}</p>
        </div>
        <Link
          href={`/search?city=${campaign.query}`}
          className="shrink-0 px-8 py-3 bg-white text-[#2A2522] rounded-full font-bold text-sm hover:bg-[#FAF7F2] transition-colors shadow-lg"
        >
          {campaign.cta} →
        </Link>
      </div>
    </section>
  );
}
