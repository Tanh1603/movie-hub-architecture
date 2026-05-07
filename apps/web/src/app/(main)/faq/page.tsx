import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@movie-hub/shacdn-ui/accordion';

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#020817] text-white pt-10 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black uppercase text-center mb-10 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
          Câu Hỏi Thường Gặp
        </h1>

        <Accordion type="single" collapsible className="w-full space-y-4">
          <AccordionItem
            value="item-1"
            className="bg-[#0f172a] border border-white/10 rounded-lg px-4"
          >
            <AccordionTrigger className="hover:no-underline hover:text-yellow-400 text-lg font-medium">
              Làm thế nào để đăng ký thành viên?
            </AccordionTrigger>
            <AccordionContent className="text-gray-400">
              Bạn có thể đăng ký tài khoản miễn phí bằng cách nhấn vào nút "Đăng
              Ký" ở góc trên bên phải màn hình. Sau khi điền đầy đủ thông tin,
              bạn sẽ trở thành thành viên C'Friend ngay lập tức.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="item-2"
            className="bg-[#0f172a] border border-white/10 rounded-lg px-4"
          >
            <AccordionTrigger className="hover:no-underline hover:text-yellow-400 text-lg font-medium">
              Tôi có thể hủy vé đã đặt không?
            </AccordionTrigger>
            <AccordionContent className="text-gray-400">
              Đối với thành viên C'VIP, bạn được miễn phí đổi/trả vé trước giờ
              chiếu 60 phút. Đối với thành viên thường và khách vãng lai, vé đã
              mua không hỗ trợ hoàn hủy trừ trường hợp bất khả kháng từ phía
              rạp.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="item-3"
            className="bg-[#0f172a] border border-white/10 rounded-lg px-4"
          >
            <AccordionTrigger className="hover:no-underline hover:text-yellow-400 text-lg font-medium">
              Quy định về độ tuổi xem phim?
            </AccordionTrigger>
            <AccordionContent className="text-gray-400">
              <ul className="list-disc pl-5 space-y-1">
                <li>P: Phổ biến mọi lứa tuổi</li>
                <li>K: Dưới 13 tuổi cần người bảo hộ</li>
                <li>T13/C13: 13 tuổi trở lên</li>
                <li>T16/C16: 16 tuổi trở lên</li>
                <li>T18/C18: 18 tuổi trở lên</li>
              </ul>
              Vui lòng mang theo giấy tờ tùy thân để xác thực độ tuổi khi vào
              rạp.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="item-4"
            className="bg-[#0f172a] border border-white/10 rounded-lg px-4"
          >
            <AccordionTrigger className="hover:no-underline hover:text-yellow-400 text-lg font-medium">
              Điểm tích lũy dùng để làm gì?
            </AccordionTrigger>
            <AccordionContent className="text-gray-400">
              Điểm tích lũy có thể dùng để đổi vé xem phim 2D, combo bắp nước
              hoặc các quà tặng lưu niệm khác tại quầy. Tỷ lệ quy đổi: 1 điểm =
              1.000 VNĐ.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem
            value="item-5"
            className="bg-[#0f172a] border border-white/10 rounded-lg px-4"
          >
            <AccordionTrigger className="hover:no-underline hover:text-yellow-400 text-lg font-medium">
              Liên hệ hỗ trợ như thế nào?
            </AccordionTrigger>
            <AccordionContent className="text-gray-400">
              Bạn có thể liên hệ qua Hotline 1900 123 456 hoặc gửi tin nhắn qua
              Fanpage Facebook/Zalo của MovieHub để được hỗ trợ nhanh nhất.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
