# Function Point Function List

| STT | Main Function                     | Sub Function                    | Web | Mobile | C1  | W1  | C2  | W2  | C3  | W3  | C4  | W4  | C5  | W5  |
| --- | --------------------------------- | ------------------------------- | --- | ------ | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1   | Customer Account Management       | Account Registration            | X   |        | 1   | 4   |     |     |     |     | 1   | 10  | 1   | 7   |
| 2   | Customer Account Management       | System Login                    | X   |        | 1   | 3   |     |     |     |     |     |     | 1   | 7   |
| 3   | Customer Account Management       | Personal Information Management | X   |        | 1   | 4   |     |     | 1   | 3   | 1   | 10  | 1   | 7   |
| 4   | Movie Discovery & Search          | View Now Showing Movies         | X   |        |     |     |     |     | 1   | 3   | 1   | 10  |     |     |
| 5   | Movie Discovery & Search          | View Movie Details              | X   |        |     |     |     |     | 1   | 3   | 1   | 10  |     |     |
| 6   | Movie Discovery & Search          | Search Movies                   | X   |        |     |     |     |     | 1   | 4   | 1   | 10  |     |     |
| 7   | Cinema & Showtime Selection       | Select Cinema                   | X   |        |     |     |     |     | 1   | 4   | 1   | 10  |     |     |
| 8   | Cinema & Showtime Selection       | Select Date & Showtime          | X   |        |     |     |     |     | 1   | 4   | 1   | 15  |     |     |
| 9   | Ticket Booking & Seat Selection   | Select Seats                    | X   |        |     |     | 1   | 5   | 1   | 6   | 1   | 15  |     |     |
| 10  | Ticket Booking & Seat Selection   | Booking Confirmation            | X   |        | 1   | 6   | 1   | 5   |     |     | 1   | 15  |     |     |
| 11  | Payment & Confirmation            | Ticket Payment                  | X   |        | 1   | 6   | 1   | 5   |     |     | 1   | 15  | 1   | 7   |
| 12  | Payment & Confirmation            | Receive E-Ticket                | X   |        |     |     | 1   | 4   |     |     | 1   | 15  | 1   | 5   |
| 13  | Booking Management                | Manage Reservations             | X   |        | 1   | 6   | 1   | 5   | 1   | 4   | 1   | 15  |     |     |
| 14  | Booking Management                | Cancel & Exchange Tickets       | X   |        | 1   | 6   | 1   | 5   | 1   | 4   | 1   | 15  |     |     |
| 15  | Promotions & Loyalty Programs     | Manage Promotions               | X   |        | 1   | 4   | 1   | 4   | 1   | 3   | 1   | 10  |     |     |
| 16  | Social Features                   | Manage Reviews                  | X   |        | 1   | 4   |     |     | 1   | 3   | 1   | 7   |     |     |
| 17  | Cinema System Management          | Manage Cinemas                  | X   |        | 1   | 4   |     |     | 1   | 4   | 1   | 10  |     |     |
| 18  | Cinema System Management          | Manage Halls                    | X   |        | 1   | 4   |     |     | 1   | 4   | 1   | 10  |     |     |
| 19  | Cinema System Management          | Manage Seat Status              | X   |        | 1   | 3   |     |     |     |     | 1   | 7   |     |     |
| 20  | Cinema System Management          | Manage Showtime Seats           | X   |        | 1   | 6   | 1   | 5   | 1   | 6   | 1   | 15  |     |     |
| 21  | Cinema System Management          | Manage Movies                   | X   |        | 1   | 4   |     |     | 1   | 3   | 1   | 10  |     |     |
| 22  | Cinema System Management          | Manage Genres                   | X   |        | 1   | 3   |     |     |     |     | 1   | 7   |     |     |
| 23  | Cinema System Management          | Manage Movie Releases           | X   |        | 1   | 4   |     |     |     |     | 1   | 10  |     |     |
| 24  | Cinema System Management          | Manage Showtimes                | X   |        | 1   | 6   |     |     | 1   | 6   | 1   | 15  |     |     |
| 25  | Cinema System Management          | Batch Showtime Management       | X   |        | 1   | 6   |     |     |     |     | 1   | 15  |     |     |
| 26  | Cinema System Management          | Manage Ticket Pricing           | X   |        | 1   | 4   |     |     | 1   | 3   | 1   | 7   |     |     |
| 27  | Cinema System Management          | Manage Concessions              | X   |        | 1   | 4   |     |     | 1   | 3   | 1   | 10  |     |     |
| 28  | Cinema Operations Management      | Manage Staff                    | X   |        | 1   | 4   |     |     | 1   | 3   | 1   | 10  |     |     |
| 29  | Cinema Operations Management      | Admin Login                     | X   |        | 1   | 3   |     |     |     |     |     |     | 1   | 7   |
| 30  | Cinema Operations Management      | System Settings Management      | X   |        | 1   | 4   |     |     | 1   | 3   | 1   | 7   |     |     |
| 31  | Business Intelligence & Reporting | Reports & Analytics             | X   |        |     |     | 1   | 7   | 1   | 6   | 1   | 15  |     |     |

---

# Totals

| Metric                  | Value |
| ----------------------- | ----- |
| Total C1 × W1           | 102   |
| Total C2 × W2           | 45    |
| Total C3 × W3           | 82    |
| Total C4 × W4           | 330   |
| Total C5 × W5           | 47    |
| Total Unadjusted FP (Δ) | 606   |

---

# Value Adjustment Factor (VAF)

| Item        | Value               |
| ----------- | ------------------- |
| ΣFi         | 48                  |
| VAF Formula | 0.65 + (0.01 × ΣFi) |
| VAF Result  | 1.13                |

---

# Final Function Point

| Item       | Value        |
| ---------- | ------------ |
| FP Formula | FP = Δ × VAF |
| Final FP   | 684.78       |

---

# Cost Estimation

| Name                  | Value   | Unit  |
| --------------------- | ------- | ----- |
| Cost per person/month | 20      | USD   |
| Assumed Productivity  | 4       | FP/pm |
| Cost per FP           | 5       | USD   |
| Function Point        | 684.78  | FP    |
| Estimated Effort      | 171.20  | pm    |
| Estimated Cost        | 3423.90 | USD   |
