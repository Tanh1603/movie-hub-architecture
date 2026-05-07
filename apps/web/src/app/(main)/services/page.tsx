import { Badge } from '@movie-hub/shacdn-ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@movie-hub/shacdn-ui/card';
import { Button } from '@movie-hub/shacdn-ui/button';
import {
  Utensils,
  Gamepad2,
  Dumbbell,
  Coffee,
  Palette,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';

const services = [
  {
    id: 'dining',
    title: 'Nhà Hàng 5 Sao',
    icon: Utensils,
    description: 'Thưởng thức ẩm thực Á - Âu đẳng cấp ngay tại khuôn viên rạp.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
  {
    id: 'kids',
    title: 'Kidzone',
    icon: Palette,
    description: 'Khu vui chơi an toàn và sáng tạo dành riêng cho trẻ em.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
  },
  {
    id: 'bowling',
    title: 'Bowling Center',
    icon: Trophy,
    description: 'Đường băng chuẩn quốc tế cho những cú strike hoàn hảo.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    id: 'billiards',
    title: 'Billiards Club',
    icon: Gamepad2,
    description: 'Không gian giải trí thượng lưu với bàn đấu tiêu chuẩn.',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
  },
  {
    id: 'gym',
    title: 'Gym & Fitness',
    icon: Dumbbell,
    description: 'Rèn luyện sức khỏe với trang thiết bị hiện đại nhất.',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
  {
    id: 'coffee',
    title: 'Movie Coffee',
    icon: Coffee,
    description: 'Thư giãn với những tách cà phê rang xay thượng hạng.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[#020817] text-white pt-10 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge
            variant="outline"
            className="mb-6 px-4 py-1 border-purple-500/50 text-purple-400 bg-purple-500/10 uppercase tracking-widest"
          >
            Hệ Sinh Thái Giải Trí
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-6 text-white">
            Dịch Vụ Tiện Ích
          </h1>
          <p className="max-w-2xl mx-auto text-gray-400 text-lg">
            Tại MovieHub, trải nghiệm của bạn không chỉ dừng lại ở màn ảnh rộng.
            Khám phá thế giới giải trí đa dạng của chúng tôi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <Card
              key={service.id}
              className={`bg-[#0f172a] ${service.border} hover:border-opacity-100 transition-all duration-300 group`}
            >
              <CardHeader className="pb-4">
                <div
                  className={`w-14 h-14 ${service.bg} rounded-2xl flex items-center justify-center ${service.color} mb-4 group-hover:scale-110 transition-transform`}
                >
                  <service.icon size={28} />
                </div>
                <CardTitle className="text-2xl font-bold text-white group-hover:text-primary transition-colors">
                  {service.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 mb-6 min-h-[48px]">
                  {service.description}
                </p>
                <Link href={`/services/${service.id}`}>
                  <Button
                    variant="outline"
                    className="w-full border-white/10 hover:bg-white/5 hover:text-white"
                  >
                    Xem Chi Tiết
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
