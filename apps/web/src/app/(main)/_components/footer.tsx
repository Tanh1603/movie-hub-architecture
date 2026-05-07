'use client';

import {
  Clapperboard,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@movie-hub/shacdn-ui/button';
import { useGetAllCinemas } from '@/hooks/cinema-hooks';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@movie-hub/shacdn-ui/popover';
import { Skeleton } from '@movie-hub/shacdn-ui/skeleton';
import { CinemaDetailResponse } from '@movie-hub/shared-types';

export const Footer = () => {
  const { data: cinemas, isLoading } = useGetAllCinemas();

  return (
    <footer className="w-full bg-gradient-to-r from-[#4c1e93] to-[#2c1458] text-gray-300 pt-16 pb-8 border-t border-white/5 mt-0 relative z-10">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 md:px-12 lg:px-24 xl:px-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 lg:gap-8 xl:gap-12 mb-12">
          {/* Column 1: Brand, Slogan & Actions */}
          <div className="space-y-6">
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Clapperboard size={40} className="text-white fill-yellow-400" />
              <span className="text-3xl font-black text-white uppercase tracking-wider">
                MovieHub
              </span>
            </Link>

            <p className="text-white font-bold uppercase tracking-widest text-sm">
              BE HAPPY, BE A STAR
            </p>

            <div className="flex gap-4">
              <Button className="font-bold uppercase bg-yellow-400 text-black hover:bg-yellow-500 rounded px-6 shadow-lg shadow-yellow-400/20">
                ĐẶT VÉ
              </Button>
              <Button className="font-bold uppercase bg-purple-600 text-white hover:bg-purple-700 rounded px-6 shadow-lg shadow-purple-600/30">
                ĐẶT BẮP NƯỚC
              </Button>
            </div>

            <div className="flex gap-4 pt-2">
              <a
                href="#"
                className="hover:text-white transition-colors bg-white/10 p-2 rounded-full hover:bg-white/20"
              >
                <Facebook size={18} />
              </a>
              <a
                href="#"
                className="hover:text-white transition-colors bg-white/10 p-2 rounded-full hover:bg-white/20"
              >
                <Youtube size={18} />
              </a>
              <a
                href="#"
                className="hover:text-white transition-colors bg-white/10 p-2 rounded-full hover:bg-white/20"
              >
                <Instagram size={18} />
              </a>
              <a
                href="#"
                className="hover:text-white transition-colors bg-white/10 p-2 rounded-full hover:bg-white/20"
              >
                <Twitter size={18} />
              </a>
            </div>

            <div className="flex items-center gap-2 text-white/80 text-sm font-bold">
              <span>Ngôn ngữ:</span>
              <div className="flex items-center gap-1 cursor-pointer hover:text-white">
                <span className="text-xl">🇻🇳</span> VN
              </div>
            </div>
          </div>

          {/* Column 2: Account, Renting, Introduction - Combined for spacing efficiency or exact list match */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-8">
            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg uppercase tracking-wide">
                Tài Khoản
              </h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link
                    href="/login"
                    className="hover:text-yellow-400 transition-colors"
                  >
                    Đăng nhập
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="hover:text-yellow-400 transition-colors"
                  >
                    Đăng ký
                  </Link>
                </li>
                <li>
                  <Link
                    href="/membership"
                    className="hover:text-yellow-400 transition-colors"
                  >
                    Membership
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg uppercase tracking-wide">
                Thuê Sự Kiện
              </h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link
                    href="/rent"
                    className="hover:text-yellow-400 transition-colors"
                  >
                    Thuê rạp
                  </Link>
                </li>
                <li>
                  <Link
                    href="/rent"
                    className="hover:text-yellow-400 transition-colors"
                  >
                    Các loại hình thuê
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4 col-span-2">
              <h3 className="text-white font-bold text-lg uppercase tracking-wide">
                Giới Thiệu
              </h3>
              <ul className="space-y-2 text-sm text-gray-400 grid grid-cols-2 gap-x-4">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-yellow-400 transition-colors"
                  >
                    Về chúng tôi
                  </Link>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="hover:text-yellow-400 transition-colors"
                  >
                    Tuyển dụng
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-yellow-400 transition-colors"
                  >
                    Liên hệ
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 3: Services */}
          <div className="space-y-6">
            <h3 className="text-white font-bold text-lg uppercase tracking-wide">
              Dịch Vụ Khác
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <Link
                  href="/services/dining"
                  className="hover:text-yellow-400 transition-colors"
                >
                  Nhà hàng
                </Link>
              </li>
              <li>
                <Link
                  href="/services/kids"
                  className="hover:text-yellow-400 transition-colors"
                >
                  Kidzone
                </Link>
              </li>
              <li>
                <Link
                  href="/services/bowling"
                  className="hover:text-yellow-400 transition-colors"
                >
                  Bowling
                </Link>
              </li>
              <li>
                <Link
                  href="/services/billiards"
                  className="hover:text-yellow-400 transition-colors"
                >
                  Billiards
                </Link>
              </li>
              <li>
                <Link
                  href="/services/gym"
                  className="hover:text-yellow-400 transition-colors"
                >
                  Gym
                </Link>
              </li>
              <li>
                <Link
                  href="/services/coffee"
                  className="hover:text-yellow-400 transition-colors"
                >
                  Coffee
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Cinema System */}
          <div className="space-y-6">
            <h3 className="text-white font-bold text-lg uppercase tracking-wide">
              Hệ Thống Rạp
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Skeleton className="w-4 h-4 bg-white/10" />
                    <Skeleton className="w-40 h-4 bg-white/10" />
                  </li>
                ))
              ) : cinemas && cinemas.length > 0 ? (
                cinemas.map((cinema: CinemaDetailResponse) => (
                  <Popover key={cinema.id}>
                    <PopoverTrigger asChild>
                      <li className="flex items-start gap-2 group cursor-pointer hover:text-white transition-colors">
                        <MapPin
                          size={16}
                          className="mt-1 text-yellow-400 shrink-0 group-hover:fill-current"
                        />
                        <span className="line-clamp-1">
                          {cinema.name} ({cinema.city})
                        </span>
                      </li>
                    </PopoverTrigger>
                    <PopoverContent
                      side="top"
                      className="w-80 p-0 bg-zinc-900 border-zinc-800 shadow-2xl rounded-xl overflow-hidden z-[100]"
                    >
                      <div
                        className="relative w-full aspect-video cursor-pointer group"
                        onClick={() => {
                          const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            cinema.name + ' ' + cinema.address
                          )}`;
                          window.open(mapUrl, '_blank');
                        }}
                      >
                        {cinema.latitude && cinema.longitude ? (
                          <iframe
                            src={`https://maps.google.com/maps?q=${cinema.latitude},${cinema.longitude}&z=15&output=embed`}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            title={cinema.name}
                            className="pointer-events-none"
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-800 flex flex-col items-center justify-center text-zinc-500 gap-2">
                            <MapPin size={24} />
                            <span className="text-xs">
                              Bản đồ không khả dụng
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                          <div className="bg-primary hover:bg-primary/90 text-white text-xs font-bold py-2 px-4 rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 text-center">
                            Xem trên Google Maps
                          </div>
                        </div>
                      </div>
                      <div className="p-4 text-xs text-zinc-400 space-y-1">
                        <p className="text-white font-bold text-sm">
                          {cinema.name}
                        </p>
                        <p className="line-clamp-2 leading-relaxed">
                          {cinema.address}
                        </p>
                        {cinema.phone && (
                          <p className="pt-1 text-zinc-500">
                            Hotline: {cinema.phone}
                          </p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                ))
              ) : (
                <li className="text-zinc-500">Đang cập nhật rạp...</li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 mt-8 flex flex-col items-center text-center gap-4 text-sm text-gray-400">
          <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-center">
            <p>
              Copyright © {new Date().getFullYear()} MovieHub. All rights
              reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="/privacy"
                className="hover:text-white transition-colors"
              >
                Chính sách bảo mật
              </Link>
              <Link href="/news" className="hover:text-white transition-colors">
                Tin điện ảnh
              </Link>
              <Link href="/faq" className="hover:text-white transition-colors">
                Hỏi và đáp
              </Link>
            </div>
          </div>
          {/* Disclaimer / Badge */}
          <div className="flex flex-col items-center gap-2 opacity-80 mt-4">
            <div
              className="w-32 h-10 bg-contain bg-no-repeat bg-center"
              style={{
                backgroundImage:
                  "url('https://images.dmca.com/Badges/dmca_protected_sml_120n.png?ID=fac353e6-7640-4235-9856-AD43')",
              }}
            />
            <p className="text-xs max-w-2xl">
              CÔNG TY CỔ PHẦN GIẢI TRÍ PHÁT HÀNH PHIM - RẠP CHIẾU PHIM NGÔI SAO{' '}
              <br />
              ĐỊA CHỈ: 135 HAI BÀ TRƯNG, PHƯỜNG BẾN NGHÉ, QUẬN 1, TP.HCM
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
