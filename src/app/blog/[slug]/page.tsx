import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ARTICLES } from '../articles-data';
import { ArrowLeft, Clock, Calendar, ChevronRight } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES.find(a => a.slug === slug);
  if (!article) return { title: 'ไม่พบบทความ' };
  return {
    title: `${article.title} | Maitri Blog`,
    description: article.excerpt,
    openGraph: { title: article.title, description: article.excerpt, type: 'article' },
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = ARTICLES.find(a => a.slug === slug);
  if (!article) notFound();

  const related = ARTICLES.filter(a => a.slug !== slug).slice(0, 3);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    author: { '@type': 'Organization', name: article.author },
    datePublished: article.date,
    publisher: { '@type': 'Organization', name: 'Maitri' },
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <nav className="bg-[#2A2522] border-b border-white/10 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 bg-[#2563eb] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <span className="font-serif text-lg font-medium text-white">Maitri</span>
          </Link>
          <Link href="/blog" className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> บทความทั้งหมด
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Cover */}
        <div className={`h-56 md:h-72 rounded-2xl bg-gradient-to-br ${article.gradient} flex items-center justify-center mb-8`}>
          <span className="text-8xl">{article.emoji}</span>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${article.categoryColor}`}>{article.category}</span>
          <span className="flex items-center gap-1 text-xs text-[#2A2522]/40"><Calendar className="h-3.5 w-3.5" />{article.date}</span>
          <span className="flex items-center gap-1 text-xs text-[#2A2522]/40"><Clock className="h-3.5 w-3.5" />{article.readTime}</span>
        </div>

        <h1 className="text-2xl md:text-4xl font-bold text-[#2A2522] leading-tight mb-4">{article.title}</h1>

        <div className="flex items-center gap-2 mb-8 pb-8 border-b border-black/8">
          <div className="h-8 w-8 bg-[#2563eb] rounded-full flex items-center justify-center text-white text-xs font-bold">M</div>
          <span className="text-sm font-medium text-[#2A2522]">{article.author}</span>
        </div>

        {/* Body */}
        <div className="prose prose-sm max-w-none text-[#2A2522]/80 leading-relaxed mb-12">
          {article.body.trim().split('\n\n').map((para, i) => {
            if (para.startsWith('**') && para.endsWith('**')) {
              return <h3 key={i} className="font-bold text-[#2A2522] text-lg mt-6 mb-2">{para.replace(/\*\*/g, '')}</h3>;
            }
            if (para.includes('**')) {
              const parts = para.split(/(\*\*[^*]+\*\*)/g);
              return (
                <p key={i} className="mb-4">
                  {parts.map((p, j) =>
                    p.startsWith('**') ? <strong key={j}>{p.replace(/\*\*/g, '')}</strong> : p
                  )}
                </p>
              );
            }
            return <p key={i} className="mb-4">{para}</p>;
          })}
        </div>

        {/* CTA box */}
        <div className="bg-[#2A2522] rounded-2xl p-6 text-center mb-12">
          <p className="text-white font-bold text-lg mb-1">ลองใช้ Maitri ฟรี 60 วัน</p>
          <p className="text-white/50 text-sm mb-4">ระบบโรงแรมครบวงจร — ไม่ต้องใส่บัตรเครดิต</p>
          <Link href="/auth/signup"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl font-semibold text-sm transition-colors">
            เริ่มต้นฟรี <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Related articles */}
        <div>
          <h2 className="font-bold text-[#2A2522] mb-4">บทความที่เกี่ยวข้อง</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {related.map(r => (
              <Link key={r.slug} href={`/blog/${r.slug}`}
                className="bg-white rounded-xl border border-black/5 overflow-hidden hover:shadow-sm transition-shadow group">
                <div className={`h-28 bg-gradient-to-br ${r.gradient} flex items-center justify-center`}>
                  <span className="text-4xl">{r.emoji}</span>
                </div>
                <div className="p-3">
                  <p className="text-xs font-bold text-[#2A2522] group-hover:text-[#2563eb] transition-colors line-clamp-2">{r.title}</p>
                  <p className="text-2xs text-[#2A2522]/40 mt-1">{r.readTime}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
