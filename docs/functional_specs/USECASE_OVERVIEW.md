# Functional Specs Use-Case Overview

- Scope: docs/functional_specs
- Counting rule: 1 markdown file (.md) = 1 use-case
- Total use-cases: 126
- Generated on: 2026-04-21

## Actor

| Actor          | Description                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Guest          | Unregistered users who can browse movies, showtimes, and cinemas but cannot book tickets.      |
| User           | End-users who book tickets and interact with the system for personal use.                      |
| Admin          | Staff members who manage the cinema operations, including showtimes, bookings, and promotions. |
| Cinema Manager | Responsible for managing cinema details, halls, and ticket pricing.                            |

## Summary by Module

| Module                           | Use-cases |
| -------------------------------- | --------: |
| 3.1_User_Management              |         7 |
| 3.10_Promotions_Discounts_Module |         8 |
| 3.11_Loyalty_Points_Module       |         4 |
| 3.12_System_Configuration_Module |         2 |
| 3.2.1_Cinema_Management          |        10 |
| 3.2.2_Hall_Management            |         6 |
| 3.2.3_Ticket_Pricing_Management  |         2 |
| 3.3.1_Movie_Catalog              |         6 |
| 3.3.2_Movie_Releases             |         3 |
| 3.3.3_Genre_Management           |         5 |
| 3.3.4_Movie_Reviews              |         5 |
| 3.4_Showtime_Scheduling          |        10 |
| 3.5.1_User_Booking_Operations    |        11 |
| 3.5.2_Admin_Booking_Operations   |         9 |
| 3.5.3_Real-time_Seat_Selection   |         6 |
| 3.6_Payment_Transaction_Module   |         9 |
| 3.7_Ticket_Management_Module     |        10 |
| 3.8_Refund_Management_Module     |         7 |
| 3.9_Concessions_FB_Module        |         6 |

## Full Use-Case List

### 3.1_User_Management (7)

- [UM-01] User Authentication ([docs/functional_specs/3.1_User_Management/UM-01_User_Authentication.md](docs/functional_specs/3.1_User_Management/UM-01_User_Authentication.md))
- [UM-02] List Users ([docs/functional_specs/3.1_User_Management/UM-02_List_Users.md](docs/functional_specs/3.1_User_Management/UM-02_List_Users.md))
- [UM-03] Get User Profile ([docs/functional_specs/3.1_User_Management/UM-03_Get_User_Profile.md](docs/functional_specs/3.1_User_Management/UM-03_Get_User_Profile.md))
- [UM-04] Create Staff ([docs/functional_specs/3.1_User_Management/UM-04_Create_Staff.md](docs/functional_specs/3.1_User_Management/UM-04_Create_Staff.md))
- [UM-05] List Staff ([docs/functional_specs/3.1_User_Management/UM-05_List_Staff.md](docs/functional_specs/3.1_User_Management/UM-05_List_Staff.md))
- [UM-06] Get Staff Details ([docs/functional_specs/3.1_User_Management/UM-06_Get_Staff_Details.md](docs/functional_specs/3.1_User_Management/UM-06_Get_Staff_Details.md))
- [UM-07] Update Staff ([docs/functional_specs/3.1_User_Management/UM-07_Update_Staff.md](docs/functional_specs/3.1_User_Management/UM-07_Update_Staff.md))

### 3.10_Promotions_Discounts_Module (8)

- [PM-01] List Promotions ([docs/functional_specs/3.10_Promotions_Discounts_Module/PM-01_List_Promotions.md](docs/functional_specs/3.10_Promotions_Discounts_Module/PM-01_List_Promotions.md))
- [PM-02] Get Promotion Details ([docs/functional_specs/3.10_Promotions_Discounts_Module/PM-02_Get_Promotion_Details.md](docs/functional_specs/3.10_Promotions_Discounts_Module/PM-02_Get_Promotion_Details.md))
- [PM-03] Find Promotion by Code ([docs/functional_specs/3.10_Promotions_Discounts_Module/PM-03_Find_Promotion_by_Code.md](docs/functional_specs/3.10_Promotions_Discounts_Module/PM-03_Find_Promotion_by_Code.md))
- [PM-04] Validate Promotion Code ([docs/functional_specs/3.10_Promotions_Discounts_Module/PM-04_Validate_Promotion_Code.md](docs/functional_specs/3.10_Promotions_Discounts_Module/PM-04_Validate_Promotion_Code.md))
- [PM-05] Create Promotion ([docs/functional_specs/3.10_Promotions_Discounts_Module/PM-05_Create_Promotion.md](docs/functional_specs/3.10_Promotions_Discounts_Module/PM-05_Create_Promotion.md))
- [PM-06] Update Promotion ([docs/functional_specs/3.10_Promotions_Discounts_Module/PM-06_Update_Promotion.md](docs/functional_specs/3.10_Promotions_Discounts_Module/PM-06_Update_Promotion.md))
- [PM-07] Delete Promotion ([docs/functional_specs/3.10_Promotions_Discounts_Module/PM-07_Delete_Promotion.md](docs/functional_specs/3.10_Promotions_Discounts_Module/PM-07_Delete_Promotion.md))
- [PM-08] Toggle Promotion Active ([docs/functional_specs/3.10_Promotions_Discounts_Module/PM-08_Toggle_Promotion_Active.md](docs/functional_specs/3.10_Promotions_Discounts_Module/PM-08_Toggle_Promotion_Active.md))

### 3.11_Loyalty_Points_Module (4)

- [LY-01] Get Loyalty Balance ([docs/functional_specs/3.11_Loyalty_Points_Module/LY-01_Get_Loyalty_Balance.md](docs/functional_specs/3.11_Loyalty_Points_Module/LY-01_Get_Loyalty_Balance.md))
- [LY-02] Get Transaction History ([docs/functional_specs/3.11_Loyalty_Points_Module/LY-02_Get_Transaction_History.md](docs/functional_specs/3.11_Loyalty_Points_Module/LY-02_Get_Transaction_History.md))
- [LY-03] Earn Points ([docs/functional_specs/3.11_Loyalty_Points_Module/LY-03_Earn_Points.md](docs/functional_specs/3.11_Loyalty_Points_Module/LY-03_Earn_Points.md))
- [LY-04] Redeem Points ([docs/functional_specs/3.11_Loyalty_Points_Module/LY-04_Redeem_Points.md](docs/functional_specs/3.11_Loyalty_Points_Module/LY-04_Redeem_Points.md))

### 3.12_System_Configuration_Module (2)

- [CF-01] Get All Settings ([docs/functional_specs/3.12_System_Configuration_Module/CF-01_Get_All_Settings.md](docs/functional_specs/3.12_System_Configuration_Module/CF-01_Get_All_Settings.md))
- [CF-02] Update Setting ([docs/functional_specs/3.12_System_Configuration_Module/CF-02_Update_Setting.md](docs/functional_specs/3.12_System_Configuration_Module/CF-02_Update_Setting.md))

### 3.2.1_Cinema_Management (10)

- [CM-01] List All Cinemas ([docs/functional_specs/3.2.1_Cinema_Management/CM-01_List_All_Cinemas.md](docs/functional_specs/3.2.1_Cinema_Management/CM-01_List_All_Cinemas.md))
- [CM-02] Create Cinema ([docs/functional_specs/3.2.1_Cinema_Management/CM-02_Create_Cinema.md](docs/functional_specs/3.2.1_Cinema_Management/CM-02_Create_Cinema.md))
- [CM-03] Update Cinema ([docs/functional_specs/3.2.1_Cinema_Management/CM-03_Update_Cinema.md](docs/functional_specs/3.2.1_Cinema_Management/CM-03_Update_Cinema.md))
- [CM-04] Delete Cinema ([docs/functional_specs/3.2.1_Cinema_Management/CM-04_Delete_Cinema.md](docs/functional_specs/3.2.1_Cinema_Management/CM-04_Delete_Cinema.md))
- [CM-05] Get Cinema Detail ([docs/functional_specs/3.2.1_Cinema_Management/CM-05_Get_Cinema_Detail.md](docs/functional_specs/3.2.1_Cinema_Management/CM-05_Get_Cinema_Detail.md))
- [CM-06] Search Cinemas Nearby ([docs/functional_specs/3.2.1_Cinema_Management/CM-06_Search_Cinemas_Nearby.md](docs/functional_specs/3.2.1_Cinema_Management/CM-06_Search_Cinemas_Nearby.md))
- [CM-07] Search Cinemas by Query ([docs/functional_specs/3.2.1_Cinema_Management/CM-07_Search_Cinemas_by_Query.md](docs/functional_specs/3.2.1_Cinema_Management/CM-07_Search_Cinemas_by_Query.md))
- [CM-08] Filter Cinemas ([docs/functional_specs/3.2.1_Cinema_Management/CM-08_Filter_Cinemas.md](docs/functional_specs/3.2.1_Cinema_Management/CM-08_Filter_Cinemas.md))
- [CM-09] Get Available Cities ([docs/functional_specs/3.2.1_Cinema_Management/CM-09_Get_Available_Cities.md](docs/functional_specs/3.2.1_Cinema_Management/CM-09_Get_Available_Cities.md))
- [CM-10] Get Available Districts ([docs/functional_specs/3.2.1_Cinema_Management/CM-10_Get_Available_Districts.md](docs/functional_specs/3.2.1_Cinema_Management/CM-10_Get_Available_Districts.md))

### 3.2.2_Hall_Management (6)

- [HM-01] Get Hall by ID ([docs/functional_specs/3.2.2_Hall_Management/HM-01_Get_Hall_by_ID.md](docs/functional_specs/3.2.2_Hall_Management/HM-01_Get_Hall_by_ID.md))
- [HM-02] Get Halls of Cinema ([docs/functional_specs/3.2.2_Hall_Management/HM-02_Get_Halls_of_Cinema.md](docs/functional_specs/3.2.2_Hall_Management/HM-02_Get_Halls_of_Cinema.md))
- [HM-03] Create Hall ([docs/functional_specs/3.2.2_Hall_Management/HM-03_Create_Hall.md](docs/functional_specs/3.2.2_Hall_Management/HM-03_Create_Hall.md))
- [HM-04] Update Hall ([docs/functional_specs/3.2.2_Hall_Management/HM-04_Update_Hall.md](docs/functional_specs/3.2.2_Hall_Management/HM-04_Update_Hall.md))
- [HM-05] Delete Hall ([docs/functional_specs/3.2.2_Hall_Management/HM-05_Delete_Hall.md](docs/functional_specs/3.2.2_Hall_Management/HM-05_Delete_Hall.md))
- [HM-06] Update Seat Status ([docs/functional_specs/3.2.2_Hall_Management/HM-06_Update_Seat_Status.md](docs/functional_specs/3.2.2_Hall_Management/HM-06_Update_Seat_Status.md))

### 3.2.3_Ticket_Pricing_Management (2)

- [TP-01] Get Pricing for Hall ([docs/functional_specs/3.2.3_Ticket_Pricing_Management/TP-01_Get_Pricing_for_Hall.md](docs/functional_specs/3.2.3_Ticket_Pricing_Management/TP-01_Get_Pricing_for_Hall.md))
- [TP-02] Update Ticket Pricing ([docs/functional_specs/3.2.3_Ticket_Pricing_Management/TP-02_Update_Ticket_Pricing.md](docs/functional_specs/3.2.3_Ticket_Pricing_Management/TP-02_Update_Ticket_Pricing.md))

### 3.3.1_Movie_Catalog (6)

- [MV-01] List Movies ([docs/functional_specs/3.3.1_Movie_Catalog/MV-01_List_Movies.md](docs/functional_specs/3.3.1_Movie_Catalog/MV-01_List_Movies.md))
- [MV-02] Get Movie Details ([docs/functional_specs/3.3.1_Movie_Catalog/MV-02_Get_Movie_Details.md](docs/functional_specs/3.3.1_Movie_Catalog/MV-02_Get_Movie_Details.md))
- [MV-03] Get Movie Releases ([docs/functional_specs/3.3.1_Movie_Catalog/MV-03_Get_Movie_Releases.md](docs/functional_specs/3.3.1_Movie_Catalog/MV-03_Get_Movie_Releases.md))
- [MV-04] Create Movie ([docs/functional_specs/3.3.1_Movie_Catalog/MV-04_Create_Movie.md](docs/functional_specs/3.3.1_Movie_Catalog/MV-04_Create_Movie.md))
- [MV-05] Update Movie ([docs/functional_specs/3.3.1_Movie_Catalog/MV-05_Update_Movie.md](docs/functional_specs/3.3.1_Movie_Catalog/MV-05_Update_Movie.md))
- [MV-06] Delete Movie ([docs/functional_specs/3.3.1_Movie_Catalog/MV-06_Delete_Movie.md](docs/functional_specs/3.3.1_Movie_Catalog/MV-06_Delete_Movie.md))

### 3.3.2_Movie_Releases (3)

- [MR-01] Create Movie Release ([docs/functional_specs/3.3.2_Movie_Releases/MR-01_Create_Movie_Release.md](docs/functional_specs/3.3.2_Movie_Releases/MR-01_Create_Movie_Release.md))
- [MR-02] Update Movie Release ([docs/functional_specs/3.3.2_Movie_Releases/MR-02_Update_Movie_Release.md](docs/functional_specs/3.3.2_Movie_Releases/MR-02_Update_Movie_Release.md))
- [MR-03] Delete Movie Release ([docs/functional_specs/3.3.2_Movie_Releases/MR-03_Delete_Movie_Release.md](docs/functional_specs/3.3.2_Movie_Releases/MR-03_Delete_Movie_Release.md))

### 3.3.3_Genre_Management (5)

- [GM-01] List All Genres ([docs/functional_specs/3.3.3_Genre_Management/GM-01_List_All_Genres.md](docs/functional_specs/3.3.3_Genre_Management/GM-01_List_All_Genres.md))
- [GM-02] Get Genre by ID ([docs/functional_specs/3.3.3_Genre_Management/GM-02_Get_Genre_by_ID.md](docs/functional_specs/3.3.3_Genre_Management/GM-02_Get_Genre_by_ID.md))
- [GM-03] Create Genre ([docs/functional_specs/3.3.3_Genre_Management/GM-03_Create_Genre.md](docs/functional_specs/3.3.3_Genre_Management/GM-03_Create_Genre.md))
- [GM-04] Update Genre ([docs/functional_specs/3.3.3_Genre_Management/GM-04_Update_Genre.md](docs/functional_specs/3.3.3_Genre_Management/GM-04_Update_Genre.md))
- [GM-05] Delete Genre ([docs/functional_specs/3.3.3_Genre_Management/GM-05_Delete_Genre.md](docs/functional_specs/3.3.3_Genre_Management/GM-05_Delete_Genre.md))

### 3.3.4_Movie_Reviews (5)

- [RV-01] List Reviews ([docs/functional_specs/3.3.4_Movie_Reviews/RV-01_List_Reviews.md](docs/functional_specs/3.3.4_Movie_Reviews/RV-01_List_Reviews.md))
- [RV-02] Get Movie Reviews ([docs/functional_specs/3.3.4_Movie_Reviews/RV-02_Get_Movie_Reviews.md](docs/functional_specs/3.3.4_Movie_Reviews/RV-02_Get_Movie_Reviews.md))
- [RV-03] Create Review ([docs/functional_specs/3.3.4_Movie_Reviews/RV-03_Create_Review.md](docs/functional_specs/3.3.4_Movie_Reviews/RV-03_Create_Review.md))
- [RV-04] Update Review ([docs/functional_specs/3.3.4_Movie_Reviews/RV-04_Update_Review.md](docs/functional_specs/3.3.4_Movie_Reviews/RV-04_Update_Review.md))
- [RV-05] Delete Review ([docs/functional_specs/3.3.4_Movie_Reviews/RV-05_Delete_Review.md](docs/functional_specs/3.3.4_Movie_Reviews/RV-05_Delete_Review.md))

### 3.4_Showtime_Scheduling (10)

- [ST-01] Get Showtime Seats ([docs/functional_specs/3.4_Showtime_Scheduling/ST-01_Get_Showtime_Seats.md](docs/functional_specs/3.4_Showtime_Scheduling/ST-01_Get_Showtime_Seats.md))
- [ST-02] Get Session TTL ([docs/functional_specs/3.4_Showtime_Scheduling/ST-02_Get_Session_TTL.md](docs/functional_specs/3.4_Showtime_Scheduling/ST-02_Get_Session_TTL.md))
- [ST-03] Create Showtime ([docs/functional_specs/3.4_Showtime_Scheduling/ST-03_Create_Showtime.md](docs/functional_specs/3.4_Showtime_Scheduling/ST-03_Create_Showtime.md))
- [ST-04] Create Batch Showtimes ([docs/functional_specs/3.4_Showtime_Scheduling/ST-04_Create_Batch_Showtimes.md](docs/functional_specs/3.4_Showtime_Scheduling/ST-04_Create_Batch_Showtimes.md))
- [ST-05] Update Showtime ([docs/functional_specs/3.4_Showtime_Scheduling/ST-05_Update_Showtime.md](docs/functional_specs/3.4_Showtime_Scheduling/ST-05_Update_Showtime.md))
- [ST-06] Delete Showtime ([docs/functional_specs/3.4_Showtime_Scheduling/ST-06_Delete_Showtime.md](docs/functional_specs/3.4_Showtime_Scheduling/ST-06_Delete_Showtime.md))
- [ST-07] Get Movie Showtimes at Cinema ([docs/functional_specs/3.4_Showtime_Scheduling/ST-07_Get_Movie_Showtimes_at_Cinema.md](docs/functional_specs/3.4_Showtime_Scheduling/ST-07_Get_Movie_Showtimes_at_Cinema.md))
- [ST-08] Admin Get Showtimes ([docs/functional_specs/3.4_Showtime_Scheduling/ST-08_Admin_Get_Showtimes.md](docs/functional_specs/3.4_Showtime_Scheduling/ST-08_Admin_Get_Showtimes.md))
- [ST-09] Get Movies at Cinema ([docs/functional_specs/3.4_Showtime_Scheduling/ST-09_Get_Movies_at_Cinema.md](docs/functional_specs/3.4_Showtime_Scheduling/ST-09_Get_Movies_at_Cinema.md))
- [ST-10] Get All Movies with Showtimes ([docs/functional_specs/3.4_Showtime_Scheduling/ST-10_Get_All_Movies_with_Showtimes.md](docs/functional_specs/3.4_Showtime_Scheduling/ST-10_Get_All_Movies_with_Showtimes.md))

### 3.5.1_User_Booking_Operations (11)

- [BK-01] Create Booking ([docs/functional_specs/3.5.1_User_Booking_Operations/BK-01_Create_Booking.md](docs/functional_specs/3.5.1_User_Booking_Operations/BK-01_Create_Booking.md))
- [BK-02] List User Bookings ([docs/functional_specs/3.5.1_User_Booking_Operations/BK-02_List_User_Bookings.md](docs/functional_specs/3.5.1_User_Booking_Operations/BK-02_List_User_Bookings.md))
- [BK-03] Get Booking Details ([docs/functional_specs/3.5.1_User_Booking_Operations/BK-03_Get_Booking_Details.md](docs/functional_specs/3.5.1_User_Booking_Operations/BK-03_Get_Booking_Details.md))
- [BK-04] Get Booking Summary ([docs/functional_specs/3.5.1_User_Booking_Operations/BK-04_Get_Booking_Summary.md](docs/functional_specs/3.5.1_User_Booking_Operations/BK-04_Get_Booking_Summary.md))
- [BK-05] Cancel Booking ([docs/functional_specs/3.5.1_User_Booking_Operations/BK-05_Cancel_Booking.md](docs/functional_specs/3.5.1_User_Booking_Operations/BK-05_Cancel_Booking.md))
- [BK-06] Update Booking ([docs/functional_specs/3.5.1_User_Booking_Operations/BK-06_Update_Booking.md](docs/functional_specs/3.5.1_User_Booking_Operations/BK-06_Update_Booking.md))
- [BK-07] Reschedule Booking ([docs/functional_specs/3.5.1_User_Booking_Operations/BK-07_Reschedule_Booking.md](docs/functional_specs/3.5.1_User_Booking_Operations/BK-07_Reschedule_Booking.md))
- [BK-08] Calculate Refund ([docs/functional_specs/3.5.1_User_Booking_Operations/BK-08_Calculate_Refund.md](docs/functional_specs/3.5.1_User_Booking_Operations/BK-08_Calculate_Refund.md))
- [BK-09] Cancel with Refund ([docs/functional_specs/3.5.1_User_Booking_Operations/BK-09_Cancel_with_Refund.md](docs/functional_specs/3.5.1_User_Booking_Operations/BK-09_Cancel_with_Refund.md))
- [BK-10] Check User Booking at Showtime ([docs/functional_specs/3.5.1_User_Booking_Operations/BK-10_Check_User_Booking_at_Showtime.md](docs/functional_specs/3.5.1_User_Booking_Operations/BK-10_Check_User_Booking_at_Showtime.md))
- [BK-11] Get Cancellation Policy ([docs/functional_specs/3.5.1_User_Booking_Operations/BK-11_Get_Cancellation_Policy.md](docs/functional_specs/3.5.1_User_Booking_Operations/BK-11_Get_Cancellation_Policy.md))

### 3.5.2_Admin_Booking_Operations (9)

- [BK-A01] Admin List All Bookings ([docs/functional_specs/3.5.2_Admin_Booking_Operations/BK-A01_Admin_List_All_Bookings.md](docs/functional_specs/3.5.2_Admin_Booking_Operations/BK-A01_Admin_List_All_Bookings.md))
- [BK-A02] Find Bookings by Showtime ([docs/functional_specs/3.5.2_Admin_Booking_Operations/BK-A02_Find_Bookings_by_Showtime.md](docs/functional_specs/3.5.2_Admin_Booking_Operations/BK-A02_Find_Bookings_by_Showtime.md))
- [BK-A03] Find Bookings by Date Range ([docs/functional_specs/3.5.2_Admin_Booking_Operations/BK-A03_Find_Bookings_by_Date_Range.md](docs/functional_specs/3.5.2_Admin_Booking_Operations/BK-A03_Find_Bookings_by_Date_Range.md))
- [BK-A04] Update Booking Status ([docs/functional_specs/3.5.2_Admin_Booking_Operations/BK-A04_Update_Booking_Status.md](docs/functional_specs/3.5.2_Admin_Booking_Operations/BK-A04_Update_Booking_Status.md))
- [BK-A05] Confirm Booking ([docs/functional_specs/3.5.2_Admin_Booking_Operations/BK-A05_Confirm_Booking.md](docs/functional_specs/3.5.2_Admin_Booking_Operations/BK-A05_Confirm_Booking.md))
- [BK-A06] Complete Booking ([docs/functional_specs/3.5.2_Admin_Booking_Operations/BK-A06_Complete_Booking.md](docs/functional_specs/3.5.2_Admin_Booking_Operations/BK-A06_Complete_Booking.md))
- [BK-A07] Expire Booking ([docs/functional_specs/3.5.2_Admin_Booking_Operations/BK-A07_Expire_Booking.md](docs/functional_specs/3.5.2_Admin_Booking_Operations/BK-A07_Expire_Booking.md))
- [BK-A08] Get Booking Statistics ([docs/functional_specs/3.5.2_Admin_Booking_Operations/BK-A08_Get_Booking_Statistics.md](docs/functional_specs/3.5.2_Admin_Booking_Operations/BK-A08_Get_Booking_Statistics.md))
- [BK-A09] Get Revenue Report ([docs/functional_specs/3.5.2_Admin_Booking_Operations/BK-A09_Get_Revenue_Report.md](docs/functional_specs/3.5.2_Admin_Booking_Operations/BK-A09_Get_Revenue_Report.md))

### 3.5.3_Real-time_Seat_Selection (6)

- [RT-01] Hold Seat ([docs/functional_specs/3.5.3_Real-time_Seat_Selection/RT-01_Hold_Seat.md](docs/functional_specs/3.5.3_Real-time_Seat_Selection/RT-01_Hold_Seat.md))
- [RT-02] Release Seat ([docs/functional_specs/3.5.3_Real-time_Seat_Selection/RT-02_Release_Seat.md](docs/functional_specs/3.5.3_Real-time_Seat_Selection/RT-02_Release_Seat.md))
- [RT-03] Confirm Seat Booked ([docs/functional_specs/3.5.3_Real-time_Seat_Selection/RT-03_Confirm_Seat_Booked.md](docs/functional_specs/3.5.3_Real-time_Seat_Selection/RT-03_Confirm_Seat_Booked.md))
- [RT-04] Clear Old Showtime Session ([docs/functional_specs/3.5.3_Real-time_Seat_Selection/RT-04_Clear_Old_Showtime_Session.md](docs/functional_specs/3.5.3_Real-time_Seat_Selection/RT-04_Clear_Old_Showtime_Session.md))
- [RT-05] Get All Held Seats ([docs/functional_specs/3.5.3_Real-time_Seat_Selection/RT-05_Get_All_Held_Seats.md](docs/functional_specs/3.5.3_Real-time_Seat_Selection/RT-05_Get_All_Held_Seats.md))
- [RT-06] Get User Held Seats ([docs/functional_specs/3.5.3_Real-time_Seat_Selection/RT-06_Get_User_Held_Seats.md](docs/functional_specs/3.5.3_Real-time_Seat_Selection/RT-06_Get_User_Held_Seats.md))

### 3.6_Payment_Transaction_Module (9)

- [PY-01] Create Payment ([docs/functional_specs/3.6_Payment_Transaction_Module/PY-01_Create_Payment.md](docs/functional_specs/3.6_Payment_Transaction_Module/PY-01_Create_Payment.md))
- [PY-02] Get Payment Details ([docs/functional_specs/3.6_Payment_Transaction_Module/PY-02_Get_Payment_Details.md](docs/functional_specs/3.6_Payment_Transaction_Module/PY-02_Get_Payment_Details.md))
- [PY-03] Get Payments by Booking ([docs/functional_specs/3.6_Payment_Transaction_Module/PY-03_Get_Payments_by_Booking.md](docs/functional_specs/3.6_Payment_Transaction_Module/PY-03_Get_Payments_by_Booking.md))
- [PY-04] VNPay IPN Webhook ([docs/functional_specs/3.6_Payment_Transaction_Module/PY-04_VNPay_IPN_Webhook.md](docs/functional_specs/3.6_Payment_Transaction_Module/PY-04_VNPay_IPN_Webhook.md))
- [PY-05] VNPay Return URL ([docs/functional_specs/3.6_Payment_Transaction_Module/PY-05_VNPay_Return_URL.md](docs/functional_specs/3.6_Payment_Transaction_Module/PY-05_VNPay_Return_URL.md))
- [PY-A01] Admin List All Payments ([docs/functional_specs/3.6_Payment_Transaction_Module/PY-A01_Admin_List_All_Payments.md](docs/functional_specs/3.6_Payment_Transaction_Module/PY-A01_Admin_List_All_Payments.md))
- [PY-A02] Find Payments by Status ([docs/functional_specs/3.6_Payment_Transaction_Module/PY-A02_Find_Payments_by_Status.md](docs/functional_specs/3.6_Payment_Transaction_Module/PY-A02_Find_Payments_by_Status.md))
- [PY-A03] Cancel Payment ([docs/functional_specs/3.6_Payment_Transaction_Module/PY-A03_Cancel_Payment.md](docs/functional_specs/3.6_Payment_Transaction_Module/PY-A03_Cancel_Payment.md))
- [PY-A04] Get Payment Statistics ([docs/functional_specs/3.6_Payment_Transaction_Module/PY-A04_Get_Payment_Statistics.md](docs/functional_specs/3.6_Payment_Transaction_Module/PY-A04_Get_Payment_Statistics.md))

### 3.7_Ticket_Management_Module (10)

- [TK-01] Get Ticket Details ([docs/functional_specs/3.7_Ticket_Management_Module/TK-01_Get_Ticket_Details.md](docs/functional_specs/3.7_Ticket_Management_Module/TK-01_Get_Ticket_Details.md))
- [TK-02] Find Ticket by Code ([docs/functional_specs/3.7_Ticket_Management_Module/TK-02_Find_Ticket_by_Code.md](docs/functional_specs/3.7_Ticket_Management_Module/TK-02_Find_Ticket_by_Code.md))
- [TK-03] Validate Ticket ([docs/functional_specs/3.7_Ticket_Management_Module/TK-03_Validate_Ticket.md](docs/functional_specs/3.7_Ticket_Management_Module/TK-03_Validate_Ticket.md))
- [TK-04] Use Ticket ([docs/functional_specs/3.7_Ticket_Management_Module/TK-04_Use_Ticket.md](docs/functional_specs/3.7_Ticket_Management_Module/TK-04_Use_Ticket.md))
- [TK-05] Generate QR Code ([docs/functional_specs/3.7_Ticket_Management_Module/TK-05_Generate_QR_Code.md](docs/functional_specs/3.7_Ticket_Management_Module/TK-05_Generate_QR_Code.md))
- [TK-A01] Admin List All Tickets ([docs/functional_specs/3.7_Ticket_Management_Module/TK-A01_Admin_List_All_Tickets.md](docs/functional_specs/3.7_Ticket_Management_Module/TK-A01_Admin_List_All_Tickets.md))
- [TK-A02] Find Tickets by Showtime ([docs/functional_specs/3.7_Ticket_Management_Module/TK-A02_Find_Tickets_by_Showtime.md](docs/functional_specs/3.7_Ticket_Management_Module/TK-A02_Find_Tickets_by_Showtime.md))
- [TK-A03] Find Tickets by Booking ([docs/functional_specs/3.7_Ticket_Management_Module/TK-A03_Find_Tickets_by_Booking.md](docs/functional_specs/3.7_Ticket_Management_Module/TK-A03_Find_Tickets_by_Booking.md))
- [TK-A04] Bulk Validate Tickets ([docs/functional_specs/3.7_Ticket_Management_Module/TK-A04_Bulk_Validate_Tickets.md](docs/functional_specs/3.7_Ticket_Management_Module/TK-A04_Bulk_Validate_Tickets.md))
- [TK-A05] Cancel Ticket ([docs/functional_specs/3.7_Ticket_Management_Module/TK-A05_Cancel_Ticket.md](docs/functional_specs/3.7_Ticket_Management_Module/TK-A05_Cancel_Ticket.md))

### 3.8_Refund_Management_Module (7)

- [RF-01] Create Refund Request ([docs/functional_specs/3.8_Refund_Management_Module/RF-01_Create_Refund_Request.md](docs/functional_specs/3.8_Refund_Management_Module/RF-01_Create_Refund_Request.md))
- [RF-02] List Refunds ([docs/functional_specs/3.8_Refund_Management_Module/RF-02_List_Refunds.md](docs/functional_specs/3.8_Refund_Management_Module/RF-02_List_Refunds.md))
- [RF-03] Get Refund Details ([docs/functional_specs/3.8_Refund_Management_Module/RF-03_Get_Refund_Details.md](docs/functional_specs/3.8_Refund_Management_Module/RF-03_Get_Refund_Details.md))
- [RF-04] Find Refunds by Payment ([docs/functional_specs/3.8_Refund_Management_Module/RF-04_Find_Refunds_by_Payment.md](docs/functional_specs/3.8_Refund_Management_Module/RF-04_Find_Refunds_by_Payment.md))
- [RF-05] Process Refund ([docs/functional_specs/3.8_Refund_Management_Module/RF-05_Process_Refund.md](docs/functional_specs/3.8_Refund_Management_Module/RF-05_Process_Refund.md))
- [RF-06] Approve Refund ([docs/functional_specs/3.8_Refund_Management_Module/RF-06_Approve_Refund.md](docs/functional_specs/3.8_Refund_Management_Module/RF-06_Approve_Refund.md))
- [RF-07] Reject Refund ([docs/functional_specs/3.8_Refund_Management_Module/RF-07_Reject_Refund.md](docs/functional_specs/3.8_Refund_Management_Module/RF-07_Reject_Refund.md))

### 3.9_Concessions_FB_Module (6)

- [CS-01] List Concessions ([docs/functional_specs/3.9_Concessions_FB_Module/CS-01_List_Concessions.md](docs/functional_specs/3.9_Concessions_FB_Module/CS-01_List_Concessions.md))
- [CS-02] Get Concession Details ([docs/functional_specs/3.9_Concessions_FB_Module/CS-02_Get_Concession_Details.md](docs/functional_specs/3.9_Concessions_FB_Module/CS-02_Get_Concession_Details.md))
- [CS-03] Create Concession ([docs/functional_specs/3.9_Concessions_FB_Module/CS-03_Create_Concession.md](docs/functional_specs/3.9_Concessions_FB_Module/CS-03_Create_Concession.md))
- [CS-04] Update Concession ([docs/functional_specs/3.9_Concessions_FB_Module/CS-04_Update_Concession.md](docs/functional_specs/3.9_Concessions_FB_Module/CS-04_Update_Concession.md))
- [CS-05] Delete Concession ([docs/functional_specs/3.9_Concessions_FB_Module/CS-05_Delete_Concession.md](docs/functional_specs/3.9_Concessions_FB_Module/CS-05_Delete_Concession.md))
- [CS-06] Update Inventory ([docs/functional_specs/3.9_Concessions_FB_Module/CS-06_Update_Inventory.md](docs/functional_specs/3.9_Concessions_FB_Module/CS-06_Update_Inventory.md))
