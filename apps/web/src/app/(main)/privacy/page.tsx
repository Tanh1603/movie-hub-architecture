export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#020817] text-white pt-10 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black uppercase text-white mb-8 border-l-4 border-purple-500 pl-4">
          Chính Sách Bảo Mật
        </h1>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-4">
              1. Thu thập thông tin
            </h2>
            <p>
              Chúng tôi thu thập các thông tin sau khi quý khách đăng ký thành
              viên hoặc đặt vé:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Họ tên, Số điện thoại, Email.</li>
              <li>Lịch sử giao dịch, rạp thường xuyên lui tới.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">
              2. Mục đích sử dụng
            </h2>
            <p>Thông tin của quý khách được sử dụng để:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Xử lý đơn đặt vé và gửi mã vé điện tử.</li>
              <li>Tích điểm thành viên và đổi quà.</li>
              <li>
                Gửi thông báo về các chương trình khuyến mãi (nếu đăng ký).
              </li>
              <li>Cải thiện chất lượng dịch vụ.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">
              3. Chia sẻ thông tin
            </h2>
            <p>
              MovieHub cam kết không bán, trao đổi hoặc chia sẻ thông tin cá
              nhân của quý khách cho bên thứ ba, ngoại trừ trường hợp có yêu cầu
              của cơ quan pháp luật.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">4. Bảo mật</h2>
            <p>
              Chúng tôi áp dụng các biện pháp kỹ thuật và an ninh để bảo vệ dữ
              liệu của quý khách khỏi truy cập trái phép.
            </p>
          </section>

          <div className="pt-8 text-sm text-gray-500 border-t border-white/10">
            Lần cập nhật cuối: 27/12/2025
          </div>
        </div>
      </div>
    </div>
  );
}
