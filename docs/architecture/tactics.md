# tactics.md

## 1. Availability (Tính sẵn sàng)

### 1.1. Detect Faults (Phát hiện lỗi)
- Ping / Echo: Kiểm tra phản hồi giữa các thành phần
- Monitor: Theo dõi trạng thái hệ thống (CPU, memory, service health)
- Heartbeat: Gửi tín hiệu định kỳ để kiểm tra sống/chết
- Timestamp: Phát hiện lỗi do sai thứ tự hoặc trễ
- Sanity Checking: Kiểm tra tính hợp lệ dữ liệu
- Condition Monitoring: Theo dõi điều kiện bất thường
- Voting: So sánh kết quả từ nhiều node (N-version)
- Exception Detection: Phát hiện lỗi qua exception
- Self-Test: Thành phần tự kiểm tra

---

### 1.2. Recover from Faults (Phục hồi lỗi)

#### a. Preparation and Repair
- Active Redundancy (Hot Standby): Chạy song song, failover ngay
- Passive Redundancy (Warm Standby): Kích hoạt khi có lỗi
- Spare: Tài nguyên dự phòng
- Exception Handling: Xử lý lỗi runtime
- Rollback: Quay lại trạng thái trước đó
- Software Upgrade: Cập nhật không downtime
- Retry: Thử lại khi lỗi tạm thời
- Ignore Faulty Behavior: Bỏ qua lỗi không nghiêm trọng
- Degradation (Graceful): Giảm chức năng nhưng vẫn hoạt động
- Reconfiguration: Tái cấu hình hệ thống

#### b. Reintroduction
- Shadow: Chạy song song instance mới để test
- State Resynchronization: Đồng bộ lại state
- Escalating Restart: Restart tăng dần mức độ (service → system)
- Non-stop Forwarding: Không dừng hệ thống khi lỗi

---

### 1.3. Prevent Faults (Ngăn lỗi)
- Removal from Service: Loại bỏ component lỗi
- Transactions: Đảm bảo tính toàn vẹn (ACID)
- Predictive Model: Dự đoán lỗi trước khi xảy ra
- Exception Prevention: Tránh lỗi từ design
- Increase Competence Set: Tăng độ robust của hệ thống

---

## 2. Performance (Hiệu năng)

### 2.1. Control Resource Demand
- Manage Sampling Rate: Điều chỉnh tần suất xử lý
- Limit Event Response: Giới hạn số request xử lý
- Prioritize Events: Ưu tiên request quan trọng
- Reduce Overhead: Giảm chi phí xử lý phụ
- Bound Execution Times: Giới hạn thời gian xử lý
- Increase Resource Efficiency: Tối ưu thuật toán

---

### 2.2. Manage Resources
- Increase Resources: Scale up/down
- Introduce Concurrency: Xử lý song song (thread, async)
- Maintain Multiple Copies of Computations: Cache kết quả tính toán
- Maintain Multiple Copies of Data: Replication
- Bound Queue Sizes: Giới hạn hàng đợi
- Schedule Resources: Lập lịch (FIFO, Priority, Dynamic)

---

## 3. Security (Bảo mật)

### 3.1. Detect Attacks (Phát hiện tấn công)
- Detect Intrusion: IDS (Intrusion Detection System)
- Detect Service Denial: Phát hiện DoS/DDoS
- Verify Message Integrity: Kiểm tra checksum/hash
- Detect Message Delay: Phát hiện replay/delay attack

---

### 3.2. Resist Attacks (Chống tấn công)
- Identify Actors: Xác định user/system
- Authenticate Actors: Xác thực (login, token, OAuth)
- Authorize Actors: Phân quyền (RBAC, ABAC)
- Limit Access: Giới hạn truy cập
- Limit Exposure: Giảm surface attack
- Encrypt Data: Mã hóa (TLS, AES)
- Separate Entities: Tách domain/boundary
- Change Default Settings: Tránh config mặc định nguy hiểm

---

### 3.3. React to Attacks (Phản ứng)
- Revoke Access: Thu hồi quyền
- Lock Computer: Khóa hệ thống
- Inform Actors: Thông báo admin/user

---

### 3.4. Recover from Attacks (Phục hồi)
- Maintain Audit Trail: Log để forensic
- Restore: Backup & restore
- See Availability: Kết hợp với availability tactics

---

## 4. Modifiability (Khả năng sửa đổi)

### 4.1. Reduce Cost of Change
- Reduce Size of Module:
  - Split Module
- Increase Cohesion:
  - Increase Semantic Coherence
- Reduce Coupling:
  - Encapsulate
  - Use an Intermediary (Facade, API Gateway)
  - Restrict Dependencies
  - Refactor
  - Abstract Common Services

---

### 4.2. Design Strategies
- Defer Binding: Trì hoãn binding (runtime config, DI)
- Service Abstraction: Interface-based design
- Refactoring: Cải tiến code liên tục

---

## 5. Interoperability (Khả năng tương tác)

### 5.1. Locate
- Discover Service: Service discovery (Consul, Eureka)

### 5.2. Manage Interfaces
- Orchestrate: Điều phối service (workflow, saga)
- Tailor Interface: Adapter / API transformation

### Bổ sung:
- Standardized Interfaces: REST, SOAP, gRPC
- Data Mapping: Mapping schema giữa systems
- Protocol Standardization: HTTP, AMQP, Kafka
- Loose Coupling: Giảm phụ thuộc hệ thống

---

## 6. Testability (Khả năng kiểm thử)

- Test Interfaces: get/set/reset/report
- Record/Playback: Mock input/output
- Abstract Data Sources: Fake DB/API
- Sandbox: Môi trường test riêng
- Assertions: Validate output
- Reduce Complexity: Giảm logic rối

---

## 7. Usability (Khả năng sử dụng)

- User Guidance: Hướng dẫn người dùng
- Undo/Redo: Hoàn tác
- Error Handling: Thông báo lỗi rõ ràng
- Feedback: Response ngay lập tức
- Personalization: Cá nhân hóa trải nghiệm