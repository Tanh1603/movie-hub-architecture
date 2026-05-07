import { Button } from '@movie-hub/shacdn-ui/button';
import { Badge } from '@movie-hub/shacdn-ui/badge';
import {
  Coffee,
  Wifi,
  Leaf,
  Clock,
  MapPin,
  ArrowLeft,
  CupSoda,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function CoffeeServicePage() {
  return (
    <div className="min-h-screen bg-[#020817] text-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=2070&auto=format&fit=crop"
            alt="Movie Coffee Shop"
            fill
            className="object-cover opacity-50 scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-[#020817]/60 to-transparent" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-6">
          <Link
            href="/services"
            className="inline-flex items-center text-amber-500 hover:text-amber-400 transition-colors mb-4 group"
          >
            <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Quay lại Dịch vụ
          </Link>
          <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 px-4 py-1.5 text-sm uppercase tracking-widest">
            Thư giãn & Kết nối
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">
            MOVIE <span className="text-amber-600">COFFEE</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Hương vị cà phê rang xay nguyên bản trong không gian đậm chất điện
            ảnh. Nơi lý tưởng để chờ đợi suất chiếu hoặc thảo luận về những bộ
            phim yêu thích.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative group">
            <div className="absolute -inset-4 bg-amber-500/20 blur-2xl rounded-3xl opacity-50 group-hover:opacity-100 transition duration-500" />
            <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop"
                alt="Barista at work"
                fill
                className="object-cover group-hover:scale-110 transition duration-700"
              />
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold border-l-4 border-amber-600 pl-6">
                Chất Lượng Trong Từng Giọt
              </h2>
              <p className="text-lg text-gray-400 leading-relaxed">
                Chúng tôi tự hào sử dụng những hạt cà phê Arabica và Robusta
                tuyển chọn từ những vùng đất danh tiếng của Việt Nam. Với sự kết
                hợp giữa truyền thống và các kỹ thuật pha chế hiện đại như Cold
                Brew, Espresso, Pour Over, mỗi tách cà phê tại MovieHub đều kể
                một câu chuyện riêng.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: 'Cà phê đặc sản',
                  desc: 'Rang xay chuyên biệt, giữ trọn hương vị nguyên bản.',
                },
                {
                  title: 'Không gian làm việc',
                  desc: 'Wifi tốc độ cao, hệ thống ổ cắm điện đầy đủ mọi nơi.',
                },
                {
                  title: 'Bánh ngọt hàng ngày',
                  desc: 'Được nướng mới tại quầy, phù hợp kèm cà phê.',
                },
                {
                  title: 'Đồ uống healthy',
                  desc: 'Nước ép trái cây tươi và trà thảo mộc organic.',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex gap-4 items-start bg-amber-600/5 p-5 rounded-2xl border border-amber-600/10"
                >
                  <Leaf className="text-amber-600 shrink-0 w-6 h-6" />
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
            <div className="w-16 h-16 bg-amber-600/20 rounded-2xl flex items-center justify-center text-amber-600">
              <Clock size={32} />
            </div>
            <h3 className="text-xl font-bold font-white">Giờ Phục Vụ</h3>
            <p className="text-gray-400">
              7:00 AM - 10:30 PM <br /> Đồng hành cùng rạp chiếu
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4 p-8 bg-white/5 rounded-3xl border border-white/10">
            <div className="w-16 h-16 bg-amber-600/20 rounded-2xl flex items-center justify-center text-amber-600">
              <Wifi size={32} />
            </div>
            <h3 className="text-xl font-bold font-white">Tiện Nghi</h3>
            <p className="text-gray-400">
              Miễn phí Internet <br /> Ghế sofa siêu êm ái
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4 p-8 bg-white/5 rounded-3xl border border-white/10">
            <div className="w-16 h-16 bg-amber-600/20 rounded-2xl flex items-center justify-center text-amber-600">
              <MapPin size={32} />
            </div>
            <h3 className="text-xl font-bold font-white">Vị Trí</h3>
            <p className="text-gray-400">
              Sảnh chính Tầng 1 <br /> Gần khu vực soát vé
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center px-4">
        <h2 className="text-4xl font-bold mb-8 uppercase tracking-wide">
          Thưởng Thức Hương Vị Nguyên Bản
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-14 px-8 rounded-full shadow-lg shadow-amber-900/40 transition-all hover:scale-105"
          >
            Xem Menu Đồ Uống
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-amber-600/50 text-amber-400 hover:bg-amber-500/10 h-14 px-8 rounded-full transition-all"
          >
            <CupSoda size={20} className="mr-2" /> Combo Ưu Đãi
          </Button>
        </div>
      </section>
    </div>
  );
}
