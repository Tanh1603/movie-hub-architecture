import { Button } from '@movie-hub/shacdn-ui/button';
import { Badge } from '@movie-hub/shacdn-ui/badge';
import {
  Trophy,
  Zap,
  Users,
  Clock,
  MapPin,
  ArrowLeft,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function BowlingServicePage() {
  return (
    <div className="min-h-screen bg-[#020817] text-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1614713568397-b31b779d0498?w=2070&auto=format&fit=crop"
            alt="Bowling Alley"
            fill
            className="object-cover opacity-50 scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-[#020817]/60 to-transparent" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-6">
          <Link
            href="/services"
            className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors mb-4 group"
          >
            <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Quay lại Dịch vụ
          </Link>
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 px-4 py-1.5 text-sm uppercase tracking-widest">
            Thể thao giải trí
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">
            BOWLING <span className="text-blue-500">CENTER</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Trải nghiệm những cú Strike ngoạn mục trên đường băng chuẩn quốc tế.
            Điểm hẹn lý tưởng cho những cuộc vui cùng bạn bè và đồng nghiệp.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold border-l-4 border-blue-500 pl-6">
                Công Nghệ Dẫn Đầu
              </h2>
              <p className="text-lg text-gray-400 leading-relaxed">
                Hệ thống 12 đường băng MovieHub Bowling được trang bị công nghệ
                tự động hóa từ Mỹ, mang lại độ chính xác cao nhất cho mỗi lần
                ném. Không gian âm nhạc sôi động và hệ thống ánh sáng neon hiện
                đại sẽ làm tăng thêm sự hào hứng cho mỗi trận đấu.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: 'Đường băng chuẩn quốc tế',
                  desc: 'Mặt băng phẳng tuyệt đối, bảo trì và tra dầu định kỳ.',
                },
                {
                  title: 'Hệ thống điểm tự động',
                  desc: 'Màn hình hiển thị 4K sắc nét, cập nhật điểm số tức thì.',
                },
                {
                  title: 'Quầy Bar & Snack',
                  desc: 'Phục vụ đồ uống và thức ăn nhẹ tận vị trí chơi.',
                },
                {
                  title: 'Team Building',
                  desc: 'Gói dịch vụ riêng cho doanh nghiệp và nhóm bạn đông.',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex gap-4 items-start bg-blue-500/5 p-5 rounded-2xl border border-blue-500/10"
                >
                  <Target className="text-blue-500 shrink-0 w-6 h-6" />
                  <div>
                    <h4 className="font-bold text-white mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-4 bg-blue-500/20 blur-2xl rounded-3xl opacity-50 group-hover:opacity-100 transition duration-500" />
            <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1545056453-f0359c3df6db?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Bowling ball hitting pins"
                fill
                className="object-cover group-hover:scale-110 transition duration-700"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Info Boxes */}
      <section className="bg-[#0f172a] py-20">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center space-y-4 p-8 bg-white/5 rounded-3xl border border-white/10">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
              <Clock size={32} />
            </div>
            <h3 className="text-xl font-bold font-white">Giờ Hoạt Động</h3>
            <p className="text-gray-400">
              10:00 AM - 12:00 PM <br /> Sôi động về đêm
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4 p-8 bg-white/5 rounded-3xl border border-white/10">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
              <Trophy size={32} />
            </div>
            <h3 className="text-xl font-bold font-white">Giải Đấu</h3>
            <p className="text-gray-400">
              Hàng tháng cho <br /> các cộng đồng thủ lĩnh
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4 p-8 bg-white/5 rounded-3xl border border-white/10">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
              <MapPin size={32} />
            </div>
            <h3 className="text-xl font-bold font-white">Vị Trí</h3>
            <p className="text-gray-400">
              Tầng B1 & B2 <br /> MovieHub Entertainment Complex
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center px-4">
        <h2 className="text-4xl font-bold mb-8 uppercase tracking-wide">
          Bạn Có Sẵn Sàng Cho Một Cú Strike?
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-14 px-8 rounded-full shadow-lg shadow-blue-900/40 transition-all hover:scale-105"
          >
            <Zap size={20} className="mr-2 fill-current" /> Đặt Làn Ngay
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 h-14 px-8 rounded-full transition-all"
          >
            <Users size={20} className="mr-2" /> Đặt Tiệc Theo Nhóm
          </Button>
        </div>
      </section>
    </div>
  );
}
