'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export function HomeNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-[#1C1410]/90 backdrop-blur-xl border-b border-white/8">
      <div className="container max-w-7xl flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="h-9 w-9 bg-gradient-to-br from-[#C66A30] to-[#A4522A] rounded-xl flex items-center justify-center shadow-lg shadow-[#C66A30]/25">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="font-serif text-xl font-semibold text-white tracking-tight">Maitri</span>
        </Link>

        <div className="hidden md:flex items-center gap-7 text-sm font-medium text-white/70">
          <Link href="/search" className="hover:text-white transition-colors">ค้นหาที่พัก</Link>
          <a href="#destinations" className="hover:text-white transition-colors">จุดหมาย</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">วิธีจอง</a>
          <a href="#reviews" className="hover:text-white transition-colors">รีวิว</a>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/portal/login"
            className="hidden sm:inline-flex text-sm text-white/80 hover:text-white px-4 py-2 rounded-xl hover:bg-white/10 transition-all font-medium">
            เข้าสู่ระบบ
          </Link>
          <Link href="/portal/login"
            className="text-sm bg-[#C66A30] hover:bg-[#B05B28] text-white px-5 py-2 rounded-full font-semibold transition-colors shadow-lg shadow-[#C66A30]/30">
            สมัครสมาชิก
          </Link>
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setOpen(o => !o)}
            className="md:hidden ml-1 p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all"
            aria-label={open ? 'ปิดเมนู' : 'เปิดเมนู'}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-white/8 bg-[#1C1410]/95 backdrop-blur-xl">
          <div className="container px-4 py-4 flex flex-col gap-1">
            <Link href="/search" onClick={() => setOpen(false)}
              className="py-3 px-3 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/8 transition-all">
              ค้นหาที่พัก
            </Link>
            <a href="#destinations" onClick={() => setOpen(false)}
              className="py-3 px-3 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/8 transition-all">
              จุดหมาย
            </a>
            <a href="#how-it-works" onClick={() => setOpen(false)}
              className="py-3 px-3 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/8 transition-all">
              วิธีจอง
            </a>
            <a href="#reviews" onClick={() => setOpen(false)}
              className="py-3 px-3 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/8 transition-all">
              รีวิว
            </a>
            <div className="mt-2 pt-3 border-t border-white/8">
              <Link href="/portal/login" onClick={() => setOpen(false)}
                className="flex items-center justify-center py-2.5 rounded-xl text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-all">
                เข้าสู่ระบบ
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
