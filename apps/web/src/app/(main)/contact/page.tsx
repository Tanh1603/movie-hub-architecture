import { ContactSection } from '../_components/ContactSection';
import { Badge } from '@movie-hub/shacdn-ui/badge';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#020817] text-white pt-10">
      {/* Header */}
      <div className="text-center mb-10 px-4">
        <Badge
          variant="outline"
          className="mb-4 px-4 py-1 border-blue-500/50 text-blue-400 bg-blue-500/10 uppercase tracking-widest"
        >
          Hỗ Trợ 24/7
        </Badge>
        <h1 className="text-4xl md:text-5xl font-black uppercase text-white mb-4">
          Liên Hệ Với MovieHub
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Chúng tôi luôn sẵn sàng lắng nghe ý kiến đóng góp của bạn để nâng cao
          chất lượng dịch vụ.
        </p>
      </div>

      {/* Info Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#0f172a] p-6 rounded-xl border border-white/5 flex flex-col items-center text-center hover:border-blue-500/30 transition-colors">
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 mb-4">
              <MapPin />
            </div>
            <h3 className="font-bold text-lg mb-2">Trụ Sở Chính</h3>
            <p className="text-sm text-gray-400">
              135 Hai Bà Trưng, P. Bến Nghé, Q.1, TP.HCM
            </p>
          </div>

          <div className="bg-[#0f172a] p-6 rounded-xl border border-white/5 flex flex-col items-center text-center hover:border-green-500/30 transition-colors">
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-400 mb-4">
              <Phone />
            </div>
            <h3 className="font-bold text-lg mb-2">Hotline</h3>
            <p className="text-sm text-gray-400">1900 123 456</p>
            <p className="text-xs text-gray-500 mt-1">(1.000đ/phút)</p>
          </div>

          <div className="bg-[#0f172a] p-6 rounded-xl border border-white/5 flex flex-col items-center text-center hover:border-purple-500/30 transition-colors">
            <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-400 mb-4">
              <Mail />
            </div>
            <h3 className="font-bold text-lg mb-2">Email</h3>
            <p className="text-sm text-gray-400">support@moviehub.vn</p>
            <p className="text-sm text-gray-400">jobs@moviehub.vn</p>
          </div>

          <div className="bg-[#0f172a] p-6 rounded-xl border border-white/5 flex flex-col items-center text-center hover:border-yellow-500/30 transition-colors">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-400 mb-4">
              <Clock />
            </div>
            <h3 className="font-bold text-lg mb-2">Giờ Làm Việc</h3>
            <p className="text-sm text-gray-400">Thứ 2 - Chủ Nhật</p>
            <p className="text-sm text-gray-400">08:00 - 22:00</p>
          </div>
        </div>
      </div>

      {/* Existing Contact Section Form */}
      <div className="border-t border-white/5">
        <ContactSection />
      </div>

      {/* Map Embed (Placeholder) */}
      <div className="h-96 w-full bg-gray-900 relative">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.424167419749!2d106.6960813148008!3d10.77878899231991!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f385570472f%3A0x178943793739703e!2zMTM1IEhhaSBCw6AgVHLGsG5nLCBC4bq_biBOZ2jDqSwgUXXhuq1uIDEsIEjhu5MgQ2jDrSBNaW5o!5e0!3m2!1sen!2s!4v1680000000000!5m2!1sen!2s"
          width="100%"
          height="100%"
          style={{ border: 0, filter: 'grayscale(100%) invert(90%)' }}
          allowFullScreen
          loading="lazy"
        ></iframe>
      </div>
    </div>
  );
}
