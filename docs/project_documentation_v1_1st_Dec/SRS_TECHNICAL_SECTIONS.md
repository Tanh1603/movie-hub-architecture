# Technical Requirements Specification

## Section 2: Non-functional Requirements

### 2.1 User Access and Security

The system implements a robust Role-Based Access Control (RBAC) mechanism integrated across the microservices. Access is controlled via JWT tokens issued by the authentication provider (Clerk) and validated by the `api-gateway`.

**Actors identified in the system:**
*   **Admin:** Global system administrator with full access to all services and settings.
*   **Cinema Manager:** High-level staff responsible for cinema-specific operations and scheduling.
*   **Staff:** General cinema employees including Ticket Clerks, Ushers, and Concession Staff.
*   **User:** Registered customers who can book tickets and manage their profiles.
*   **Guest:** Unauthenticated visitors browsing the catalog.

**Function/Actor Matrix:**

| Function / Module | Admin | Cinema Manager | Staff | User | Guest |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **System Configuration** | X | | | | |
| **Staff Management (CRUD)** | X | X(*) | | | |
| **Movie Catalog (Manage)** | X | | | | |
| **Cinema & Hall Setup** | X | X(*) | | | |
| **Showtime Scheduling** | X | X | | | |
| **Seat Status Override** | X | X | X | | |
| **Booking & Payment** | X | X | X | X | |
| **Review Management** | X | X(*) | | X(*) | |
| **Analytics & Reports** | X | X(*) | | | |
| **Browse Catalog** | X | X | X | X | X |

**Legend:**
*   **X**: Full access.
*   **X(*)**: Access limited to own items or assigned cinema.
*   **X()****: Assigned items only.

### 2.2 Performance Requirements

Based on the microservice architecture and database schema analysis, the following performance targets are established:

*   **Concurrent Users:** Supported up to 10,000+ simultaneous sessions. The use of **Redis** for seat locking and session management ensures high throughput during peak release windows.
*   **Data Volume:**
    *   **Bookings/Tickets:** High volume (~1M+ records/year).
    *   **Cinema/Halls:** Low volume but complex relational structure (JSON layouts).
    *   **Logs/Transactions:** Very high volume; requires periodic indexing.
*   **Availability:** 99.9% uptime. The decoupling of services (Booking, Movie, Cinema, User) ensures that a failure in the Review module does not impact the core Ticket Booking flow.
*   **Usage Frequency:** High frequency for `Showtime` queries and `SeatStatus` updates, optimized via caching layers.

### 2.3 Implementation Requirements

*   **Deployment:** The system is fully containerized using **Docker**. Deployment requires an orchestration layer (Docker Compose/Kubernetes) to manage the 4 PostgreSQL instances and Redis cluster.
*   **Maintenance Windows:** Scheduled updates are performed during off-peak hours (02:00 - 04:00 GMT+7). Microservice architecture allows for rolling updates with near-zero downtime.
*   **Read-only Timeframes:** Database migrations via Prisma may require brief read-only periods (less than 5 minutes) during schema updates.

---

## Section 3: Other Requirements

### 3.1 Archive Function

The application uses status-based soft deletes and archival flags to maintain data integrity and historical records.

| List / Table | Archive Field | Condition | Actor |
| :--- | :--- | :--- | :--- |
| **Staff** | `StaffStatus` | Set to `INACTIVE` | Admin / Manager |
| **Cinema/Hall** | `CinemaStatus` | Set to `CLOSED` or `MAINTENANCE` | Admin |
| **Showtimes** | `ShowtimeStatus` | Set to `CANCELLED` | Manager |
| **Bookings** | `BookingStatus` | Set to `EXPIRED` or `CANCELLED` | System / User |
| **Promotions** | `active` | Boolean flag set to `false` | Admin |

### 3.2 Security Audit

*   **Audit Logging:** All financial transactions (Payments, Refunds) and point movements (Loyalty) are recorded with unique transaction IDs and provider references (VNPAY/MOMO).
*   **Permission Monitoring:** Modifications to roles and permissions in the `user-service` are tracked via database timestamps (`updatedAt`).
*   **Access Control:** All API endpoints are guarded by the `api-gateway` which logs the `user_id` and `client_ip` for all sensitive operations.

### 3.3 Movie Hub Sites

| Site / Portal | Primary Function |
| :--- | :--- |
| **Web Client** | Unified Next.js application for public movie browsing and customer booking. |
| **Admin Dashboard** | Management interface for staff to control scheduling, inventory, and staff records. |
| **API Documentation** | Swagger/OpenAPI interactive docs accessible via the Gateway for development and integration. |

### 3.4 Movie Hub Lists

| Code | List Name | Description |
| :--- | :--- | :--- |
| **List01** | **Movies** | Catalog of films including age ratings (P, K, T13, etc.) and runtime. |
| **List02** | **Cinemas** | Geographic locations, facility details, and contact info. |
| **List03** | **Showtimes** | Critical scheduling list linking movies, halls, and pricing. |
| **List04** | **Bookings** | Comprehensive record of all customer ticket purchases and statuses. |
| **List05** | **Staff** | Employee database including positions from Manager to Cleaner. |
| **List06** | **Promotions** | Active discount codes, loyalty tiers, and usage limits. |

### 3.5 Custom Pages
*   **Seat Selection Map:** A real-time, SVG/Canvas based interactive map for selecting specific seats in a cinema hall.
*   **Digital Ticket/QR:** A dynamic page generating secure QR codes for ticket validation at the cinema entry.

### 3.6 Scheduled Agents
*   **Seat Release Agent:** A Redis-backed worker that automatically expires "Held" seats if a booking is not completed within the 10-minute timeout.
*   **Promotion Expiry:** A daily job that updates the `active` status of promotions based on the `valid_to` date.

### 3.7 Technical Concern
*   **High Traffic Handling:** During "Blockbuster" releases, the concurrent demand for the same showtime may stress the Redis locking mechanism.
*   **Data Consistency:** Since the system uses four separate databases, ensuring consistency between `Showtime` (Cinema DB) and `Booking` (Booking DB) requires robust microservice communication.
*   **Large Data Volume:** The `Tickets` and `SeatReservations` tables grow rapidly; partitioned tables or archiving strategies for records older than 2 years are recommended.

---

## Section 4: Appendixes

### 4.1 Glossary

| Term | Definition |
| :--- | :--- |
| **CUID** | Collision-resistant Unique Identifier used as primary keys in the database. |
| **IMAX / 4DX** | Specialized hall types and movie formats supported by the system. |
| **IPN** | Instant Payment Notification; the callback mechanism from payment gateways like VNPAY. |
| **JWT** | JSON Web Token; used for secure transmission of user identity. |
| **RBAC** | Role-Based Access Control. |

### 4.3 Messages

| Message Code | Content | Button |
| :--- | :--- | :--- |
| `booking.confirm` | Your booking has been successfully confirmed. | Ok |
| `booking.expire` | Your seat reservation has expired. Please try again. | Ok |
| `payment.failed` | The payment transaction could not be completed. | Ok |
| `auth.unauthorized` | You do not have permission to perform this action. | Ok |
| `cinema.delete_confirm` | Are you sure you want to delete this cinema and all its data? | Yes/No |
| `ticket.validate.success` | Ticket is valid. Enjoy the movie! | Ok |
| `ticket.validate.used` | This ticket has already been used. | Ok |
