# Requirements Traceability Matrix (RTM) - Movie Hub

| No | Req ID | Req Desc | TC ID | TC Desc | Test Design | Test Designer | UAT Test Req? | Test Execution | Defects? | Defect ID | Defect Status | Req Coverage Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | UM-01 | User Authentication | TC-UM-01-01 | Verify user authentication flow | 1. Trigger login via Clerk. 2. Verify JWT token generation. 3. Access protected route in API Gateway. | QA Team | Yes | Pending | No | | | Covered |
| 2 | UM-02 | List Users | TC-UM-02-01 | Verify Admin can list users | 1. Login as Admin. 2. GET /users. 3. Validate response structure from User Service. | QA Team | Yes | Pending | No | | | Covered |
| 3 | UM-04 | Create Staff | TC-UM-04-01 | Verify Staff creation | 1. Login as Admin. 2. POST /v1/staffs with valid payload. 3. Verify record in User Service DB. | QA Team | Yes | Pending | No | | | Covered |
| 4 | CM-01 | List All Cinemas | TC-CM-01-01 | Verify listing cinemas | 1. GET /v1/cinemas. 2. Check response against Cinema Service data. | QA Team | Yes | Pending | No | | | Covered |
| 5 | CM-06 | Search Cinemas Nearby | TC-CM-06-01 | Verify proximity search | 1. GET /v1/cinemas/nearby with lat/long. 2. Validate distance calculation. | QA Team | Yes | Pending | No | | | Covered |
| 6 | HM-01 | Get Hall by ID | TC-HM-01-01 | Verify Hall retrieval | 1. GET /v1/halls/hall/:id. 2. Verify Hall details and Seat layout. | QA Team | No | Pending | No | | | Covered |
| 7 | MV-01 | List Movies | TC-MV-01-01 | Verify Movie catalog | 1. GET /v1/movies. 2. Verify pagination and sorting. | QA Team | Yes | Pending | No | | | Covered |
| 8 | MV-04 | Create Movie | TC-MV-04-01 | Verify Movie creation | 1. Admin POST /v1/movies. 2. Check Movie Service DB for new entry. | QA Team | Yes | Pending | No | | | Covered |
| 9 | RV-03 | Create Review | TC-RV-03-01 | Verify Review submission with constraints | 1. Member POST review. 2. Verify BR-REVIEW-01 (Unique per user/movie). 3. Verify BR-REVIEW-02 (Rating 1-5). | QA Team | Yes | Pending | No | | | Covered |
| 10 | ST-01 | Get Showtime Seats | TC-ST-01-01 | Verify Seat map retrieval | 1. GET /v1/showtimes/:id/seats. 2. Verify seat status from Redis/DB. | QA Team | Yes | Pending | No | | | Covered |
| 11 | ST-03 | Create Showtime | TC-ST-03-01 | Verify Showtime scheduling | 1. Admin POST showtime. 2. Verify conflict checks in Cinema Service. | QA Team | Yes | Pending | No | | | Covered |
| 12 | BK-01 | Create Booking | TC-BK-01-01 | Verify Booking creation flow | 1. Member POST /v1/bookings. 2. Verify BR-BOOK-01 (15m expiry timer start). 3. Verify BR-BOOK-02 (One pending booking limit). | QA Team | Yes | Pending | No | | | Covered |
| 13 | BK-05 | Cancel Booking | TC-BK-05-01 | Verify Booking cancellation | 1. Member POST cancel. 2. Verify BR-BOOK-03 (Status check). 3. Verify BR-BOOK-05 (2hr window check). | QA Team | Yes | Pending | No | | | Covered |
| 14 | BK-07 | Reschedule Booking | TC-BK-07-01 | Verify Booking reschedule | 1. Member POST reschedule. 2. Verify BR-BOOK-04 (Max 1 reschedule). | QA Team | Yes | Pending | No | | | Covered |
| 15 | BK-09 | Cancel with Refund | TC-BK-09-01 | Verify Refund calculation on cancel | 1. Cancel paid booking. 2. Verify BR-BOOK-06 (70% refund calculation). 3. Check Refund record created. | QA Team | Yes | Pending | No | | | Covered |
| 16 | RT-01 | Hold Seat | TC-RT-01-01 | Verify Real-time Seat Holding | 1. Send gateway.hold_seat. 2. Check Redis key existence. 3. Verify BR-SEAT-01 (Max 8 seats). 4. Verify BR-SEAT-04 (Availability check). | QA Team | Yes | Pending | No | | | Covered |
| 17 | RT-02 | Release Seat | TC-RT-02-01 | Verify Seat Release | 1. Send gateway.release_seat. 2. Verify Redis key removal. 3. Verify update to all clients via Socket.io. | QA Team | No | Pending | No | | | Covered |
| 18 | RT-TTL | Seat TTL Expiry | TC-RT-TTL-01 | Verify Seat Auto-release | 1. Hold seat. 2. Wait 10 mins (simulate). 3. Verify BR-SEAT-02 (Auto-release after 600s). | QA Team | No | Pending | No | | | Covered |
| 19 | PY-01 | Create Payment | TC-PY-01-01 | Verify Payment initialization | 1. POST payment. 2. Verify interactions with VNPay/MoMo APIs. 3. Check BR-PAY-03 (VAT calculation). | QA Team | Yes | Pending | No | | | Covered |
| 20 | PY-04 | VNPay IPN | TC-PY-04-01 | Verify IPN processing | 1. Simulate VNPay IPN callback. 2. Verify BR-PAY-01 (Public endpoint). 3. Verify BR-PAY-02 (Response format). 4. Check Booking status update. | QA Team | No | Pending | No | | | Covered |
| 21 | TK-01 | Get Ticket Details | TC-TK-01-01 | Verify Ticket generation | 1. GET ticket details. 2. Verify QR code data validity. | QA Team | Yes | Pending | No | | | Covered |
| 22 | TK-03 | Validate Ticket | TC-TK-03-01 | Verify Ticket scanning | 1. Staff scans ticket. 2. Validate status transition (VALID -> USED). | QA Team | Yes | Pending | No | | | Covered |
| 23 | RF-01 | Create Refund Request | TC-RF-01-01 | Verify Refund request | 1. POST refund. 2. Verify record in Booking Service. | QA Team | Yes | Pending | No | | | Covered |
| 24 | CS-01 | List Concessions | TC-CS-01-01 | Verify Concession menu | 1. GET /v1/concessions. 2. Verify inventory levels. | QA Team | Yes | Pending | No | | | Covered |
| 25 | PM-04 | Validate Promotion | TC-PM-04-01 | Verify Promotion validation | 1. Apply promo code. 2. Verify BR-PROMO-01 (Date range). 3. Verify BR-PROMO-03 (Min purchase). | QA Team | Yes | Pending | No | | | Covered |
| 26 | LY-03 | Earn Points | TC-LY-03-01 | Verify Loyalty accumulation | 1. Complete booking. 2. Verify BR-LOYALTY-02 (1 point/1000VND). 3. Check User Service balance. | QA Team | Yes | Pending | No | | | Covered |
| 27 | LY-04 | Redeem Points | TC-LY-04-01 | Verify Loyalty redemption | 1. Use points in booking. 2. Verify BR-LOYALTY-01 (Rate). 3. Verify BR-LOYALTY-03 (Balance check). | QA Team | Yes | Pending | No | | | Covered |
| 28 | CF-02 | Update Setting | TC-CF-02-01 | Verify System Config update | 1. Admin updates setting. 2. Verify immediate effect or cache invalidation. | QA Team | No | Pending | No | | | Covered |
