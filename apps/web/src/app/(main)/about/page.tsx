import { Button } from '@movie-hub/shacdn-ui/button';
import { Badge } from '@movie-hub/shacdn-ui/badge';
import { Card, CardContent } from '@movie-hub/shacdn-ui/card';
import { Heart, Users, Video, Zap } from 'lucide-react';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#020817] text-white pt-10 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center relative z-10">
          <Badge
            variant="outline"
            className="mb-6 px-4 py-1 border-blue-500/50 text-blue-400 bg-blue-500/10 uppercase tracking-widest"
          >
            Về Chúng Tôi
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            Kết Nối Đam Mê Điện Ảnh
          </h1>
          <p className="max-w-3xl mx-auto text-gray-400 text-lg md:text-xl leading-relaxed">
            MovieHub không chỉ là rạp chiếu phim, chúng tôi là nơi những câu
            chuyện trở nên sống động, là điểm hẹn của những tâm hồn yêu nghệ
            thuật thứ 7.
          </p>
        </div>
      </section>

      {/* Mission & Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl font-bold border-l-4 border-yellow-400 pl-4">
              Sứ Mệnh Của Chúng Tôi
            </h2>
            <div className="space-y-6 text-gray-300">
              <p>
                Được thành lập vào năm 2024, MovieHub cam kết mang đến trải
                nghiệm điện ảnh đẳng cấp quốc tế với mức giá phù hợp cho người
                Việt. Chúng tôi tin rằng mỗi bộ phim là một hành trình, và chúng
                tôi vinh dự được đồng hành cùng bạn trong hành trình đó.
              </p>
              <p>
                Với hệ thống rạp hiện đại, công nghệ chiếu phim tiên tiến (IMAX,
                Dolby Atmos, 4DX) và dịch vụ khách hàng tận tâm, MovieHub đang
                từng bước khẳng định vị thế trong lòng khán giả.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="text-3xl font-bold text-blue-400 mb-1">50+</div>
                <div className="text-sm text-gray-400">Rạp trên toàn quốc</div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="text-3xl font-bold text-purple-400 mb-1">
                  1M+
                </div>
                <div className="text-sm text-gray-400">Khách hàng tin dùng</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-[#0f172a] border-blue-500/20 hover:border-blue-500/40 transition-colors">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-full text-blue-400">
                  <Video size={32} />
                </div>
                <h3 className="font-bold text-white">Công Nghệ Đỉnh Cao</h3>
                <p className="text-xs text-gray-400">
                  Màn hình & âm thanh chuẩn quốc tế
                </p>
              </CardContent>
            </Card>
            <Card className="bg-[#0f172a] border-purple-500/20 hover:border-purple-500/40 transition-colors mt-8">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-full text-purple-400">
                  <Users size={32} />
                </div>
                <h3 className="font-bold text-white">Khách Hàng Là Số 1</h3>
                <p className="text-xs text-gray-400">
                  Dịch vụ tận tâm, chu đáo
                </p>
              </CardContent>
            </Card>
            <Card className="bg-[#0f172a] border-pink-500/20 hover:border-pink-500/40 transition-colors">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="p-3 bg-pink-500/10 rounded-full text-pink-400">
                  <Heart size={32} />
                </div>
                <h3 className="font-bold text-white">Đam Mê Điện Ảnh</h3>
                <p className="text-xs text-gray-400">
                  Lan tỏa tình yêu phim ảnh
                </p>
              </CardContent>
            </Card>
            <Card className="bg-[#0f172a] border-yellow-500/20 hover:border-yellow-500/40 transition-colors mt-8">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="p-3 bg-yellow-500/10 rounded-full text-yellow-400">
                  <Zap size={32} />
                </div>
                <h3 className="font-bold text-white">Sáng Tạo Không Ngừng</h3>
                <p className="text-xs text-gray-400">
                  Luôn đổi mới trải nghiệm
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section (Placeholder) */}
      <section className="bg-white/5 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Đội Ngũ Lãnh Đạo</h2>
            <p className="text-gray-400">
              Những người đứng sau thành công của MovieHub
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="group relative overflow-hidden rounded-xl bg-gray-800"
              >
                <div className="aspect-[3/4] bg-gray-700 animate-pulse flex items-center justify-center text-gray-500">
                  {/* Placeholder for image */}
                  <Users size={48} className="opacity-20" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 flex flex-col justify-end translate-y-4 group-hover:translate-y-0 transition-transform">
                  <h3 className="text-xl font-bold text-white">
                    Thành Viên #{item}
                  </h3>
                  <p className="text-blue-400 text-sm font-medium">
                    Position Title
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
