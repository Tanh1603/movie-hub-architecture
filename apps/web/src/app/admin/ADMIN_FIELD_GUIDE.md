# Admin Dashboard - Complete Field Guide

This document explains the business meaning and purpose of all fields across all admin screens.

---

## 📍 1. Cinemas Management

**Purpose**: Manage cinema locations, facilities, operating hours, and contact information.

### Main Fields:

| Field | Type | Purpose | Example | Business Meaning |
|-------|------|---------|---------|-----------------|
| **Name** | Text | Cinema name/location identifier | "CGV Tân Bình" | Unique identification of cinema branch |
| **Address** | Text | Full street address | "123 Nguyễn Hữu Cảnh" | Physical location for customer navigation |
| **City** | Text | City/Province | "Ho Chi Minh" | Geographic region categorization |
| **District** | Text | District/Ward | "Bình Thạnh" | Finer location granularity |
| **Phone** | Phone | Contact number | "+84-28-38120000" | Customer service hotline |
| **Email** | Email | Contact email | "cinemas@cinemax.vn" | Communication channel |
| **Website** | URL | Cinema website | "https://cinemax.vn" | Online presence/booking link |
| **Latitude** | Decimal | Map coordinate (North-South) | 10.8231 | GPS positioning for maps |
| **Longitude** | Decimal | Map coordinate (East-West) | 106.7011 | GPS positioning for maps |
| **Description** | Long Text | Detailed cinema information | "Modern 10-screen cinema with IMAX..." | Customer-facing information |
| **Amenities** | List | Extra features available | ["WiFi", "Parking", "Food Court"] | Customer convenience indicators |
| **Facilities** | Object | Detailed facility info | {WiFi: "Free", Parking: "Paid"} | Specific facility descriptions |
| **Operating Hours** | Time Range | Business hours | "9:00 - 24:00" or by day | When cinema is open |
| **Images** | URLs | Visual media | [poster_url, gallery_urls] | Marketing and customer preview |
| **Virtual Tour** | URL | 360° tour link | "https://tours.com/cinema123" | Interactive facility preview |
| **Social Media** | Links | Social platforms | {Facebook: url, Instagram: url} | Social media promotion |
| **Timezone** | Dropdown | Local timezone | "Asia/Ho_Chi_Minh" | Time calculation for events |

### Related Data:
- **Halls Count**: Auto-calculated number of screening halls in this cinema
- **Hall Types**: Links to Hall management for this cinema

---

## 🎬 2. Movies Management

**Purpose**: Maintain movie catalog with metadata, cast, genres, and release information.

### Main Fields:

| Field | Type | Purpose | Example | Business Meaning |
|-------|------|---------|---------|-----------------|
| **Title** | Text | Movie name in local language | "Crazy Rich Asians" | Official movie title |
| **Original Title** | Text | Movie name in original language | "Crazy Rich Asians" | International reference |
| **Overview** | Long Text | Plot synopsis | "A young woman meets her boyfriend's wealthy family..." | Customer attraction/description |
| **Poster URL** | Image URL | Vertical promotional image | "https://cdn.../poster.jpg" | Marketing & UI display |
| **Backdrop URL** | Image URL | Horizontal banner image | "https://cdn.../backdrop.jpg" | Cinema lobby/website banner |
| **Trailer URL** | Video URL | YouTube/video link | "https://youtube.com/watch?v=..." | Movie preview for customers |
| **Runtime** | Number (minutes) | Movie duration | 120 | Scheduling and session planning |
| **Release Date** | Date | Official release date | "2023-08-15" | Theatrical release tracking |
| **Age Rating** | Dropdown | Content rating system | "T13" (Vietnamese ratings) | Audience restriction: P/K/T13/T16/T18/C |
| **Original Language** | Dropdown | Movie's original language | "en" (English) | Audio availability |
| **Spoken Languages** | Multi-select | Available audio tracks | ["en", "vi"] | Dubbed/original options |
| **Language Type** | Dropdown | Show type preference | "SUBTITLE" | How movie is presented (Original/Subtitle/Dubbed) |
| **Production Country** | Dropdown | Country of origin | "US" | Source market identification |
| **Director** | Text | Director name | "Jon M. Chu" | Creative credit |
| **Cast** | Array | Actor list | [{name: "Constance Wu", role: "Rachel"}, ...] | Entertainment appeal |
| **Genres** | Multi-select | Movie categories | ["Comedy", "Drama", "Romance"] | Content classification |

### Related Operations:
- **Add Release**: Create theatrical release in specific cinemas
- **Batch Showtimes**: Generate multiple showtimes for releases
- **Reviews**: Manage customer reviews and ratings

---

## 🎪 3. Halls Management

**Purpose**: Configure cinema auditoriums with seat layouts, equipment, and features.

### Main Fields:

| Field | Type | Purpose | Example | Business Meaning |
|-------|------|---------|---------|-----------------|
| **Cinema** | Dropdown | Parent cinema location | "CGV Tân Bình" | Which cinema this hall belongs to |
| **Name** | Text | Hall identifier | "Hall 1" or "IMAX" | Internal reference for staff |
| **Hall Type** | Dropdown | Category of hall | "IMAX", "STANDARD", "PREMIUM" | Audience market segment |
| **Screen Type** | Dropdown | Screen specification | "70mm", "Regular", "3D" | Technical capability |
| **Sound System** | Dropdown | Audio equipment | "Dolby Atmos", "7.1 Surround" | Audio quality level |
| **Features** | Multi-select | Special amenities | ["Wheelchair Access", "Recliners", "Kids Zone"] | Accessibility & comfort |
| **Layout Type** | Dropdown | Seat arrangement pattern | "STANDARD", "STADIUM", "VMAX" | Physical setup type |

### Related Data:
- **Seat Count**: Total number of seats (calculated from layout)
- **Seat Types**: Standard, VIP, Couple, Premium, Wheelchair
- **Ticket Pricing**: Price per seat type and day type

---

## 🎫 4. Showtimes Management

**Purpose**: Create and schedule individual movie showings across halls.

### Main Fields:

| Field | Type | Purpose | Example | Business Meaning |
|-------|------|---------|---------|-----------------|
| **Movie** | Dropdown | Which movie to show | "Crazy Rich Asians" | Content selection |
| **Cinema** | Dropdown | Which cinema location | "CGV Tân Bình" | Geographic selection |
| **Hall** | Dropdown | Which auditorium | "Hall 3" | Specific screen assignment |
| **Date** | Calendar | Show date | "2024-01-15" | Scheduling date |
| **Start Time** | Time | Show begins at | "19:30" | Customer arrival planning |
| **End Time** | Time (auto) | Show ends | "21:35" | Calculated from runtime |
| **Format** | Dropdown | Technical format | "2D", "3D", "IMAX" | Special presentation type |
| **Language** | Dropdown | Audio language | "VIETNAMESE" | Dubbed/original version |
| **Subtitles** | Multi-select | Subtitle options | ["VIETNAMESE", "ENGLISH"] | Language support |
| **Status** | Dropdown | Booking state | "SELLING" / "STOPPED" / "CANCELLED" | Sales availability |

### Statuses:
- **SELLING**: Bookings open, customers can buy tickets
- **STOPPED**: Temporary pause, no new bookings
- **CANCELLED**: Show cancelled, refunds issued

### Related Operations:
- **Date Filter**: View showtimes for specific dates
- **Cinema Filter**: Filter by location
- **Movie Filter**: Filter by title
- **Batch Create**: Generate multiple showtimes at once

---

## 🎞️ 5. Movie Releases Management

**Purpose**: Configure movie releases in specific cinemas with dates and showtimes.

### Main Fields:

| Field | Type | Purpose | Example | Business Meaning |
|-------|------|---------|---------|-----------------|
| **Movie** | Dropdown | Which movie to release | "Crazy Rich Asians" | Content selection |
| **Cinema** | Dropdown | Which cinema location | "CGV Tân Bình" | Release location |
| **Start Date** | Date | Release begins | "2024-01-20" | First day of showings |
| **End Date** | Date | Release ends | "2024-02-15" | Last day of showings |
| **Status** | Auto | Release state | "ACTIVE", "UPCOMING", "ENDED" | Temporal status |

### Release Status Calculation:
- **UPCOMING**: Current date before start date
- **ACTIVE**: Current date between start and end
- **ENDED**: Current date after end date

### Related Operations:
- **Add Showtime**: Create individual showtimes for this release
- **View Showtimes**: All showtimes under this release
- **Delete Release**: Remove entire release

---

## 📋 6. Batch Showtimes (Advanced Scheduling)

**Purpose**: Create multiple showtimes at once for efficient bulk scheduling.

### Main Fields:

| Field | Type | Purpose | Example | Business Meaning |
|-------|------|---------|---------|-----------------|
| **Movie** | Dropdown | Which movie to schedule | "Crazy Rich Asians" | Content selection |
| **Movie Release** | Dropdown | Specific release package | "CGV Tân Bình 20-Jan Release" | Linked release |
| **Cinema** | Dropdown | Which cinema | "CGV Tân Bình" | Location |
| **Hall** | Dropdown | Auditorium | "Hall 3" | Specific screen |
| **Start Date** | Date | First showtime date | "2024-01-20" | Schedule begins |
| **End Date** | Date | Last showtime date | "2024-02-15" | Schedule ends |
| **Time Slots** | Multi-select | Show times to create | ["14:00", "17:00", "20:00"] | Daily showing times |
| **Repeat Type** | Dropdown | Recurrence pattern | "DAILY" / "WEEKLY" / "CUSTOM_WEEKDAYS" | Frequency rule |
| **Weekdays** | Checkbox | Days to repeat on | [Mon, Tue, Wed, ...] | For WEEKLY/CUSTOM schedules |
| **Format** | Dropdown | Technical format | "2D", "3D" | Presentation type |
| **Language** | Dropdown | Audio track | "VIETNAMESE" | Sound version |
| **Subtitles** | Multi-select | Available subtitles | ["VIETNAMESE"] | Language support |

### Repeat Patterns:
- **DAILY**: Create showtime every day in range
- **WEEKLY**: Create showtime weekly on selected days
- **CUSTOM_WEEKDAYS**: Create on specific weekdays only

### Result Summary:
- **Created Count**: Number of successfully created showtimes
- **Skipped Count**: Number of conflicts/duplicates skipped
- **History**: Log of past batch operations

---

## 👥 7. Staff Management

**Purpose**: Manage cinema employees with roles, schedules, and employment details.

### Main Fields:

| Field | Type | Purpose | Example | Business Meaning |
|-------|------|---------|---------|-----------------|
| **Cinema** | Dropdown | Assigned cinema | "CGV Tân Bình" | Work location |
| **Full Name** | Text | Employee name | "Nguyễn Văn A" | Identity |
| **Email** | Email | Work email | "a.nguyen@cinemax.vn" | Communication & login |
| **Phone** | Phone | Contact number | "+84-123-456-7890" | Scheduling contact |
| **Gender** | Dropdown | Biological sex | "Male" / "Female" | HR demographics |
| **Date of Birth** | Date | Birth date | "1995-05-15" | Age/HR records |
| **Position** | Dropdown | Job role | "Ticket Clerk", "Manager", "Usher", "Projectionist", "Cleaner", "Security" | Responsibility level |
| **Status** | Dropdown | Employment state | "ACTIVE", "INACTIVE", "ON_LEAVE" | Current availability |
| **Work Type** | Dropdown | Employment contract | "FULL_TIME", "PART_TIME", "CONTRACT" | Hours/benefits eligibility |
| **Shift Type** | Dropdown | Work schedule | "MORNING" (6-14h), "AFTERNOON" (14-22h), "NIGHT" (22-6h) | Daily work period |
| **Salary** | Currency | Monthly pay | 8,000,000 VND | Compensation |
| **Hire Date** | Date | Start date | "2023-01-15" | Employment duration |

### Position Types:
- **CINEMA_MANAGER**: Overall cinema operations
- **ASSISTANT_MANAGER**: Support management
- **TICKET_CLERK**: Ticketing counter
- **CONCESSION_STAFF**: Snacks/drinks counter
- **USHER**: Customer seating/assistance
- **PROJECTIONIST**: Film equipment operation
- **CLEANER**: Facility maintenance
- **SECURITY**: Crowd/safety management

---

## 🏷️ 8. Genres Management

**Purpose**: Maintain movie category list for filtering and classification.

### Main Fields:

| Field | Type | Purpose | Example | Business Meaning |
|-------|------|---------|---------|-----------------|
| **Name** | Text | Genre category | "Comedy", "Action", "Drama" | Movie classification |

### Simple CRUD Operations:
- Movies link to multiple genres
- Used for movie filtering and recommendations
- Example genres: Comedy, Action, Drama, Thriller, Romance, Horror, Sci-Fi, Animation, Adventure, Crime

---

## 💬 9. Reviews Management

**Purpose**: Monitor and manage customer movie reviews and ratings.

### Main Fields:

| Field | Type | Purpose | Example | Business Meaning |
|-------|------|---------|---------|---------|
| **Movie** | Dropdown | Which movie | "Crazy Rich Asians" | Content being reviewed |
| **Rating** | Number | Star rating | 4 (out of 5) | Quality score |
| **Review Text** | Long Text | Customer comment | "Amazing movie! Loved the cast..." | Detailed feedback |
| **Reviewer** | Text | Customer name | "John Doe" | Author attribution |
| **Review Date** | Date | When posted | "2024-01-25" | Temporal tracking |

### Statistics Displayed:
- **Total Reviews**: Count of all reviews
- **Average Rating**: Mean rating across all reviews
- **Rating Distribution**: 1-star to 5-star breakdown with percentage
- **Filter by Movie**: View reviews for specific movie
- **Filter by Rating**: View only certain star ratings

### Admin Operations:
- **Delete Review**: Remove inappropriate reviews
- **Cannot Edit**: Preserve authenticity of customer feedback

---

## 💵 10. Ticket Pricing Management

**Purpose**: Define prices for different seat types and day categories.

### Main Fields:

| Field | Type | Purpose | Example | Business Meaning |
|-------|------|---------|---------|-----------------|
| **Cinema** | Dropdown | Cinema location | "CGV Tân Bình" | Pricing jurisdiction |
| **Hall** | Dropdown | Specific auditorium | "Hall 3" | Hall-specific rates |
| **Seat Type** | Category | Seat classification | "VIP" 👑, "COUPLE" 💑, "PREMIUM" ⭐, "STANDARD" 🪑, "WHEELCHAIR" ♿ | Comfort/accessibility tier |
| **Day Type** | Category | Time category | "WEEKDAY" 📅, "WEEKEND" 🎉, "HOLIDAY" ✨ | Demand-based pricing |
| **Price** | Currency | Cost in VND | 120,000 | Customer payment amount |

### Pricing Matrix:
Prices vary by combination of:
- **Seat Type**: Different comfort levels
  - Standard: Regular seats
  - Premium: Better quality/position
  - VIP: Luxury recliners/special seating
  - Couple: Double-wide romantic seats
  - Wheelchair: Accessible seating
- **Day Type**: Demand-based
  - Weekday (Mon-Fri): Lower prices
  - Weekend (Sat-Sun): Higher prices
  - Holiday: Premium prices

### Example Matrix:
```
Hall 3 - WEEKDAY:
  Standard: 90,000 VND
  Premium: 110,000 VND
  VIP: 150,000 VND
  Couple: 280,000 VND
  
Hall 3 - WEEKEND:
  Standard: 120,000 VND
  Premium: 140,000 VND
  VIP: 180,000 VND
  Couple: 320,000 VND
```

---

## 📊 11. Reservations Management

**Purpose**: Monitor and manage customer seat bookings and payment status.

### Main Fields:

| Field | Type | Purpose | Example | Business Meaning |
|-------|------|---------|---------|-----------------|
| **Booking ID** | Text | Unique identifier | "BK-2024-001234" | Transaction reference |
| **Customer** | Text | Booker name | "Nguyễn Văn B" | Payer identification |
| **Movie** | Text | Booked movie | "Crazy Rich Asians" | Content being bought |
| **Cinema** | Dropdown | Location | "CGV Tân Bình" | Filter by cinema |
| **Hall** | Text | Auditorium | "Hall 3" | Specific venue |
| **Showtime** | DateTime | Session details | "2024-01-25 19:30" | When movie plays |
| **Seat Numbers** | List | Reserved seats | ["A1", "A2", "B1"] | Specific seating |
| **Booking Status** | Dropdown | Order state | "PENDING" / "CONFIRMED" / "CANCELLED" / "EXPIRED" | Current status |
| **Payment Status** | Dropdown | Payment state | "UNPAID" / "PAID" / "REFUNDED" | Money received |
| **Total Price** | Currency | Amount charged | 360,000 VND | Revenue amount |
| **Booking Date** | Date | When booked | "2024-01-20" | Transaction timestamp |
| **Payment Deadline** | Date | When to pay | "2024-01-25 17:30" | Payment cutoff |

### Booking Status Meanings:
- **PENDING**: Awaiting customer confirmation/payment
- **CONFIRMED**: Payment received, booking locked
- **CANCELLED**: Customer cancelled, refund issued
- **EXPIRED**: Payment deadline passed, auto-cancelled

### Payment Status:
- **UNPAID**: Invoice generated, awaiting payment
- **PAID**: Payment received
- **REFUNDED**: Booking cancelled, money returned

### Admin Actions:
- **View Details**: Full booking info including seats
- **Update Status**: Change booking state (cancel, confirm)
- **Confirm Booking**: Manually validate pending bookings
- **Date Range Filter**: By booking date
- **Cinema Filter**: View by location
- **Status Filter**: View by booking/payment status

---

## 🎞️ 12. Seat Status Management

**Purpose**: Track real-time seat availability for bookings.

### Display Information:

| Status | Color | Meaning |
|--------|-------|---------|
| **Available** | Green | Can be booked |
| **Reserved** | Blue | Currently in booking process |
| **Sold** | Red | Already purchased |
| **Broken** | Gray | Unavailable equipment |
| **Disabled** | Gray | Inaccessible |

### Seat Information Shown:
- Seat number (e.g., A1, A2)
- Seat type (Standard, VIP, Couple, etc.)
- Current status
- Booking ID (if sold)
- Price per seat type

---

## ⚙️ 13. Settings

**Purpose**: Configure system-wide preferences and policies.

### Potential Configuration Areas:
- Payment gateway settings
- Email notification templates
- Booking timeout duration
- Refund policies
- Commission rates
- API keys
- Multi-language setup
- Currency/locale settings

---

## 📈 14. Reports

**Purpose**: Generate business analytics and insights.

### Typical Report Types:
- **Sales Reports**: Revenue by cinema, hall, date range
- **Occupancy Reports**: Hall/showtime utilization
- **Popular Movies**: Top-performing films
- **Customer Analytics**: Demographics, repeat bookings
- **Staff Performance**: Sales per staff member
- **Financial Reports**: Revenue, expenses, profit
- **Capacity Planning**: Seat/hall availability trends

---

## Business Flow Relationships

```
CINEMAS
  ├── HALLS (screening rooms)
  │   ├── SHOWTIMES (individual shows)
  │   │   ├── RESERVATIONS (seat bookings)
  │   │   ├── SEAT_STATUS (real-time availability)
  │   │   └── TICKET_PRICING (pricing rules)
  │   └── FACILITIES (amenities)
  │
MOVIES
  ├── GENRES (categories)
  ├── REVIEWS (customer ratings)
  ├── RELEASES (cinema distribution)
  │   └── SHOWTIMES (via movie + cinema)
  └── CAST (actors)
  │
STAFF (per cinema)
  ├── POSITIONS (roles)
  ├── WORK_TYPE (employment type)
  └── SHIFTS (schedules)
  │
BATCH_SHOWTIMES (bulk scheduling tool)
  └── Creates multiple showtimes efficiently
```

---

## Key Business Metrics Tracked

1. **Cinema Operations**
   - Operating hours, facilities, location
   - Hall capacity and features
   - Staff allocation

2. **Content**
   - Movie metadata and marketing materials
   - Release scheduling and dates
   - Genre categorization

3. **Revenue Generation**
   - Showtime creation and scheduling
   - Seat availability management
   - Dynamic pricing by seat/day type

4. **Customer Experience**
   - Booking status tracking
   - Review ratings and feedback
   - Seat selection options

5. **Finance**
   - Ticket pricing rules
   - Payment tracking
   - Refund management

---

## Field Validation Rules (Common)

- **Required Fields**: Name, Email, Phone, Date, Price
- **Email Format**: Must be valid email
- **Phone Format**: Must be valid phone number
- **Dates**: Start date ≤ End date
- **Prices**: Must be > 0
- **Time Ranges**: Start time < End time
- **Unique Constraints**: Cinema names, Email, Hall names per cinema, Genre names

---

Last Updated: December 24, 2025
