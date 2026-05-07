'use client';

import { Button } from '@movie-hub/shacdn-ui/button';
import { Sparkles, Crown, Star, Gift, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { SignUpButton } from '@clerk/nextjs';
import Image from 'next/image';

export default function MembershipSection() {
  return (
    <section className="px-6 w-full py-10">
      <div className="flex flex-col items-center text-center mb-12 space-y-4">
        <span className="text-primary font-bold tracking-widest uppercase text-sm">
          Quyền Lợi Độc Quyền
        </span>
        <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider">
          Chương Trình Thành Viên
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* C'FRIEND Card */}
        <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0f172a] hover:border-blue-500/50 transition-colors duration-500">
          {/* Glow Effect */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all duration-500" />

          <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 z-10">
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 uppercase italic">
                  C&apos;Friend
                </h3>
                <p className="text-gray-400 text-sm font-medium">
                  Thẻ thành viên dành cho các bạn trẻ năng động
                </p>
              </div>

              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Star size={14} fill="currentColor" />
                  </span>
                  <span>Tích lũy điểm đổi vé & bắp nước</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Gift size={14} />
                  </span>
                  <span>Quà tặng sinh nhật hấp dẫn</span>
                </li>
              </ul>

              <Link href="/membership">
                <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl px-8 h-12 shadow-lg shadow-blue-900/50">
                  Tìm Hiểu Ngay <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="relative w-72 h-44 transform group-hover:scale-110 transition-transform duration-500 perspective-1000">
              <div className="relative w-full h-full preserve-3d group-hover:rotate-y-12 transition-transform duration-700">
                {/* Card Image Placeholder */}
                <Image
                  src="https://api-website.cinestar.com.vn/media/wysiwyg/CMSPage/Member/Desktop519x282_CMember.jpg"
                  alt="C'Friend Membership Card"
                  fill
                  className="rounded-2xl object-cover shadow-2xl border border-white/20"
                />

                {/* Glossy Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent rounded-2xl pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* C'VIP Card */}
        <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0f172a] hover:border-purple-500/50 transition-colors duration-500">
          {/* Glow Effect */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-all duration-500" />

          <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 z-10">
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300 uppercase italic">
                  C&apos;VIP
                </h3>
                <p className="text-gray-400 text-sm font-medium">
                  Đẳng cấp thành viên VIP với đặc quyền riêng biệt
                </p>
              </div>

              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <Crown size={14} fill="currentColor" />
                  </span>
                  <span>Ưu đãi vé VIP & Suất chiếu đặc biệt</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <Sparkles size={14} />
                  </span>
                  <span>Quầy phục vụ riêng không chờ đợi</span>
                </li>
              </ul>

              <SignUpButton mode="modal">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl px-8 h-12 shadow-lg shadow-purple-900/50">
                  Đăng Ký VIP <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </SignUpButton>
            </div>

            <div className="relative w-72 h-44 transform group-hover:scale-110 transition-transform duration-500 perspective-1000">
              <div className="relative w-full h-full preserve-3d group-hover:rotate-y-12 transition-transform duration-700">
                {/* Card Image Placeholder */}
                <Image
                  src="https://api-website.cinestar.com.vn/media/.renditions/wysiwyg/CMSPage/Member/c-vip.jpg"
                  alt="C'VIP Membership Card"
                  fill
                  className="rounded-2xl object-cover shadow-2xl border border-white/20"
                />

                {/* Glossy Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent rounded-2xl pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
