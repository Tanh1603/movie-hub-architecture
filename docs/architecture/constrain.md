# Non-Functional Requirements And Constraints
1. PERFORMANCE (Hiệu năng)
1.1 Transaction Response Time

Refined:

Khi khách hàng gửi request đăng ký tài khoản trong điều kiện tải bình thường (~100 request/giây), API đăng ký phải phản hồi trong ≤ 2 giây với ít nhất 95% request; việc gửi email/SMS OTP phải được xử lý bất đồng bộ và không làm tăng thời gian phản hồi API quá 2 giây; trạng thái gửi OTP phải được hiển thị cho người dùng trong cùng phiên thao tác với độ trễ ≤ 1 giây.

1.2 Browse & Discovery Response Time

Refined:

Khi khách hàng truy cập danh sách phim hoặc áp dụng bộ lọc/sắp xếp trong điều kiện tải bình thường (~100 request/giây), trang danh sách đầu tiên phải hiển thị trong ≤ 3 giây với 95% request; các lần tải thêm (infinite scroll) phải phản hồi trong ≤ 2 giây và không làm gián đoạn thao tác người dùng.

1.3 Interactive Booking Response Time

Refined:

Khi khách hàng mở sơ đồ ghế cho một suất chiếu trong điều kiện cao điểm (~300 concurrent seat actions), trạng thái ghế phải tải trong ≤ 2 giây với 95% request; thao tác chọn/bỏ chọn ghế phải phản hồi ở phía giao diện trong ≤ 500ms và được đồng bộ với server trong ≤ 1 giây, không xảy ra hiện tượng double-click booking trong 100% trường hợp.

1.4 Analytical Dashboard Freshness

Refined:

Khi Manager truy cập dashboard trong điều kiện tải nhẹ (~5–10 request/giây), các KPI phải được cập nhật theo thời gian thực với độ trễ dữ liệu ≤ 5 giây; việc refresh dữ liệu không được làm reload toàn bộ trang và phải hoàn thành trong ≤ 3 giây với 95% request.

Constraints (Refined)
Tất cả API danh sách phải sử dụng pagination với kích thước mặc định 10 item/trang, tối đa 50 item/trang, và đảm bảo thời gian phản hồi ≤ 2 giây với 95% request.
Hệ thống phải sử dụng cache (Redis hoặc in-memory) cho dữ liệu đọc nhiều (movie list, showtime) với TTL tối thiểu 5 phút, giúp giảm latency xuống ≤ 1 giây cho cache hit.
Các tác vụ gửi email/SMS phải xử lý bất đồng bộ qua message queue, đảm bảo không làm tăng latency API quá 100ms overhead.
API tìm kiếm và duyệt phim phải đáp ứng ≤ 2 giây với 95% request dưới tải 100 req/s, và vẫn duy trì ≤ 3 giây dưới tải peak 300 req/s.

2. AVAILABILITY (Sẵn sàng)
2.1 Core Service Uptime

Refined:

Trong vận hành thường kỳ, các dịch vụ cốt lõi (đăng ký/đăng nhập, duyệt phim, đặt vé, thanh toán, phát hành vé) phải đạt uptime ≥ 99.9% theo chu kỳ hàng tháng, tương đương tổng downtime ≤ 43 phút/tháng.

2.2 Graceful Degradation (External Dependencies)

Refined:

Khi các dịch vụ bên ngoài (payment gateway, email/SMS, movie metadata provider) gặp lỗi hoặc timeout (>5 giây), hệ thống phải retry tối đa 3 lần với exponential backoff, sau đó kích hoạt fallback hoặc circuit breaker; trong mọi trường hợp, hệ thống không được crash và phải phản hồi cho người dùng trong ≤ 3 giây với thông tin trạng thái rõ ràng.

2.3 Failover & Health-check Routing

Refined:

Khi một application instance hoặc database replica bị lỗi trong giờ cao điểm (~300 req/s), hệ thống phải phát hiện thông qua health check trong ≤ 10 giây và loại instance lỗi khỏi load balancer trong ≤ 30 giây; việc chuyển hướng lưu lượng (failover) không được làm gián đoạn request quá 5 giây, và không được mất dữ liệu giao dịch đã commit trong 100% trường hợp.

Constraints (Refined)
Mỗi service cốt lõi phải chạy tối thiểu 2 instance phía sau load balancer, đảm bảo khả năng chịu lỗi khi một instance bị down.
Health check phải được thực hiện mỗi 10 giây, với timeout ≤ 2 giây mỗi lần kiểm tra.
Retry external service tối đa 3 lần với exponential backoff (1s → 2s → 4s), tổng thời gian retry không vượt quá 10 giây.
3. RELIABILITY (Độ tin cậy)
3.1 Seat Reservation Consistency

Refined:

Khi nhiều khách hàng đồng thời chọn cùng một ghế trong cùng một suất chiếu (≥ 2 concurrent requests), hệ thống phải đảm bảo tối đa 1 booking thành công trong 100% trường hợp; ghế được giữ phải có TTL ≤ 5 phút, và tự động giải phóng trong ≤ 1 phút sau khi hết hạn hoặc khi thanh toán thất bại.

3.2 Booking–Payment–Ticket Consistency

Refined:

Khi thanh toán thành công, hệ thống phải đảm bảo tạo chính xác 1 booking và 1 vé điện tử tương ứng trong 100% trường hợp; nếu thanh toán thất bại hoặc timeout (>30 giây), hệ thống không được phát hành vé và phải trả lại ghế trong ≤ 1 phút, đảm bảo không có trạng thái dữ liệu không nhất quán.

3.3 Schedule Conflict Prevention

Refined:

Khi Cinema Manager tạo hoặc cập nhật lịch chiếu (bao gồm batch operations), hệ thống phải phát hiện xung đột phòng/thời gian trong ≤ 2 giây với 95% request và ngăn không cho publish lịch nếu có xung đột, đảm bảo 0 trường hợp trùng lịch phòng chiếu.

3.4 Financial Reconciliation Accuracy

Refined:

Khi thực hiện đối soát giao dịch theo ngày/tháng, tổng số booking, thanh toán, hoàn tiền, thuế và commission phải khớp với hệ thống payment gateway với sai lệch ≤ 0.01%; không được tồn tại transaction orphan hoặc trạng thái mismatch trong 100% trường hợp.

Constraints (Refined)
Hệ thống phải sử dụng idempotency key để đảm bảo mỗi booking hoặc payment request chỉ được xử lý 1 lần duy nhất trong 100% trường hợp retry.
Seat booking phải sử dụng cơ chế lock (Redis hoặc database) với TTL tối đa 10 phút để tránh race condition.
Khi payment thất bại hoặc timeout (>30s), hệ thống phải release seat trong ≤ 1 phút.