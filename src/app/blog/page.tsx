import Link from 'next/link';
import type { Metadata } from 'next';
import { ARTICLES } from './articles-data';

export const metadata: Metadata = {
  title: 'บทความ & คู่มือโรงแรม | Maitri',
  description: 'เรียนรู้กลยุทธ์เพิ่มรายได้โรงแรม Revenue Management, OTA, AI Concierge อัปเดตทุกสัปดาห์',
};


export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <nav className="bg-[#2A2522] border-b border-white/10 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 bg-[#C66A30] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <span className="font-serif text-lg font-medium text-white">Maitri</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-white/60">
            <Link href="/#features" className="hover:text-white transition-colors hidden md:block">ฟีเจอร์</Link>
            <Link href="/#pricing" className="hover:text-white transition-colors hidden md:block">ราคา</Link>
            <Link href="/search" className="hover:text-white transition-colors hidden md:block">ค้นหาที่พัก</Link>
            <Link href="/auth/signup" className="px-4 py-1.5 bg-[#C66A30] text-white rounded-full text-xs font-medium hover:bg-[#A4522A] transition-colors">
              ทดลองฟรี
            </Link>
          </div>
        </div>
      </nav>

      <div className="bg-[#2A2522] py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[#C66A30] text-sm font-medium mb-3 uppercase tracking-widest">Maitri Blog</p>
          <h1 className="text-3xl md:text-5xl font-serif font-medium text-white mb-4">บทความ & คู่มือโรงแรม</h1>
          <p className="text-white/50 text-lg">เรียนรู้กลยุทธ์เพิ่มรายได้โรงแรม อัปเดตทุกสัปดาห์</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ARTICLES.map(a => (
            <Link key={a.slug} href={`/blog/${a.slug}`}
              className="bg-white rounded-2xl border border-black/5 overflow-hidden hover:shadow-md transition-shadow group">
              <div className={`h-44 bg-gradient-to-br ${a.gradient} flex items-center justify-center`}>
                <span className="text-6xl">{a.emoji}</span>
              </div>
              <div className="p-5">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${a.categoryColor}`}>{a.category}</span>
                <h2 className="font-bold text-[#2A2522] mt-3 mb-2 leading-snug group-hover:text-[#C66A30] transition-colors line-clamp-2">
                  {a.title}
                </h2>
                <p className="text-sm text-[#2A2522]/50 leading-relaxed line-clamp-2 mb-4">{a.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-[#2A2522]/40">
                  <span>{a.author}</span>
                  <span>{a.date} · {a.readTime}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-[#2A2522] py-16 px-4 mt-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-3">เริ่มต้นใช้ Maitri ฟรี 60 วัน</h2>
          <p className="text-white/50 mb-6">ไม่ต้องใส่บัตรเครดิต ยกเลิกได้ทุกเมื่อ</p>
          <Link href="/auth/signup"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#C66A30] hover:bg-[#A4522A] text-white rounded-full font-semibold transition-colors">
            เริ่มต้นฟรี →
          </Link>
        </div>
      </div>
    </div>
  );
}
