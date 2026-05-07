import { Button } from '@movie-hub/shacdn-ui/button';
import { Badge } from '@movie-hub/shacdn-ui/badge';
import {
  Utensils,
  Clock,
  Star,
  MapPin,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function DiningServicePage() {
  return (
    <div className="min-h-screen bg-[#020817] text-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop"
            alt="Fine Dining"
            fill
            className="object-cover opacity-40 scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-[#020817]/60 to-transparent" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-6">
          <Link
            href="/services"
            className="inline-flex items-center text-orange-400 hover:text-orange-300 transition-colors mb-4 group"
          >
            <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Quay lại Dịch vụ
          </Link>
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 px-4 py-1.5 text-sm uppercase tracking-widest">
            Trải nghiệm ẩm thực
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">
            Nhà Hàng <span className="text-orange-500">5 Sao</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Thưởng thức nghệ thuật ẩm thực tinh tế trước hoặc sau mỗi suất
            chiếu. Nơi kết nối niềm vui điện ảnh và hương vị thượng hạng.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold border-l-4 border-orange-500 pl-6">
                Tinh Hoa Ẩm Thực Á - Âu
              </h2>
              <p className="text-lg text-gray-400 leading-relaxed">
                Tại MovieHub Dining, chúng tôi không chỉ phục vụ món ăn, chúng
                tôi mang đến một trải nghiệm cảm quan đầy đầy đủ. Với đội ngũ
                đầu bếp đạt sao Michelin, thực đơn của chúng tôi được thiết kế
                để làm hài lòng cả những thực khách khó tính nhất.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: 'Nguyên liệu tươi sạch',
                  desc: 'Tuyển chọn từ các nguồn cung ứng uy tín nhất hàng ngày.',
                },
                {
                  title: 'Không gian sang trọng',
                  desc: 'Kiến trúc hiện đại, ấm cúng và đầy tính nghệ thuật.',
                },
                {
                  title: 'Phục vụ tận tâm',
                  desc: 'Đội ngũ nhân viên chuyên nghiệp, am hiểu về ẩm thực.',
                },
                {
                  title: 'Combo xem phim',
                  desc: 'Ưu đãi đặc biệt khi kết hợp đặt vé và dùng bữa.',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex gap-4 items-start bg-orange-500/5 p-5 rounded-2xl border border-orange-500/10"
                >
                  <CheckCircle2 className="text-orange-500 shrink-0 w-6 h-6" />
                  <div>
                    <h4 className="font-bold text-white mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-4 bg-orange-500/20 blur-2xl rounded-3xl opacity-50 group-hover:opacity-100 transition duration-500" />
            <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop"
                alt="Chef preparing food"
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
            <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-500">
              <Clock size={32} />
            </div>
            <h3 className="text-xl font-bold font-white">Giờ Mở Cửa</h3>
            <p className="text-gray-400">
              9:00 AM - 11:00 PM <br /> Tất cả các ngày trong tuần
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4 p-8 bg-white/5 rounded-3xl border border-white/10">
            <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-500">
              <Star size={32} />
            </div>
            <h3 className="text-xl font-bold font-white">Đánh Giá</h3>
            <p className="text-gray-400">
              4.9/5 từ hơn 1000+ <br /> thực khách thân thiết
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4 p-8 bg-white/5 rounded-3xl border border-white/10">
            <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-500">
              <MapPin size={32} />
            </div>
            <h3 className="text-xl font-bold font-white">Vị Trí</h3>
            <p className="text-gray-400">
              Tầng 4 & 5 <br /> Các cụm rạp MovieHub Premium
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center px-4">
        <h2 className="text-4xl font-bold mb-8 uppercase tracking-wide">
          Đặt Bàn Ngay Hôm Nay
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-14 px-8 rounded-full shadow-lg shadow-orange-900/40 transition-all hover:scale-105"
          >
            Đặt Chỗ Ngay
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 h-14 px-8 rounded-full transition-all"
          >
            Xem Thực Đơn
          </Button>
        </div>
      </section>
    </div>
  );
}
