# Member 1 Architecture Alignment

## Mục đích

Tài liệu này giải thích cách Member 1 triển khai phải phản ánh các quyết định kiến trúc trong `docs/architecture/add.md` và `docs/architecture/SAD/sad.md`.

## 1. Ánh xạ tới ADD

### 1.1 Availability

- ADD yêu cầu health checks, readiness/liveness checks, failover nhanh, và instance removal.
- Member 1 chịu trách nhiệm hiện thực các tactics này qua:
  - `/health/live` và `/health/ready`
  - probe interval 10s, timeout 2s, failure threshold 2
  - replica tối thiểu 2 cho API Gateway, Booking Service, user-facing services
  - graceful shutdown và connection draining

### 1.2 Reliability

- ADD định nghĩa tính toàn vẹn transaction và không mất dữ liệu.
- Member 1 hiện thực:
  - retry policy giới hạn, timeout budgets, và external provider degradation handling
  - backup/restore với WAL archiving và validation
  - monitoring on-call để phát hiện và chuyển đổi sự cố nhanh

### 1.3 Performance

- ADD yêu cầu read-heavy và commit-path nhanh.
- Member 1 hiện thực:
  - deployment scaling để tách read workload và transaction workload
  - probe/health config để tránh đưa các instance chậm vào pool
  - alerting latency để giám sát p95 và p99 của các dịch vụ

### 1.4 Observability

- ADD yêu cầu end-to-end traceability và auditability.
- Member 1 hiện thực:
  - dashboard về health, error rate, latency, replica status
  - alert rules cho Redis/PostgreSQL/config failures
  - logging sự kiện hạ tầng, failover, backup/restore và rollback

## 2. Ánh xạ tới SAD

### 2.1 Dịch vụ độc lập và boundary ownership

- SAD nhấn mạnh ownership rõ ràng giữa mỗi service và database.
- Member 1 cần đảm bảo deploy topology giữ nguyên mô hình container/service đã phân định trong `c4-containers.md` và `c4-deployment.md`.

### 2.2 Fault isolation

- SAD mô tả yêu cầu cách ly giữa read-heavy discovery và transaction core.
- Member 1 phải thiết kế infrastructure sao cho:
  - read services và booking service có thể scale độc lập
  - failures ở payment provider không kéo toàn bộ hệ thống xuống
  - unhealthy instance bị loại khỏi traffic nhanh chóng

### 2.3 Operations and recovery

- SAD nêu rõ “operations teams need failure isolation, deployability, and a restore path for transactional data.”
- Member 1 cần:
  - build restore runbooks
  - tự động hoá backup jobs
  - test restore drill thường xuyên
  - đảm bảo restore sequence đúng thứ tự dữ liệu

### 2.4 Monitoring and audit

- SAD yêu cầu reconstruct journeys từ logs/traces.
- Member 1 phải phối hợp với Member 3 để giám sát correlation ID.
- Infrastructure monitoring phải bao gồm:
  - health probe status
  - resource saturation
  - provider integration failures

## 3. Tactic mapping cho Member 1

| Requirement         | Tactic                               | File / Reference                         |
| ------------------- | ------------------------------------ | ---------------------------------------- |
| Health checks       | Fault detection, fail-fast           | `add.md` 2.6; `c4-deployment.md`         |
| Readiness/liveness  | Active redundancy                    | `SAD/sad.md` Availability                |
| Replica scaling     | Active redundancy, elastic resources | `c4-deployment.md`                       |
| Graceful shutdown   | Stability under update               | `add.md` 2.6.2                           |
| Retry/timeout       | Bounded suspensions                  | `add.md` 2.2.3, 2.7.2                    |
| Backup/restore      | Data recovery, consistency checks    | `add.md` 2.7.1, 2.7.4                    |
| Monitoring/alerting | Auditability, incident response      | `add.md` 2.8, `SAD/sad.md` Observability |

## 4. Deployment boundary checklist

### 4.1 Services cần có probe

- `api-gateway`
- `booking-service`
- `user-service`
- `movie-service`
- `cinema-service`
- `worker-service`

### 4.2 External dependencies cần kiểm tra

- Redis
- PostgreSQL
- Clerk
- Payment gateway (endpoint reachable)
- Notification provider endpoint (ping or health check)

### 4.3 Service ownership và dữ liệu

- Không dùng Redis làm nguồn dữ liệu chính.
- PostgreSQL vẫn là hệ thống định danh cho transaction.
- Backup restore phải theo thứ tự: booking → cinema → movie → user.

## 5. C4 diagram references

- `docs/architecture/c4/c4-context.md`: actor và external boundary
- `docs/architecture/c4/c4-containers.md`: container/service topology
- `docs/architecture/c4/c4-deployment.md`: replica và infrastructure mapping
- `docs/architecture/c4/c4-dynamic-booking.md`: booking path impact
- `docs/architecture/c4/c4-dynamic-payment-callback.md`: callback handling
- `docs/architecture/c4/c4-dynamic-realtime-seat-update.md`: seat-state propagation

## 6. Giao tiếp cross-team

### Với Member 2

- Cần báo cáo health check của auth boundary và provider reachability.
- Cần hiển thị trạng thái timeout/retry trên dashboard.

### Với Member 3

- Cần xác nhận correlation ID được gắn trong health/log payload.
- Cần đảm bảo monitoring của booking path và seat-update path được kết nối.
- Cần phối hợp restore validation với booking state checks.

## 7. Phạm vi tài liệu này

Tài liệu này cung cấp:

- giải thích kiến trúc chính xác cho Member 1
- traceability giữa yêu cầu kỹ thuật và tài liệu ADD/SAD
- checklist boundary để tránh sai lệch triển khai

Nó không bao gồm chi tiết code của health module, không ghi nhận cụ thể các manifest Kubernetes, và không thay thế guide implement cụ thể cho từng ngôn ngữ.
