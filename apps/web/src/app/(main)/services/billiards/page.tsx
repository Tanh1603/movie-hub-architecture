import { Button } from '@movie-hub/shacdn-ui/button';
import { Badge } from '@movie-hub/shacdn-ui/badge';
import {
  Gamepad2,
  Beer,
  Users,
  Clock,
  MapPin,
  ArrowLeft,
  Disc,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function BilliardsServicePage() {
  return (
    <div className="min-h-screen bg-[#020817] text-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1654338768506-53756875b028?q=80&w=2070&auto=format&fit=crop"
            alt="Billiards Tables"
            fill
            className="object-cover opacity-50 scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-[#020817]/60 to-transparent" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-6">
          <Link
            href="/services"
            className="inline-flex items-center text-green-400 hover:text-green-300 transition-colors mb-4 group"
          >
            <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Quay lại Dịch vụ
          </Link>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-4 py-1.5 text-sm uppercase tracking-widest">
            Câu lạc bộ giải trí
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">
            BILLIARDS <span className="text-green-500">CLUB</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Nơi hội tụ những cơ thủ đam mê và tìm kiếm sự chuẩn xác tuyệt đối.
            Không gian thượng lưu, bàn đấu đẳng cấp quốc tế.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative group">
            <div className="absolute -inset-4 bg-green-500/20 blur-2xl rounded-3xl opacity-50 group-hover:opacity-100 transition duration-500" />
            <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1692115272001-978ff4a5e848?q=80&w=1548&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Billiards game"
                fill
                className="object-cover group-hover:scale-110 transition duration-700"
              />
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold border-l-4 border-green-500 pl-6">
                Trải Nghiệm Đẳng Cấp
              </h2>
              <p className="text-lg text-gray-400 leading-relaxed">
                Tại MovieHub Billiards Club, chúng tôi cung cấp hệ thống bàn
                Pool và Carom chất lượng cao nhất. Từng cây cơ, từng viên bi đều
                được chăm sóc tỷ mỉ để đảm bảo trải nghiệm chơi mượt mà nhất cho
                mọi cơ thủ.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: 'Bàn thi đấu tiêu chuẩn',
                  desc: 'Mặt đá tự nhiên, vải phủ cao cấp cho độ lăn chuẩn xác.',
                },
                {
                  title: 'Phụ kiện cao cấp',
                  desc: 'Sử dụng bi Aramith và các loại cơ thi đấu chuyên nghiệp.',
                },
                {
                  title: 'Phục vụ tại chỗ',
                  desc: 'Menu đồ uống đa dạng, phục vụ ngay tại bàn đấu.',
                },
                {
                  title: 'Hệ thống điều hòa',
                  desc: 'Nhiệt độ luôn ổn định để bảo quản thiết bị tốt nhất.',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex gap-4 items-start bg-green-500/5 p-5 rounded-2xl border border-green-500/10"
                >
                  <Disc className="text-green-500 shrink-0 w-6 h-6" />
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
            <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-500">
              <Clock size={32} />
            </div>
            <h3 className="text-xl font-bold font-white">Thời Gian</h3>
            <p className="text-gray-400">
              10:00 AM - 1:00 AM <br /> Mở cửa cực muộn
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4 p-8 bg-white/5 rounded-3xl border border-white/10">
            <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-500">
              <Beer size={32} />
            </div>
            <h3 className="text-xl font-bold font-white">Tiện Ích</h3>
            <p className="text-gray-400">
              Snack Bar & Cocktails <br /> Khu vực hút thuốc riêng
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4 p-8 bg-white/5 rounded-3xl border border-white/10">
            <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-500">
              <MapPin size={32} />
            </div>
            <h3 className="text-xl font-bold font-white">Vị Trí</h3>
            <p className="text-gray-400">
              Tầng 6 <br /> Đối diện khu vực xem phim
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center px-4">
        <h2 className="text-4xl font-bold mb-8 uppercase tracking-wide">
          Trình Diễn Kỹ Năng Của Bạn
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white font-bold h-14 px-8 rounded-full shadow-lg shadow-green-900/40 transition-all hover:scale-105"
          >
            Đặt Bàn Giao Lưu
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-green-500/50 text-green-400 hover:bg-green-500/10 h-14 px-8 rounded-full transition-all"
          >
            <Users size={20} className="mr-2" /> Đăng Ký Hội Viên
          </Button>
        </div>
      </section>
    </div>
  );
}
