import { Button } from '@movie-hub/shacdn-ui/button';
import { Badge } from '@movie-hub/shacdn-ui/badge';
import { Card, CardContent } from '@movie-hub/shacdn-ui/card';
import { Projector, Users, Music, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function RentPage() {
  return (
    <div className="min-h-screen bg-[#020817] text-white pt-10 pb-20">
      {/* Hero */}
      <section className="text-center mb-20 px-4">
        <Badge
          variant="outline"
          className="mb-6 px-4 py-1 border-yellow-500/50 text-yellow-400 bg-yellow-500/10 uppercase tracking-widest"
        >
          Dịch Vụ Hợp Tác
        </Badge>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-6">
          Thuê Rạp & Tổ Chức Sự Kiện
        </h1>
        <p className="max-w-3xl mx-auto text-gray-400 text-lg md:text-xl">
          Không gian sang trọng, màn hình siêu lớn và hệ thống âm thanh sống
          động sẽ biến sự kiện của bạn trở nên ấn tượng hơn bao giờ hết.
        </p>
      </section>

      {/* Services Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-[#0f172a] border-white/10 hover:border-yellow-500/50 transition-all duration-300">
            <CardContent className="p-8 space-y-4">
              <div className="w-14 h-14 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-400">
                <Users size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white">
                Hội Thảo & Họp Báo
              </h3>
              <p className="text-gray-400">
                Không gian chuyên nghiệp cho các buổi ra mắt sản phẩm, training
                nội bộ, hoặc hội nghị khách hàng với sức chứa linh hoạt.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#0f172a] border-white/10 hover:border-pink-500/50 transition-all duration-300">
            <CardContent className="p-8 space-y-4">
              <div className="w-14 h-14 bg-pink-500/10 rounded-xl flex items-center justify-center text-pink-400">
                <Music size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white">Sự Kiện Tư Nhân</h3>
              <p className="text-gray-400">
                Tổ chức sinh nhật, cầu hôn, hoặc các buổi chiếu phim riêng tư ấm
                cúng cùng gia đình và bạn bè.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#0f172a] border-white/10 hover:border-blue-500/50 transition-all duration-300">
            <CardContent className="p-8 space-y-4">
              <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                <Projector size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white">School Tour</h3>
              <p className="text-gray-400">
                Chương trình ngoại khóa xem phim giáo dục với giá ưu đãi đặc
                biệt dành cho học sinh, sinh viên các trường.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-white/5 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-12 uppercase">
            Tại sao chọn MovieHub?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <div className="text-4xl font-black text-yellow-400">4K</div>
              <p className="text-gray-300 font-medium">Hình ảnh siêu nét</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-black text-blue-400">7.1</div>
              <p className="text-gray-300 font-medium">Âm thanh Dolby vòm</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-black text-green-400">100%</div>
              <p className="text-gray-300 font-medium">Ghế ngồi thoải mái</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-black text-purple-400">A+</div>
              <p className="text-gray-300 font-medium">Dịch vụ chuyên nghiệp</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-20 px-4">
        <h2 className="text-3xl font-bold mb-6">Bạn Đã Sẵn Sàng?</h2>
        <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
          Liên hệ ngay với đội ngũ Sale của chúng tôi để được tư vấn gói dịch vụ
          phù hợp nhất với ngân sách của bạn.
        </p>
        <Link href="/contact">
          <Button
            size="lg"
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold px-8 h-12"
          >
            <Calendar className="mr-2" /> Liên Hệ Báo Giá Ngay
          </Button>
        </Link>
      </section>
    </div>
  );
}
