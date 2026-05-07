import { Button } from '@movie-hub/shacdn-ui/button';
import { Badge } from '@movie-hub/shacdn-ui/badge';
import {
  Palette,
  ShieldCheck,
  Smile,
  Clock,
  MapPin,
  ArrowLeft,
  Heart,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function KidsServicePage() {
  return (
    <div className="min-h-screen bg-[#020817] text-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1498940757830-82f7813bf178?q=80&w=2070&auto=format&fit=crop"
            alt="Kidzone Playground"
            fill
            className="object-cover opacity-50 scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-[#020817]/60 to-transparent" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-6">
          <Link
            href="/services"
            className="inline-flex items-center text-pink-400 hover:text-pink-300 transition-colors mb-4 group"
          >
            <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Quay lại Dịch vụ
          </Link>
          <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30 px-4 py-1.5 text-sm uppercase tracking-widest">
            Thế giới của bé
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">
            KID<span className="text-pink-500">ZONE</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Nơi khơi nguồn sáng tạo và niềm vui bất tận cho các thiên thần nhỏ.
            An toàn tuyệt đối - Trải nghiệm thú vị - Kỷ niệm đáng nhớ.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative group">
            <div className="absolute -inset-4 bg-pink-500/20 blur-2xl rounded-3xl opacity-50 group-hover:opacity-100 transition duration-500" />
            <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1596464716127-f9a829be9efc?q=80&w=2070&auto=format&fit=crop"
                alt="Children playing"
                fill
                className="object-cover group-hover:scale-110 transition duration-700"
              />
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold border-l-4 border-pink-500 pl-6">
                Vui Chơi & Sáng Tạo
              </h2>
              <p className="text-lg text-gray-400 leading-relaxed">
                Kidzone tại MovieHub được thiết kế theo tiêu chuẩn quốc tế, chia
                thành nhiều khu vực phù hợp với từng độ tuổi. Từ nhà banh, cầu
                trượt đến khu vực vẽ tranh sáng tạo, bé sẽ luôn được vận động và
                học hỏi trong môi trường an toàn nhất.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: 'An toàn tuyệt đối',
                  desc: 'Trang thiết bị bo góc, thảm xốp giảm chấn tiêu chuẩn.',
                },
                {
                  title: 'Giám sát chuyên nghiệp',
                  desc: 'Đội ngũ nhân viên yêu trẻ, luôn túc trực hỗ trợ.',
                },
                {
                  title: 'Xưởng sáng tạo',
                  desc: 'Các lớp workshop vẽ tranh, nặn đất sét hàng tuần.',
                },
                {
                  title: 'Vệ sinh định kỳ',
                  desc: 'Khử khuẩn toàn bộ khu vực sau mỗi ngày hoạt động.',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex gap-4 items-start bg-pink-500/5 p-5 rounded-2xl border border-pink-500/10"
                >
                  <ShieldCheck className="text-pink-500 shrink-0 w-6 h-6" />
                  <div>
                    <h4 className="font-bold text-white mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Info Boxes */}
      <section className="bg-[#0f172a] py-20">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center space-y-4 p-8 bg-white/5 rounded-3xl border border-white/10">
            <div className="w-16 h-16 bg-pink-500/20 rounded-2xl flex items-center justify-center text-pink-500">
              <Clock size={32} />
            </div>
            <h3 className="text-xl font-bold font-white">Giờ Hoạt Động</h3>
            <p className="text-gray-400">
              8:30 AM - 10:00 PM <br /> Phục vụ suốt cả tuần
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4 p-8 bg-white/5 rounded-3xl border border-white/10">
            <div className="w-16 h-16 bg-pink-500/20 rounded-2xl flex items-center justify-center text-pink-500">
              <Smile size={32} />
            </div>
            <h3 className="text-xl font-bold font-white">Độ Tuổi</h3>
            <p className="text-gray-400">
              Từ 2 đến 12 tuổi <br /> (Có khu vực riêng cho bé nhỏ)
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4 p-8 bg-white/5 rounded-3xl border border-white/10">
            <div className="w-16 h-16 bg-pink-500/20 rounded-2xl flex items-center justify-center text-pink-500">
              <MapPin size={32} />
            </div>
            <h3 className="text-xl font-bold font-white">Vị Trí</h3>
            <p className="text-gray-400">
              Tầng 2 & 3 <br /> Cạnh khu vực sảnh rạp
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center px-4">
        <h2 className="text-4xl font-bold mb-8 uppercase tracking-wide">
          Tạo Nên Kỷ Niệm Cho Bé
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-pink-500 hover:bg-pink-600 text-white font-bold h-14 px-8 rounded-full shadow-lg shadow-pink-900/40 transition-all hover:scale-105"
          >
            Mua Vé Vào Cổng
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-pink-500/50 text-pink-400 hover:bg-pink-500/10 h-14 px-8 rounded-full transition-all"
          >
            <Heart size={20} className="mr-2" /> Dịch Vụ Sinh Nhật
          </Button>
        </div>
      </section>
    </div>
  );
}
