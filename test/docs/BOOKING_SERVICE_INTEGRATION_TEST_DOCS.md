# Booking Service - Integration Test Documentation

> **Purpose:** Source of truth for Integration Tests for the Booking Service.
>
> **Service:** `booking-service` > **Protocol:** TCP Microservice (NestJS `@MessagePattern`)
> **Database:** PostgreSQL (Bookings, Tickets, Payments, Concessions, Promotions, Loyalty)
> **Payment Gateway:** VNPay
> **Dependencies:** `cinema-service`, `user-service`

---

## Table of Contents

1.  [Booking Module](#1-booking-module)
    - [createBooking](#11-createbooking)
    - [getBookingSummary](#12-getbookingsummary)
    - [cancelBooking](#13-cancelbooking)
    - [adminFindAllBookings](#14-adminfindallbookings)
2.  [Payment Module](#2-payment-module)
    - [createPayment](#21-createpayment)
    - [handleVNPayIPN](#22-handlevnpayipn)
    - [adminFindAllPayments](#23-adminfindallpayments)
3.  [Concession Module](#3-concession-module)
    - [findAll](#31-findall)
    - [create](#32-create)
    - [update](#33-update)
    - [delete](#34-delete)
4.  [Loyalty Module](#4-loyalty-module)
    - [getBalance](#41-getbalance)
    - [earnPoints](#42-earnpoints)
    - [redeemPoints](#43-redeempoints)
5.  [Promotion Module](#5-promotion-module)
    - [validatePromotion](#51-validatepromotion)
    - [createPromotion](#52-createpromotion)
6.  [Refund Module](#6-refund-module)
    - [createRefund](#61-createrefund)
    - [approveRefund](#62-approverefund)

---

## 1. Booking Module

### 1.1 createBooking

**Summary:** Creates a "Pending" booking to start the checkout session. Sets a 15-minute TTL.

#### The Contract (Inputs/Outputs)

**Message Pattern:** `booking.create`

| **Inputs**       | **Type** | **Required** | **Description** |
| ---------------- | -------- | ------------ | --------------- |
| `userId`         | `string` | ✅           | User ID         |
| `dto.showtimeId` | `string` | ✅           | Showtime ID     |

**Output:**

```typescript
{
  data: BookingCalculationDto; // Initial blank booking with 0 amount
}
```

#### Side Effects

- Creates a `Bookings` record with `PENDING` status.
- **Note:** Does not validate seats _yet_. Seat selection usually happens before or updated into the booking later (though the current code implies it just creates a shell).

---

### 1.2 getBookingSummary

**Summary:** The core calculation engine. Retrieves booking details, calculates totals, taxes, discounts (all of them), and loyalty points.

**Message Pattern:** `booking.getSummary`

#### Dependencies & Mocks

| **Dependency**        | **Type**                          | **Note for Tester**                                         |
| --------------------- | --------------------------------- | ----------------------------------------------------------- |
| `CinemaService` (RPC) | `SHOWTIME.GET_SHOWTIME_SEATS`     | **MUST MOCK**. Returns seat map to calculate ticket prices. |
| `CinemaService` (RPC) | `SHOWTIME.GET_SEATS_HELD_BY_USER` | To verify seat holds.                                       |
| `UserService` (RPC)   | `USER.GET_USER_DETAIL`            | For customer info.                                          |

#### Logic to Test

- **Calculation:** `Subtotal = Ticket Prices + Concessions`
- **Discounts:** `Final = Subtotal - Promotion - LoyaltyPoints`
- **Tax:** `VAT = (Final / 1.1) * 0.1` (Reverse calc logic in code)

---

### 1.3 cancelBooking

**Summary:** Cancels a pending/confirmed booking.

**Message Pattern:** `booking.cancel`

---

## 2. Payment Module

### 2.1 createPayment

**Summary:** Generates a VPNPay payment URL for a pending booking.

**Message Pattern:** `payment.create`

| **Inputs**          | **Type** | **Required** | **Description**    |
| ------------------- | -------- | ------------ | ------------------ |
| `bookingId`         | `string` | ✅           | Pending Booking ID |
| `dto.paymentMethod` | `string` | ✅           | e.g. `VNPAY`       |
| `ipAddr`            | `string` | ✅           | For VNPay Security |

**Output:**

```typescript
{
  data: {
    paymentUrl: string; // The VNPay redirect URL
    ...
  }
}
```

#### Side Effects

- Creates `Payments` record (`PENDING`).
- Updates `Payments` with generated `payment_url`.

---

### 2.2 handleVNPayIPN

**Summary:** Webhook handler for VNPay. Validates checksum and finalizes the booking.

**Message Pattern:** `payment.vnpay.ipn`

#### Logic to Test

1.  **Checksum Validation:** Re-calculate hash using `vnp_HashSecret`. Test with valid/invalid hashes.
2.  **Success Flow (`00`):**
    - Set Payment -> `COMPLETED`
    - Set Booking -> `CONFIRMED`
    - Set Tickets -> `VALID`
    - **Publish Event:** `booking.confirmed` to Redis (Mock `BookingEventService` if unit testing, or listen if E2E).
    - **Async Email:** Triggers email sending (Mock `NotificationService`).
3.  **Failure Flow:**
    - Set Payment -> `FAILED`
    - Set Booking -> `CANCELLED`
    - Set Tickets -> `CANCELLED`

#### Dependencies

- `BookingEventService` (Redis Pub/Sub)
- `NotificationService` (Email/SMS)

---

## 3. Concession Module

### 3.1 findAll

**Summary:** List concessions with filters (cinema, category).

**Message Pattern:** `concession.findAll`

---

### 3.2 create/update/delete

**Summary:** CRUD operations.

- **Constraint:** Cannot delete concession used in active bookings.

---

## 4. Loyalty Module

### 4.1 getBalance

**Summary:** Gets user points and tier info. Auto-creates account if missing (Bronze).

**Message Pattern:** `loyalty.getBalance`

---

### 4.2 earnPoints / redeemPoints

**Summary:** Updates point balance and logs transaction.

**Message Pattern:** `loyalty.earnPoints` / `loyalty.redeemPoints`

- **Constraint:** Redeem fails if insufficient points.

---

## 5. Promotion Module

### 5.1 validatePromotion

**Summary:** Checks if a code is valid for a specific booking amount.

**Message Pattern:** `promotion.validate`

#### Test Scenarios

- Expired date -> Invalid
- Usage limit reached -> Invalid
- Below min purchase -> Invalid
- **Success:** Returns valid status + discount amount.

---

## 6. Refund Module

### 6.1 createRefund

**Summary:** Requests a refund for a COMPLETED payment.

**Message Pattern:** `refund.create`

- **Constraint:** Refund amount <= Payment amount.

### 6.2 approveRefund

**Summary:** Finalizes refund.

**Message Pattern:** `refund.approve`

#### Side Effects

- Refund -> `COMPLETED`
- Payment -> `REFUNDED`
- Booking -> `CANCELLED` (Automatic cancellation cascade)
