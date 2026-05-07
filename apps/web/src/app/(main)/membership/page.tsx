import { Button } from '@movie-hub/shacdn-ui/button';
import { Badge } from '@movie-hub/shacdn-ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@movie-hub/shacdn-ui/card';
import { Check, Crown, Gift, Sparkles, Star, Ticket } from 'lucide-react';
import { SignUpButton } from '@clerk/nextjs';

export default function MembershipPage() {
  return (
    <div className="min-h-screen bg-[#020817] text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto text-center mb-16 space-y-6">
        <Badge
          variant="outline"
          className="px-4 py-1 border-blue-500/50 text-blue-400 bg-blue-500/10 uppercase tracking-widest"
        >
          Quyền Lợi Độc Quyền
        </Badge>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
          Chương Trình Thành Viên
        </h1>
        <p className="max-w-2xl mx-auto text-gray-400 text-lg md:text-xl">
          Tham gia ngay để tận hưởng những ưu đãi đặc biệt dành riêng cho thành
          viên Cinestar. Tích điểm, đổi quà và trải nghiệm điện ảnh đẳng cấp.
        </p>
      </div>

      {/* Membership Tiers */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* C'FRIEND Tier */}
        <Card className="bg-[#0f172a]/50 border-blue-500/30 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all duration-500" />

          <CardHeader className="text-center pb-8 border-b border-blue-500/20">
            <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4 text-blue-400">
              <Star className="w-8 h-8" />
            </div>
            <CardTitle className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 uppercase italic tracking-wider">
              C'FRIEND
            </CardTitle>
            <p className="text-blue-200/60 font-medium">
              Thành viên Thân Thiết
            </p>
          </CardHeader>

          <CardContent className="pt-8 space-y-6">
            <div className="space-y-4">
              <h4 className="font-bold text-lg text-blue-100 flex items-center gap-2">
                <Gift className="w-5 h-5 text-blue-400" />
                Quyền lợi nổi bật
              </h4>
              <ul className="space-y-3">
                {[
                  'Tích lũy 10% giá trị giao dịch vào tài khoản điểm',
                  'Quà tặng sinh nhật: 1 Vé 2D + 1 Bắp ngọt',
                  'Ưu đãi giá vé thành viên vào thứ 4 hàng tuần',
                  'Tham gia các chương trình khuyến mãi dành riêng cho thành viên',
                ].map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-gray-300"
                  >
                    <Check className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/10">
              <h5 className="font-bold text-blue-200 mb-2 text-sm">
                Điều kiện:
              </h5>
              <p className="text-xs text-gray-400">
                Đăng ký tài khoản miễn phí trên website hoặc ứng dụng Cinestar.
                Tích lũy chi tiêu để duy trì hạng thẻ.
              </p>
            </div>

            <div className="pt-4">
              <SignUpButton mode="modal">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold h-12 shadow-lg shadow-blue-900/50">
                  Đăng Ký Ngay
                </Button>
              </SignUpButton>
            </div>
          </CardContent>
        </Card>

        {/* C'VIP Tier */}
        <Card className="bg-[#0f172a]/50 border-purple-500/30 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-all duration-500" />

          <CardHeader className="text-center pb-8 border-b border-purple-500/20">
            <div className="w-16 h-16 mx-auto bg-purple-500/20 rounded-2xl flex items-center justify-center mb-4 text-purple-400">
              <Crown className="w-8 h-8" />
            </div>
            <CardTitle className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300 uppercase italic tracking-wider">
              C'VIP
            </CardTitle>
            <p className="text-purple-200/60 font-medium">Thành viên VIP</p>
          </CardHeader>

          <CardContent className="pt-8 space-y-6">
            <div className="space-y-4">
              <h4 className="font-bold text-lg text-purple-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Quyền lợi đặc biệt
              </h4>
              <ul className="space-y-3">
                {[
                  'Tích lũy 15% giá trị giao dịch vào tài khoản điểm',
                  'Quà tặng sinh nhật: 2 Vé 2D + 1 Combo Bắp Nước',
                  'Quầy phục vụ ưu tiên (Priority Lane)',
                  'Miễn phí đổi trả vé trước 60 phút suất chiếu',
                  'Mời tham dự các sự kiện ra mắt phim đặc biệt (Premiere)',
                ].map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-gray-300"
                  >
                    <Check className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-purple-500/5 rounded-xl p-4 border border-purple-500/10">
              <h5 className="font-bold text-purple-200 mb-2 text-sm">
                Điều kiện:
              </h5>
              <p className="text-xs text-gray-400">
                Tổng chi tiêu tích lũy đạt 4.000.000đ trong vòng 1 năm dương
                lịch.
              </p>
            </div>

            <div className="pt-4">
              <SignUpButton mode="modal">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold h-12 shadow-lg shadow-purple-900/50">
                  Nâng Hạng Ngay
                </Button>
              </SignUpButton>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ / Policy Summary */}
      <div className="max-w-4xl mx-auto mt-20 p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
        <h3 className="text-2xl font-bold mb-6 text-center text-white">
          Chính Sách Điểm Thưởng
        </h3>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
              <Ticket className="w-4 h-4" /> Quy đổi điểm
            </h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              1 điểm = 1.000 VNĐ. Điểm thưởng có thể dùng để thanh toán vé xem
              phim, bắp nước tại quầy hoặc trực tuyến.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
              <Check className="w-4 h-4" /> Thời hạn điểm
            </h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Điểm tích lũy có giá trị sử dụng đến hết ngày 31/12 của năm kế
              tiếp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
