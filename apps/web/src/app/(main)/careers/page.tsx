import { Button } from '@movie-hub/shacdn-ui/button';
import { Badge } from '@movie-hub/shacdn-ui/badge';
import { ArrowRight, Briefcase } from 'lucide-react';

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-[#020817] text-white pt-10 pb-20">
      {/* Hero */}
      <div className="text-center mb-16 px-4">
        <Badge
          variant="outline"
          className="mb-6 px-4 py-1 border-green-500/50 text-green-400 bg-green-500/10 uppercase tracking-widest"
        >
          Tuyển Dụng
        </Badge>
        <h1 className="text-4xl md:text-5xl font-black uppercase mb-6">
          Gia Nhập Đội Ngũ MovieHub
        </h1>
        <p className="max-w-2xl mx-auto text-gray-400 text-lg">
          Chúng tôi luôn tìm kiếm những tài năng đam mê điện ảnh và mong muốn
          mang lại niềm vui cho khách hàng.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6">
          {/* Vacancy Card */}
          {[
            {
              title: 'Rạp Trưởng (Cinema Manager)',
              location: 'TP. Hồ Chí Minh',
              type: 'Toàn thời gian',
              dept: 'Vận hành',
            },
            {
              title: 'Nhân viên Phục vụ (Service Crew)',
              location: 'Hà Nội',
              type: 'Bán thời gian',
              dept: 'Vận hành',
            },
            {
              title: 'Chuyên viên Marketing',
              location: 'TP. Hồ Chí Minh',
              type: 'Toàn thời gian',
              dept: 'Văn phòng',
            },
            {
              title: 'Nhân viên IT Support',
              location: 'Đà Nẵng',
              type: 'Toàn thời gian',
              dept: 'Kỹ thuật',
            },
          ].map((job, index) => (
            <div
              key={index}
              className="bg-[#0f172a] border border-white/5 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 hover:border-green-500/30 transition-colors group"
            >
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-green-500/10 group-hover:text-green-400 transition-colors">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white group-hover:text-green-400 transition-colors">
                    {job.title}
                  </h3>
                  <div className="flex gap-3 text-sm text-gray-400 mt-1">
                    <span>{job.location}</span>
                    <span className="w-1 h-1 bg-gray-600 rounded-full self-center"></span>
                    <span>{job.type}</span>
                    <span className="w-1 h-1 bg-gray-600 rounded-full self-center"></span>
                    <span>{job.dept}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full md:w-auto border-white/10 hover:bg-green-600 hover:text-white hover:border-green-600 group-hover:border-green-500/30"
              >
                Ứng Tuyển Ngay <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center bg-gradient-to-r from-green-900/20 to-blue-900/20 p-8 rounded-2xl border border-white/5">
          <h3 className="text-2xl font-bold mb-4">
            Không tìm thấy vị trí phù hợp?
          </h3>
          <p className="text-gray-400 mb-6">
            Đừng ngần ngại gửi CV của bạn vào ngân hàng nhân sự của chúng tôi.
            Chúng tôi sẽ liên hệ khi có cơ hội phù hợp.
          </p>
          <Button className="bg-white text-black hover:bg-gray-200">
            Gửi CV Ngay
          </Button>
        </div>
      </div>
    </div>
  );
}
