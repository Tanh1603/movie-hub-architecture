# Member 1 Task Checklist and Test Plan

## Mục tiêu

Checklist này giúp Member 1 kiểm tra từng bước triển khai, xác thực tính hoàn chỉnh và đảm bảo các yêu cầu trong `TEAM_TASK_DIVISION.md` được đáp ứng.

## 1. Health Checks

### Phải có

- [ ] Tạo `HealthCheckModule` dùng chung cho các service.
- [ ] Định nghĩa 2 endpoint: `/health/live` và `/health/ready`.
- [ ] Kiểm tra Redis kết nối thành công.
- [ ] Kiểm tra PostgreSQL kết nối thành công.
- [ ] Kiểm tra external provider critical reachability nếu cần.
- [ ] Swagger hoặc tài liệu endpoints rõ ràng.

### Cấu hình probe

- [ ] Interval = 10s
- [ ] Timeout = 2s
- [ ] Unhealthy threshold = 2 failures
- [ ] Endpoint `/health/live` trả 200 khi service sống.
- [ ] Endpoint `/health/ready` trả 200 khi mọi phụ thuộc quan trọng sẵn sàng.

### Test

- [ ] Redis offline → `/health/ready` trả không thành công.
- [ ] PostgreSQL offline → `/health/ready` trả không thành công.
- [ ] External provider unreachable → `/health/ready` trả không thành công (nếu provider được xem là readiness dependency).
- [ ] Service vẫn trả 200 trên `/health/live` nếu process còn chạy.

## 2. Failover & Load Balancing

### Phải có

- [ ] Triển khai tối thiểu 2 replicas cho `api-gateway`, `booking-service`, `user-service`, `movie-service`, `cinema-service`, `worker-service`.
- [ ] Tạo PodDisruptionBudget hoặc equivalent.
- [ ] Thiết lập resource requests/limits cho CPU và memory.
- [ ] Triển khai rolling update policy: update 1 replica mỗi lần.

### Graceful shutdown

- [ ] Bắt SIGTERM và dừng nhận request mới.
- [ ] Chờ in-flight request tối đa 30s.
- [ ] Đóng kết nối PostgreSQL sạch.
- [ ] Đóng kết nối Redis sạch.
- [ ] Ghi log event shutdown.

### Test

- [ ] Kill một pod trong khi request đang chạy → request vẫn hoàn thành trên replica khác.
- [ ] Cập nhật deployment và xác nhận traffic không bị gián đoạn.
- [ ] Kiểm tra pod unhealthy bị loại khỏi load balancer trong ≤30s.

## 3. Retry & Timeout Strategy

### Phải có

- [ ] Shared retry policy module/config.
- [ ] Max attempts = 3.
- [ ] Exponential backoff 1s, 2s, 4s.
- [ ] Jitter để tránh thundering herd.
- [ ] Retry cho 5xx, timeout, connection reset.
- [ ] Không retry 4xx ngoại trừ 429.
- [ ] Timeout budgets:
  - External provider calls: 30s
  - Internal service calls: 10s
  - Health checks: 2s

### Test

- [ ] Mô phỏng payment gateway trả 503 → retry đúng 3 lần.
- [ ] Mô phỏng provider timeout → request timeout sau 30s.
- [ ] Mô phỏng internal service call timeout → timeout sau 10s.
- [ ] Đảm bảo các retry được log với correlation ID.

## 4. Backup & Restore

### Phải có

- [ ] Backup schedule cho PostgreSQL:
  - Booking DB: 15 phút
  - Other DBs: 60 phút
- [ ] WAL archive liên tục.
- [ ] Retention policy: daily 7d, weekly 4w, monthly 6m.
- [ ] Restore scripts và runbook.
- [ ] Validation script sau restore.
- [ ] Restore order rõ ràng: Booking → Cinema → Movie → User.

### Test

- [ ] Thực hiện restore lên staging từ backup.
- [ ] So sánh schema version sau restore.
- [ ] So sánh record count cơ bản.
- [ ] Kiểm tra booking/payment/ticket consistency.
- [ ] Kiểm tra outbox pending count.
- [ ] Đánh giá restore time và note.

## 5. Monitoring & Alerting

### Phải có

- [ ] SLO metrics:
  - Uptime 99.9%
  - Error rate <0.1%
  - Booking path p95 ≤3s
  - Browse path p95 ≤2s
  - Seat feedback ≤500ms
- [ ] Alert rules:
  - Health probe fail 2 lần
  - Error rate >1% trong 5 phút
  - Latency p95 >5s trong 10 phút
  - Redis unavailable
  - PostgreSQL unavailable
- [ ] Dashboard metrics: replica health, traffic, latency, external provider errors, DB/Redis usage.
- [ ] Incident response checklist.

### Test

- [ ] Tạo alert giả bằng cách gây lỗi health check.
- [ ] Xác nhận alert gửi đúng kênh (email/Slack/pager).
- [ ] Xác nhận dashboard hiển thị dữ liệu đúng.
- [ ] Kiểm tra on-call procedure với một trường hợp health failure.

## 6. Integration Points

### Với Member 2

- [ ] Health check phải phản ánh trạng thái provider auth/reachability.
- [ ] Alert phải bao gồm provider timeout/failure nếu auth boundary bị ảnh hưởng.

### Với Member 3

- [ ] Logs health/monitoring phải mang correlation ID.
- [ ] SLO/alert cần phản ánh booking path.
- [ ] Validation restore phải bao gồm booking state checks do Member 3 định nghĩa.

## 7. Documentation và chuyển giao

- [ ] Cập nhật `docs/architecture/member1/member1-implementation-plan.md` khi có thay đổi nhiệm vụ.
- [ ] Ghi rõ cấu hình probe và deployment manifest ở tài liệu nội bộ.
- [ ] Ghi rõ runbook recovery và test result.
- [ ] Liệt kê dependencies rõ ràng với Member 2/3 và external provider.

## 8. Risk và mitigation

### Nguy cơ chính

- [ ] Thất bại provider kéo toàn bộ hệ thống.
- [ ] Backup/restore không khôi phục đúng thứ tự dữ liệu booking.
- [ ] Replica unhealthy không bị loại kịp.

### Biện pháp giảm thiểu

- [ ] Cấu hình health check chỉ healthy khi toàn bộ dependency core sẵn sàng.
- [ ] Test restore drill thường xuyên trên staging.
- [ ] Đảm bảo auto-remediation / restart pod với sự kiện health fail.

## 9. Tài liệu tham khảo nhanh

- `docs/architecture/add.md`
- `docs/architecture/SAD/sad.md`
- `docs/architecture/TEAM_TASK_DIVISION.md`
- `docs/architecture/c4/c4-deployment.md`
- `docs/architecture/c4/c4-containers.md`
- `docs/architecture/c4/c4-context.md`
- `docs/architecture/c4/c4-dynamic-booking.md`
