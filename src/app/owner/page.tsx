'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight, Bot, Globe2, BarChart3, Receipt, BedDouble, Coffee,
  ChefHat, Shield, UserCog, Wrench, TrendingUp, Building2,
  Smartphone, Calendar, Bell, FileText, Star, CreditCard,
  CheckCircle2, Zap, Languages, ChevronRight, Menu, X,
  LayoutDashboard, Lock, Sparkles,
} from 'lucide-react';

/* ─── Data ──────────────────────────────────────────────────────────────── */

const MGMT_FEATURES = [
  { icon: BedDouble,  color: '#3B82F6', title: 'Front Desk & การจอง',    desc: 'Check-in/out, walk-in, ย้ายห้อง, overbooking management ทั้งหมดในหน้าเดียว' },
  { icon: Globe2,     color: '#10B981', title: 'Channel Manager',         desc: 'Sync Booking.com, Agoda, Airbnb, Expedia real-time — inventory และราคาพร้อมกันทุก OTA' },
  { icon: Bot,        color: '#8B5CF6', title: 'AI Concierge 14 ภาษา',   desc: 'ตอบแขกผ่าน LINE, WhatsApp, Email อัตโนมัติ พร้อม sentiment analysis และ smart routing' },
  { icon: BarChart3,  color: '#F59E0B', title: 'Revenue Management',      desc: 'ADR, RevPAR, Occupancy rate แบบ real-time พร้อม dynamic pricing engine อัจฉริยะ' },
  { icon: Coffee,     color: '#EC4899', title: 'Housekeeping Kanban',     desc: 'ติดตามสถานะห้องแบบ real-time มอบหมายงาน track progress และ inspection workflow' },
  { icon: ChefHat,    color: '#F97316', title: 'F&B Management',          desc: 'Kitchen display system, room service orders, restaurant POS ครบในระบบเดียวกัน' },
  { icon: Receipt,    color: '#06B6D4', title: 'บัญชี & การเงิน',         desc: 'ออกใบกำกับ e-Tax, billing, cash management รายงานทางการเงินครบถ้วนตามมาตรฐานไทย' },
  { icon: Shield,     color: '#EF4444', title: 'Compliance กฎหมายไทย',   desc: 'ส่ง ทร.30 อัตโนมัติ, PDPA ready, audit log และ e-Tax ตามกฎหมายไทยทุกข้อ' },
  { icon: UserCog,    color: '#14B8A6', title: 'HR & เวลางาน',            desc: 'ตารางกะ, ลางาน, attendance tracking, overtime และ payroll integration ครบวงจร' },
  { icon: Wrench,     color: '#94A3B8', title: 'บำรุงรักษา',              desc: 'Work orders, preventive maintenance schedule, vendor management และ budget tracking' },
  { icon: TrendingUp, color: '#FB7185', title: 'Marketing & Loyalty',     desc: 'Promo codes, loyalty points, review management, CRM และ retention tool สำหรับ VIP' },
  { icon: Building2,  color: '#818CF8', title: 'Multi-property',          desc: 'บริหารหลายสาขาในหน้าเดียว consolidated reporting และ cross-property analytics' },
];

const GUEST_FEATURES = [
  { icon: Smartphone,  title: 'Mobile Check-in/out',   desc: 'แขก check-in ล่วงหน้าจากมือถือ ไม่ต้องรอที่เคาน์เตอร์ ลด friction ทุกขั้นตอน' },
  { icon: Calendar,    title: 'จัดการการจองเอง',        desc: 'แก้ไข, ยกเลิก, ขอ late check-out, early check-in ได้เอง 24/7 ไม่ต้องโทรหาโรงแรม' },
  { icon: Bell,        title: 'Concierge ดิจิทัล',      desc: 'สั่ง room service, ขอ amenities, นัดหมายสปา ผ่านมือถือพร้อม real-time tracking' },
  { icon: FileText,    title: 'Digital Folio',           desc: 'ดูบิลแบบ real-time, ดาวน์โหลด e-receipt, express checkout โดยไม่ต้องแวะ front desk' },
  { icon: Star,        title: 'Loyalty & Referral',      desc: 'สะสมแต้ม, redeem rewards, ชวนเพื่อน รับ cashback ระบบ loyalty ที่ทำให้แขกอยากกลับมา' },
  { icon: CreditCard,  title: 'Secure Payment',          desc: 'ชำระผ่าน credit card, PromptPay QR, payment link ปลอดภัยด้วย PCI-DSS compliance' },
];

const STATS = [
  { value: '142+', label: 'โรงแรมในไทย', sub: 'ที่ไว้วางใจ Maitri' },
  { value: '98%',  label: 'ความพึงพอใจ', sub: 'จากลูกค้าทั้งหมด' },
  { value: '14',   label: 'ภาษา', sub: 'AI Concierge รองรับ' },
  { value: '60',   label: 'วัน', sub: 'ทดลองใช้ฟรี ไม่มีบัตรเครดิต' },
];

const TESTIMONIALS = [
  { avatar: 'ก', name: 'คุณกรกฎ สุวรรณ',    role: 'Boutique Hotel · เชียงใหม่', text: '"จัดการ inbox 5 ภาษาได้ในคนคนเดียว ลด overtime พนักงานครึ่งหนึ่ง Maitri เปลี่ยนโรงแรมเราไปเลย"' },
  { avatar: 'ป', name: 'คุณปาริชาต ลีลา',   role: 'Resort · เกาะสมุย',          text: '"ส่ง ทร.30 อัตโนมัติ ไม่ต้องกังวลเรื่อง compliance อีกเลย ประหยัดเวลาและค่าปรับได้มหาศาล"' },
  { avatar: 'ธ', name: 'คุณธนพัฒน์ รัตน์', role: 'City Hotel · กรุงเทพฯ',      text: '"Revenue เพิ่ม 23% ในเดือนแรก เพราะ dynamic pricing ปรับราคาอัตโนมัติตามความต้องการตลาด"' },
];

/* ─── Animation helpers ─────────────────────────────────────────────────── */

const fadeUp = {
  hidden:  { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};
const staggerContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07 } },
};

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section ref={ref} id={id} initial="hidden" animate={inView ? 'visible' : 'hidden'}
      className={className}>
      {children}
    </motion.section>
  );
}

/* ─── Nav ────────────────────────────────────────────────────────────────── */

function Nav({ scrolled }: { scrolled: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#07060A]/90 backdrop-blur-xl border-b border-white/5 shadow-xl shadow-black/20' : ''}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/owner" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#C66A30] to-[#A4522A] flex items-center justify-center shadow-lg shadow-[#C66A30]/30">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="M4 20V4h4l4 8 4-8h4v16h-3V9l-3 6h-4L7 9v11H4z" fill="white"/></svg>
          </div>
          <span className="font-serif text-lg font-semibold text-white">Maitri</span>
          <span className="hidden sm:block text-xs text-white/30 border border-white/10 rounded px-1.5 py-0.5">PMS</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
          {[['ฟีเจอร์', '#features'], ['Guest Portal', '#guest'], ['ราคา', '#pricing']].map(([label, href]) => (
            <a key={label} href={href} className="hover:text-white transition-colors">{label}</a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/owner/login" className="text-sm text-white/70 hover:text-white px-4 py-2 transition-colors">
            เข้าสู่ระบบ
          </Link>
          <Link href="/owner/login?tab=register"
            className="text-sm bg-[#C66A30] hover:bg-[#A4522A] text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-lg shadow-[#C66A30]/20">
            เริ่มต้นฟรี 60 วัน →
          </Link>
        </div>

        <button onClick={() => setOpen(o => !o)} className="md:hidden text-white/70 hover:text-white">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-[#0D0C10]/95 backdrop-blur-xl border-b border-white/5 px-6 pb-6 pt-2 space-y-3">
            {[['ฟีเจอร์', '#features'], ['Guest Portal', '#guest'], ['ราคา', '#pricing']].map(([label, href]) => (
              <a key={label} href={href} onClick={() => setOpen(false)} className="block text-white/70 hover:text-white py-2 text-sm">{label}</a>
            ))}
            <hr className="border-white/10" />
            <Link href="/owner/login" className="block text-white/70 py-2 text-sm">เข้าสู่ระบบ</Link>
            <Link href="/owner/login?tab=register" className="block bg-[#C66A30] text-white text-sm font-medium py-2.5 rounded-xl text-center">
              เริ่มต้นฟรี 60 วัน
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */

function Hero() {
  const { scrollYProgress } = useScroll();
  const bgY = useTransform(scrollYProgress, [0, 0.3], ['0%', '20%']);

  return (
    <div className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      {/* Gradient mesh BG */}
      <div className="absolute inset-0">
        <motion.div style={{ y: bgY }}
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920&q=80&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07060A] via-[#07060A]/80 to-[#07060A]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-[#C66A30]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 pt-28 pb-20 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-xs text-white/70 mb-6">
            <Sparkles className="h-3 w-3 text-[#C66A30]" />
            ระบบ PMS ที่ดีที่สุดสำหรับโรงแรมไทย
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7 }}
            className="text-5xl lg:text-6xl xl:text-7xl font-serif font-bold leading-[1.1] tracking-tight mb-6">
            <span className="text-white">บริหารโรงแรม</span>
            <br />
            <span className="bg-gradient-to-r from-[#D4732E] via-[#C66A30] to-[#C4952A] bg-clip-text text-transparent">
              ยุคใหม่
            </span>
            <br />
            <span className="text-white">อย่างมืออาชีพ</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg text-white/55 leading-relaxed mb-8 max-w-lg">
            ครบทุกระบบที่โรงแรมต้องการ — จาก front desk ถึง revenue management, AI concierge ถึง compliance ไทย ทั้งหมดในแพลตฟอร์มเดียว
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-wrap gap-3 mb-12">
            <Link href="/owner/login?tab=register"
              className="flex items-center gap-2 bg-[#C66A30] hover:bg-[#A4522A] text-white font-semibold px-6 py-3.5 rounded-xl transition-all hover:scale-[1.02] shadow-xl shadow-[#C66A30]/25">
              เริ่มต้นฟรี 60 วัน <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/owner/login"
              className="flex items-center gap-2 text-white/70 hover:text-white border border-white/15 hover:border-white/30 px-6 py-3.5 rounded-xl transition-all bg-white/[0.03] hover:bg-white/[0.06]">
              เข้าสู่ระบบ <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="flex items-center gap-6 text-xs text-white/35">
            {['ไม่ต้องใช้บัตรเครดิต', 'ยกเลิกได้ทุกเมื่อ', 'Setup ภายใน 1 วัน'].map(t => (
              <span key={t} className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500" />{t}</span>
            ))}
          </motion.div>
        </div>

        {/* Right — floating dashboard mockup */}
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
          className="hidden lg:block relative">
          <div className="relative">
            {/* Main dashboard card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/50">
              {/* Dashboard header bar */}
              <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
                <div className="flex gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-red-500/80"/><div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80"/><div className="h-2.5 w-2.5 rounded-full bg-green-500/80"/></div>
                <div className="flex-1 bg-white/5 rounded h-5 mx-4" />
                <LayoutDashboard className="h-3.5 w-3.5 text-white/30" />
              </div>
              {/* Dashboard content */}
              <div className="p-5 grid grid-cols-3 gap-3">
                {[['Occupancy', '87%', '+5%', '#C66A30'], ['ADR', '฿3,240', '+12%', '#10B981'], ['RevPAR', '฿2,819', '+18%', '#8B5CF6']].map(([label, val, ch, color]) => (
                  <div key={label} className="bg-white/[0.05] rounded-xl p-3">
                    <div className="text-[10px] text-white/40 mb-1">{label}</div>
                    <div className="text-lg font-bold text-white">{val}</div>
                    <div className="text-[10px] mt-1" style={{ color }}>{ch} this month</div>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5 space-y-2">
                {[['Deluxe Room 301', 'Check-in today', '#10B981'], ['Suite 501', 'Housekeeping', '#F59E0B'], ['Room 205', 'Maintenance', '#EF4444']].map(([room, status, color]) => (
                  <div key={room} className="flex items-center gap-3 bg-white/[0.03] rounded-lg px-3 py-2.5">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs text-white/70 flex-1">{room}</span>
                    <span className="text-[10px] text-white/35">{status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating AI card */}
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-6 -right-6 bg-[#0D0C10]/90 border border-violet-500/20 backdrop-blur rounded-2xl p-4 shadow-xl shadow-violet-500/10 w-52">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-lg bg-violet-500/20 flex items-center justify-center"><Bot className="h-3.5 w-3.5 text-violet-400" /></div>
                <span className="text-[11px] font-medium text-white/80">AI Concierge</span>
              </div>
              <div className="text-[10px] text-white/40 mb-2">ตอบอัตโนมัติ · 14 ภาษา</div>
              <div className="space-y-1.5">
                {['🇹🇭 ไทย', '🇬🇧 English', '🇨🇳 中文', '🇷🇺 Русский'].map(l => (
                  <div key={l} className="text-[10px] text-white/50 bg-white/5 rounded px-2 py-1">{l}</div>
                ))}
              </div>
            </motion.div>

            {/* Floating revenue card */}
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute -bottom-6 -left-6 bg-[#0D0C10]/90 border border-emerald-500/20 backdrop-blur rounded-2xl p-4 shadow-xl w-44">
              <div className="text-[10px] text-white/40 mb-1">Revenue เดือนนี้</div>
              <div className="text-xl font-bold text-white mb-1">฿284,500</div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                <TrendingUp className="h-3 w-3" /> +23% vs เดือนที่แล้ว
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="relative max-w-7xl mx-auto px-6 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(s => (
            <div key={s.label} className="bg-white/[0.04] border border-white/8 rounded-2xl px-6 py-5">
              <div className="text-3xl font-bold text-white mb-0.5">{s.value}</div>
              <div className="text-sm font-medium text-[#C66A30]">{s.label}</div>
              <div className="text-xs text-white/35 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Management Features ────────────────────────────────────────────────── */

function Features() {
  return (
    <Section id="features" className="py-24 bg-[#07060A]">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div variants={fadeUp} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-xs text-[#C66A30] border border-[#C66A30]/20 bg-[#C66A30]/5 rounded-full px-4 py-1.5 mb-4">
            <Zap className="h-3 w-3" /> ระบบจัดการโรงแรมครบวงจร
          </div>
          <h2 className="text-4xl lg:text-5xl font-serif font-bold text-white mb-4">
            ทุกระบบที่โรงแรมต้องการ<br />
            <span className="bg-gradient-to-r from-[#C66A30] to-[#C4952A] bg-clip-text text-transparent">ในที่เดียวกัน</span>
          </h2>
          <p className="text-white/45 max-w-xl mx-auto">ครอบคลุมทุกแผนก ตั้งแต่ front desk ถึง back office ไม่ต้องใช้ซอฟต์แวร์หลายตัวอีกต่อไป</p>
        </motion.div>

        <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {MGMT_FEATURES.map(f => {
            const Icon = f.icon;
            return (
              <motion.div key={f.title} variants={fadeUp}
                className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 hover:border-white/15 rounded-2xl p-5 transition-all duration-300 cursor-default overflow-hidden">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle at 20% 20%, ${f.color}15 0%, transparent 60%)` }} />
                <div className="relative">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${f.color}18`, border: `1px solid ${f.color}30` }}>
                    <Icon className="h-5 w-5" style={{ color: f.color }} />
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-2 group-hover:text-white transition-colors">{f.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed group-hover:text-white/55 transition-colors">{f.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </Section>
  );
}

/* ─── Guest Portal ───────────────────────────────────────────────────────── */

function GuestPortal() {
  return (
    <Section id="guest" className="py-24 bg-[#0A090E]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: content */}
          <div>
            <motion.div variants={fadeUp}>
              <div className="inline-flex items-center gap-2 text-xs text-blue-400 border border-blue-400/20 bg-blue-400/5 rounded-full px-4 py-1.5 mb-4">
                <Smartphone className="h-3 w-3" /> Guest Experience
              </div>
              <h2 className="text-4xl lg:text-5xl font-serif font-bold text-white mb-4">
                ประสบการณ์ที่แขก<br />
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">ประทับใจตลอดไป</span>
              </h2>
              <p className="text-white/45 mb-8">Guest Portal ที่ทันสมัย ช่วยให้แขกจัดการทุกอย่างได้เองจากมือถือ ลดภาระ front desk และเพิ่ม satisfaction score</p>
            </motion.div>
            <motion.div variants={staggerContainer} className="space-y-4">
              {GUEST_FEATURES.map(f => {
                const Icon = f.icon;
                return (
                  <motion.div key={f.title} variants={fadeUp}
                    className="flex items-start gap-4 bg-white/[0.03] border border-white/8 rounded-xl p-4 hover:border-white/15 transition-all">
                    <div className="h-9 w-9 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white text-sm mb-0.5">{f.title}</div>
                      <div className="text-xs text-white/40">{f.desc}</div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Right: phone mockup */}
          <motion.div variants={fadeUp} className="flex justify-center">
            <div className="relative">
              {/* Glow */}
              <div className="absolute inset-0 bg-blue-500/10 rounded-3xl blur-3xl scale-110" />
              {/* Phone frame */}
              <div className="relative w-72 rounded-[2.5rem] bg-[#0D0C10] border-2 border-white/15 overflow-hidden shadow-2xl shadow-blue-500/10">
                {/* Phone notch */}
                <div className="absolute top-0 inset-x-0 flex justify-center pt-3 z-10">
                  <div className="h-5 w-24 bg-[#0D0C10] rounded-full border border-white/10" />
                </div>
                {/* Screen content */}
                <div className="pt-10 pb-6 px-4 min-h-[580px] bg-gradient-to-b from-[#0F0E14] to-[#0A090E]">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="text-xs text-white/35">ยินดีต้อนรับกลับ</div>
                      <div className="text-sm font-semibold text-white">คุณสมชาย ใจดี 👋</div>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-[#C66A30]/20 border border-[#C66A30]/30 flex items-center justify-center text-xs font-bold text-[#C66A30]">ส</div>
                  </div>
                  {/* Booking card */}
                  <div className="bg-white/[0.07] border border-white/10 rounded-2xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-medium text-white">การจองปัจจุบัน</div>
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-full px-2 py-0.5">Active</span>
                    </div>
                    <div className="text-sm font-bold text-white mb-1">Deluxe Room · ห้อง 301</div>
                    <div className="text-xs text-white/40">17 พ.ค. — 20 พ.ค. 2026 · 3 คืน</div>
                    <div className="mt-3 flex gap-2">
                      <button className="flex-1 bg-[#C66A30]/90 text-white text-[10px] font-medium py-2 rounded-lg">Check-in ออนไลน์</button>
                      <button className="flex-1 bg-white/8 text-white/60 text-[10px] font-medium py-2 rounded-lg border border-white/10">ดูรายละเอียด</button>
                    </div>
                  </div>
                  {/* Quick actions */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[['🛎️', 'Room\nService'], ['🧹', 'เรียก\nแม่บ้าน'], ['💳', 'ดูบิล']].map(([em, label]) => (
                      <div key={label} className="bg-white/[0.04] border border-white/8 rounded-xl p-3 text-center">
                        <div className="text-lg mb-1">{em}</div>
                        <div className="text-[9px] text-white/50 leading-tight whitespace-pre-line">{label}</div>
                      </div>
                    ))}
                  </div>
                  {/* Loyalty */}
                  <div className="bg-gradient-to-r from-[#C66A30]/15 to-[#C4952A]/10 border border-[#C66A30]/20 rounded-xl p-3 flex items-center gap-3">
                    <Star className="h-4 w-4 text-[#C66A30] shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-white">Loyalty Points</div>
                      <div className="text-[10px] text-white/40">2,450 แต้ม · อีก 550 แต้มรับ free night</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}

/* ─── Compliance / AI highlight ─────────────────────────────────────────── */

function Highlights() {
  return (
    <Section className="py-24 bg-[#07060A]">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-8">
        {/* AI */}
        <motion.div variants={fadeUp}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500/8 to-transparent border border-violet-500/15 p-8">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="h-12 w-12 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center mb-6">
              <Bot className="h-6 w-6 text-violet-400" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-white mb-3">AI ที่เข้าใจงานโรงแรม</h3>
            <p className="text-white/45 mb-6 text-sm leading-relaxed">Concierge AI ตอบแขก 14 ภาษาอัตโนมัติ 24/7 ผ่าน LINE, WhatsApp, Email, Web Chat — วิเคราะห์ sentiment, routing ถึงพนักงานที่ใช่</p>
            <div className="flex flex-wrap gap-2">
              {['🇹🇭 ไทย', '🇬🇧 English', '🇨🇳 中文', '🇯🇵 日本語', '🇰🇷 한국어', '🇷🇺 Русский', '🇩🇪 Deutsch', '+7 ภาษา'].map(l => (
                <span key={l} className="text-xs bg-violet-500/10 border border-violet-500/15 text-violet-300/70 rounded-full px-3 py-1">{l}</span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Compliance */}
        <motion.div variants={fadeUp}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#C66A30]/8 to-transparent border border-[#C66A30]/15 p-8">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#C66A30]/8 rounded-full blur-3xl" />
          <div className="relative">
            <div className="h-12 w-12 rounded-2xl bg-[#C66A30]/15 border border-[#C66A30]/20 flex items-center justify-center mb-6">
              <Shield className="h-6 w-6 text-[#C66A30]" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-white mb-3">Compliance ไทยอัตโนมัติ</h3>
            <p className="text-white/45 mb-6 text-sm leading-relaxed">ออกแบบมาเพื่อกฎหมายไทยโดยเฉพาะ ส่ง ทร.30 อัตโนมัติ, e-Tax invoice, PDPA compliance ไม่ต้องกังวลค่าปรับหรือการตรวจสอบ</p>
            <div className="space-y-2.5">
              {[['ทร.30', 'ส่งตำรวจท้องที่อัตโนมัติทุกวัน'], ['e-Tax Invoice', 'ใบกำกับภาษีอิเล็กทรอนิกส์ตามมาตรฐาน สรรพากร'], ['PDPA', 'จัดการข้อมูลส่วนบุคคลตาม พ.ร.บ.คุ้มครองข้อมูล']].map(([badge, desc]) => (
                <div key={badge} className="flex items-start gap-3">
                  <span className="shrink-0 text-xs bg-[#C66A30]/15 border border-[#C66A30]/20 text-[#C66A30] rounded-md px-2 py-0.5 font-medium">{badge}</span>
                  <span className="text-xs text-white/40">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

/* ─── Testimonials ───────────────────────────────────────────────────────── */

function Testimonials() {
  return (
    <Section className="py-24 bg-[#0A090E]">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div variants={fadeUp} className="text-center mb-14">
          <h2 className="text-4xl font-serif font-bold text-white mb-3">เสียงจากเจ้าของโรงแรมจริง</h2>
          <p className="text-white/40">142+ โรงแรมทั่วประเทศไทยไว้วางใจ Maitri</p>
        </motion.div>
        <motion.div variants={staggerContainer} className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map(t => (
            <motion.div key={t.name} variants={fadeUp}
              className="bg-white/[0.03] border border-white/8 hover:border-white/15 rounded-2xl p-6 transition-all hover:bg-white/[0.05]">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-[#C66A30] text-[#C66A30]" />)}
              </div>
              <p className="text-sm text-white/65 leading-relaxed mb-6">{t.text}</p>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#C66A30] to-[#A4522A] flex items-center justify-center text-sm font-bold text-white">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{t.name}</div>
                  <div className="text-xs text-white/35">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

/* ─── CTA ────────────────────────────────────────────────────────────────── */

function CTA() {
  return (
    <Section id="pricing" className="py-28 bg-[#07060A]">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div variants={fadeUp}>
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-[#C66A30]/20 rounded-3xl blur-3xl scale-150" />
            <div className="relative bg-gradient-to-br from-[#C66A30]/10 to-[#C4952A]/5 border border-[#C66A30]/20 rounded-3xl px-10 py-12">
              <div className="text-xs text-[#C66A30] border border-[#C66A30]/25 rounded-full px-4 py-1.5 inline-block mb-6">
                🎉 ทดลองใช้ฟรี 60 วัน — ไม่ต้องใช้บัตรเครดิต
              </div>
              <h2 className="text-4xl lg:text-5xl font-serif font-bold text-white mb-4">
                พร้อมยกระดับโรงแรม<br />ของคุณแล้วหรือยัง?
              </h2>
              <p className="text-white/45 mb-8 max-w-lg mx-auto">เริ่มต้นได้ภายใน 1 วัน ทีมงานพร้อม onboard และสอนใช้งานให้ทีมของคุณ</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/owner/login?tab=register"
                  className="flex items-center gap-2 bg-[#C66A30] hover:bg-[#A4522A] text-white font-semibold px-8 py-4 rounded-xl transition-all hover:scale-[1.02] shadow-xl shadow-[#C66A30]/30 text-sm">
                  เริ่มต้นฟรีเดี๋ยวนี้ <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/owner/login"
                  className="flex items-center gap-2 text-white/70 hover:text-white border border-white/15 hover:border-white/30 px-8 py-4 rounded-xl transition-all bg-white/[0.03] text-sm">
                  มีบัญชีแล้ว เข้าสู่ระบบ
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-white/30">
                {['Setup ภายใน 1 วัน', 'ไม่ต้องจ้าง IT', 'ทีม Support ภาษาไทย 24/7', 'ยกเลิกได้ทุกเมื่อ'].map(f => (
                  <span key={f} className="flex items-center gap-1.5"><Lock className="h-3 w-3 text-white/20" />{f}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

/* ─── Footer ─────────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="bg-[#07060A] border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#C66A30] to-[#A4522A] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5"><path d="M4 20V4h4l4 8 4-8h4v16h-3V9l-3 6h-4L7 9v11H4z" fill="white"/></svg>
          </div>
          <span className="font-serif font-semibold text-white">Maitri PMS</span>
          <span className="text-white/25 text-xs">© 2026</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-white/30">
          {['นโยบายความเป็นส่วนตัว', 'เงื่อนไขการใช้งาน', 'ติดต่อเรา'].map(l => (
            <a key={l} href="#" className="hover:text-white/60 transition-colors">{l}</a>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-white/30">
          <Link href="/portal/login" className="hover:text-white/60 transition-colors">Guest Portal</Link>
          <span>·</span>
          <Link href="/owner/login" className="hover:text-white/60 transition-colors">Owner Login</Link>
        </div>
      </div>
    </footer>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function OwnerLandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="bg-[#07060A] text-[#F8F4EE] overflow-x-hidden">
      <Nav scrolled={scrolled} />
      <Hero />
      <Features />
      <GuestPortal />
      <Highlights />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}
