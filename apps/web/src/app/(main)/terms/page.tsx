export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#020817] text-white pt-10 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black uppercase text-white mb-8 border-l-4 border-blue-500 pl-4">
          Điều Khoản Sử Dụng
        </h1>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-4">1. Giới thiệu</h2>
            <p>
              Chào mừng quý khách đến với MovieHub. Khi truy cập và sử dụng dịch
              vụ trên website/ứng dụng của chúng tôi, quý khách đồng ý tuân thủ
              các điều khoản dưới đây.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">
              2. Quy định về tài khoản
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Quý khách phải đủ 13 tuổi trở lên để đăng ký tài khoản.</li>
              <li>Thông tin cung cấp phải chính xác và đầy đủ.</li>
              <li>
                Quý khách có trách nhiệm bảo mật thông tin đăng nhập của mình.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">
              3. Quy định đặt vé và thanh toán
            </h2>
            <p className="mb-2">
              Việc đặt vé trực tuyến tuân theo các quy định sau:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Vé đã mua không được hoàn trả sau khi thanh toán thành công
                (ngoại trừ lỗi hệ thống).
              </li>
              <li>
                Quý khách vui lòng kiểm tra kỹ thông tin phim, rạp, suất chiếu
                trước khi xác nhận.
              </li>
              <li>
                MovieHub chấp nhận các phương thức thanh toán: Thẻ ATM,
                Visa/Mastercard, Ví điện tử.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">
              4. Quy định tại rạp
            </h2>
            <p>
              Khách hàng vui lòng tuân thủ nội quy chung của rạp như: Không mang
              thức ăn bên ngoài, giữ trật tự, không quay phim chụp ảnh trong
              rạp.
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
