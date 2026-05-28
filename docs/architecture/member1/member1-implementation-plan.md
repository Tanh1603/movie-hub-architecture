# Member 1 Implementation Plan

## Mục tiêu

Tài liệu này cung cấp kế hoạch chi tiết để Member 1 triển khai mọi yêu cầu trong `docs/architecture/TEAM_TASK_DIVISION.md` theo đúng định hướng kiến trúc của `docs/architecture/add.md` và `docs/architecture/SAD/sad.md`.

## Phạm vi

Member 1 chịu trách nhiệm về:

- Health checks và readiness/liveness probe
- Failover, replica, load balancing, và graceful shutdown
- Retry, timeout, và external-dependency resilience
- Backup & restoration cho PostgreSQL
- Monitoring, alerting, SLO/O và on-call readiness

## Liên kết kiến trúc

Tài liệu này bám sát:

- `docs/architecture/add.md` để đảm bảo các Quality Attribute Requirements được phản ánh chính xác trong kế hoạch triển khai.
- `docs/architecture/SAD/sad.md` để giữ nguyên hướng chiến lược kiến trúc: microservices ownership, fault isolation, transaction boundary, và external adapter.
- `docs/architecture/c4/c4-deployment.md` để định nghĩa topology deploy, replica, data tier, và observability tier.

## Yêu cầu chính

Member 1 cần hiện thực hóa các yêu cầu sau từ `TEAM_TASK_DIVISION.md`:

1. Health check module và probe config cho toàn bộ services
2. Multi-instance deployment với tối thiểu 2 replicas cho các user-facing services
3. Graceful shutdown và connection draining
4. Retry policy và timeout budgets cho external/internal calls
5. Backup strategy, restore procedure, và validation script cho PostgreSQL
6. Monitoring, alerting, dashboard, và incident response

## Phân tích chất lượng và tác vụ

### 1. Health Checks & Readiness

**Mục tiêu**: Availability 99.9%, phát hiện sự cố nhanh, loại bỏ instance không khỏe trong ≤30s.

**Nội dung cần làm**:

- Cài đặt `HealthCheckModule` trực tiếp trong mỗi service, không chỉ cấu hình container.
- Cung cấp trong mỗi service:
  - `/health/live` (process sống)
  - `/health/ready` (DB, Redis, provider reachability)
- Docker Compose / Kubernetes chỉ nên gọi những endpoint này để đánh giá container readiness/liveness.
- Probe config: interval = 10s, timeout = 2s, failure threshold = 2.
- Kiểm tra dependencies: Redis, PostgreSQL, external provider endpoints.

**Tài liệu tham chiếu**:

- `docs/architecture/add.md`: 2.6.1, 2.6.2, 2.6.3
- `docs/architecture/SAD/sad.md`: “Availability” và “Reliability”
- `docs/architecture/c4/c4-deployment.md`

### 2. Failover & Load Balancing

**Mục tiêu**: Khả năng phục hồi khi pod/service bị lỗi, không mất request quan trọng.

**Nội dung cần làm**:

- Triển khai `api-gateway`, `booking-service`, `user-service`, `movie-service`, `cinema-service`, `worker-service` với ít nhất 2 replicas.
- Tạo PodDisruptionBudget / equivalent cho môi trường target.
- Thiết kế rolling update và rollback policy.
- Implement `SIGTERM` handler trong NestJS:
  - dừng accept request mới
  - đợi in-flight request hoàn thành tối đa 30s
  - đóng kết nối DB/Redis sạch sẽ

**Tài liệu tham chiếu**:

- `docs/architecture/add.md`: 2.6.1, 2.6.3, 2.7.1
- `docs/architecture/SAD/sad.md`: “Availability”, “Scalability”, “Maintainability”
- `docs/architecture/c4/c4-deployment.md`

### 3. Retry & Timeout Strategy

**Mục tiêu**: External dependencies không kéo toàn bộ nền tảng xuống, thất bại có thể phân cách.

**Nội dung cần làm**:

- Xây shared configuration cho retry policy:
  - max attempts = 3
  - exponential backoff 1s, 2s, 4s với jitter
  - retry khi 5xx, timeout, connection reset
  - không retry 4xx trừ 429
- Thiết lập timeout budgets:
  - payment/notify: 30s
  - internal service calls: 10s
  - health checks: 2s
- Ghi log retry count và correlation id.

**Tài liệu tham chiếu**:

- `docs/architecture/add.md`: 2.2.3, 2.7.2
- `docs/architecture/SAD/sad.md`: “Reliability”, “Observability”

### 4. Backup & Restoration

**Mục tiêu**: Bảo toàn dữ liệu PostgreSQL và khả năng hồi phục đúng thứ tự.

**Nội dung cần làm**:

- Định nghĩa chiến lược backup:
  - Booking DB: snapshot 15 phút
  - Các DB khác: snapshot 60 phút
  - WAL archive liên tục
  - Retention: daily 7d, weekly 4w, monthly 6m
- Viết script restore theo thứ tự:
  1. Booking DB
  2. Cinema DB
  3. Movie DB
  4. User DB
- Xây validation: schema, record count, booking/payment/ticket consistency, outbox pending count.
- Định nghĩa runbook khôi phục:
  - corruption detected
  - regional outage
  - partial data loss

**Tài liệu tham chiếu**:

- `docs/architecture/add.md`: 2.7.1, 2.7.4
- `docs/architecture/SAD/sad.md`: “Reliability”, “Maintainability”

### 5. Monitoring & Alerting

**Mục tiêu**: Early detection, cảnh báo đúng người, và metric chỉ số thực tế.

**Nội dung cần làm**:

- Xác định SLOs:
  - uptime 99.9%
  - error rate <0.1%
  - booking path p95 ≤3s
  - browse p95 ≤2s
  - seat feedback ≤500ms
- Cấu hình alert:
  - health check fail 2 probes
  - error rate >1% trong 5 phút
  - p95 latency >5s trong 10 phút
  - Redis/PostgreSQL unavailable
- Tạo dashboard kỹ thuật:
  - replica health
  - request volume / error rate
  - latency p50/p95/p99
  - DB connection pool / Redis usage
  - external provider error/timeouts
- Định nghĩa quy trình sự cố: alert → review → auto-remediate → escalate.

**Tài liệu tham chiếu**:

- `docs/architecture/add.md`: 2.8.1, 2.8.2, 2.8.3
- `docs/architecture/SAD/sad.md`: “Observability / auditability”, “Availability”

## Mốc thời gian chi tiết

### Tuần 1

- Hoàn thiện `HealthCheckModule` và triển khai lên API Gateway, Booking Service.
- Cấu hình probe readiness/liveness cho staging.
- Hoàn thành retry/timeout policy chung.
- Bắt đầu thực hiện signing cho graceful shutdown.

### Tuần 2

- Hoàn thiện deployment manifests (replicas, PDB, resource requests/limits).
- Đảm bảo graceful shutdown hoạt động trong môi trường staging.
- Hoàn thiện alerting và dashboard cơ bản.
- Xây baseline health check tests.

### Tuần 3

- Triển khai backup strategy và restore script.
- Kiểm tra restore workflow trên môi trường staging.
- Hoàn thiện external dependency health probes và failure injection tests.
- Tổ chức xác nhận alerting / on-call workflow.

### Tuần 4

- Hoàn thiện monitoring/alerting và incident runbooks.
- Thực hiện restore drill trên staging.
- Kiểm tra chạy failover/rolling update và đo failover latency.
- Hoàn thiện tài liệu bàn giao cho team.

## Điểm cần lưu ý

- Mọi health check readiness phải đánh giá cả đường dẫn tới Redis, PostgreSQL, và external provider quan trọng.
- Retry/timeout cần có cơ chế tránh thundering-herd khi hàng loạt replica retry cùng lúc.
- Backup/restore phải có validation rõ ràng; không chỉ restore xong mà phải so sánh row counts và consistency state.
- Observability phải gắn correlation ID vào mỗi dòng log của health, deploy, retry, restore.

## Dependencies và giao điểm

### Nội bộ

- `API Gateway` (nhận correlation ID, auth headers)
- `Booking Service` (health/backup/restore target)
- `User/Movie/Cinema Services` (health probes, scaling patterns)
- `Async Worker` (monitoring, readiness, failover behavior)

### Ngoại vi

- `Clerk` (external auth reachability)
- `Payment Gateway` (phát hiện timeout / error)
- `Notification Provider` (phát hiện thất bại không ảnh hưởng booking path)
- `Observability Stack` (dashboard, alerts)

## Tài liệu cần tạo thêm

1. `docs/architecture/member1/member1-implementation-plan.md` (kế hoạch tổng thể)
2. `docs/architecture/member1/member1-architecture-alignment.md` (mô tả chi tiết các quyết định kiến trúc, traceability tới ADD/SAD)
3. `docs/architecture/member1/member1-task-checklist.md` (checklist triển khai và kiểm thử)
4. `docs/architecture/member1/phase1-health-checks-readiness.md` (chi tiết Phase 1: Health Checks & Readiness)

## Kết luận

Kế hoạch này là bản triển khai trực tiếp của các yêu cầu trong `TEAM_TASK_DIVISION.md`, đồng thời giữ nguyên định hướng chất lượng của `add.md` và `SAD/sad.md`. Member 1 có thể dùng tài liệu này làm roadmap, đồng thời tham chiếu các tài liệu kiến trúc chi tiết trong thư mục `docs/architecture/c4` để triển khai đúng boundary và topology.
