import { Button } from '@movie-hub/shacdn-ui/button';
import { Badge } from '@movie-hub/shacdn-ui/badge';
import {
  Dumbbell,
  Activity,
  ShieldCheck,
  Clock,
  MapPin,
  ArrowLeft,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function GymServicePage() {
  return (
    <div className="min-h-screen bg-[#020817] text-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop"
            alt="Gym Fitness Center"
            fill
            className="object-cover opacity-40 scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-[#020817]/60 to-transparent" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-6">
          <Link
            href="/services"
            className="inline-flex items-center text-red-500 hover:text-red-400 transition-colors mb-4 group"
          >
            <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Quay lại Dịch vụ
          </Link>
          <Badge className="bg-red-500/20 text-red-500 border-red-500/30 px-4 py-1.5 text-sm uppercase tracking-widest">
            Sức khỏe & Phái đẹp
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">
            GYM & <span className="text-red-600">FITNESS</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Nâng tầm thể hình, bứt phá giới hạn bản thân với hệ thống thiết bị
            hiện đại hàng đầu. Môi trường tập luyện năng động, truyền cảm hứng.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold border-l-4 border-red-600 pl-6">
                Tập Luyện Không Giới Hạn
              </h2>
              <p className="text-lg text-gray-400 leading-relaxed">
                MovieHub Gym & Fitness mang đến một không gian tập luyện chuyên
                nghiệp với các thiết bị nhập khẩu từ Technogym và Life Fitness.
                Dù bạn là người mới bắt đầu hay vận động viên chuyên nghiệp,
                chúng tôi đều có các chương trình tập luyện phù hợp nhất.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: 'Máy tập hiện đại',
                  desc: 'Đầy đủ khu vực Cardio, tạ rời và các máy cơ chức năng.',
                },
                {
                  title: 'PT chuyên nghiệp',
                  desc: 'Đội ngũ huấn luyện viên có bằng cấp quốc tế hỗ trợ 1-1.',
                },
                {
                  title: 'Hồ bơi & Sauna',
                  desc: 'Thư giãn cơ bắp sau giờ tập tại khu vực đặc quyền.',
                },
                {
                  title: 'Khóa tủ an toàn',
                  desc: 'Sử dụng hệ thống khóa từ hiện đại và an tâm.',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex gap-4 items-start bg-red-600/5 p-5 rounded-2xl border border-red-600/10"
                >
                  <Activity className="text-red-600 shrink-0 w-6 h-6" />
                  <div>
                    <h4 className="font-bold text-white mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-4 bg-red-600/20 blur-2xl rounded-3xl opacity-50 group-hover:opacity-100 transition duration-500" />
            <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=2070&auto=format&fit=crop"
                alt="Fitness Training"
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
            <div className="w-16 h-16 bg-red-600/20 rounded-2xl flex items-center justify-center text-red-600">
              <Clock size={32} />
            </div>
            <h3 className="text-xl font-bold font-white">Thời Gian</h3>
            <p className="text-gray-400">
              6:00 AM - 10:00 PM <br /> Phù hợp mọi lịch trình
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4 p-8 bg-white/5 rounded-3xl border border-white/10">
            <div className="w-16 h-16 bg-red-600/20 rounded-2xl flex items-center justify-center text-red-600">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-bold font-white">Hội Viên</h3>
            <p className="text-gray-400">
              Đăng ký linh hoạt <br /> Tháng / Quý / Năm
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4 p-8 bg-white/5 rounded-3xl border border-white/10">
            <div className="w-16 h-16 bg-red-600/20 rounded-2xl flex items-center justify-center text-red-600">
              <MapPin size={32} />
            </div>
            <h3 className="text-xl font-bold font-white">Vị Trí</h3>
            <p className="text-gray-400">
              Tầng 7 <br /> Khu phức hợp MovieHub Health
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center px-4">
        <h2 className="text-4xl font-bold mb-8 uppercase tracking-wide">
          Bắt Đầu Hành Trình Thay Đổi
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-red-600 hover:bg-red-700 text-white font-bold h-14 px-8 rounded-full shadow-lg shadow-red-900/40 transition-all hover:scale-105"
          >
            Đăng Ký Tập Thử
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-red-600/50 text-red-500 hover:bg-red-500/10 h-14 px-8 rounded-full transition-all"
          >
            <Zap size={20} className="mr-2" /> Nhận Tư Vấn PT
          </Button>
        </div>
      </section>
    </div>
  );
}
