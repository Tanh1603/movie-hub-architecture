# Schema Entity Diagrams

## Booking Service (`apps/booking-service/prisma/schema.prisma`)

```plantuml
package "Booking Service" {

entity Bookings {
  o id: String
  o booking_code: String
  o user_id: String
  o showtime_id: String
  o status: BookingStatus
  --
  customer_name: String
  customer_email: String
  customer_phone: String?
  subtotal: Decimal
  discount: Decimal
  points_used: Int
  points_discount: Decimal
  final_amount: Decimal
  promotion_code: String?
  payment_status: PaymentStatus
  expires_at: DateTime?
  cancelled_at: DateTime?
  cancellation_reason: String?
  created_at: DateTime
  updated_at: DateTime
}

entity Tickets {
  o id: String
  o booking_id: String
  o seat_id: String
  o ticket_code: String
  --
  qr_code: String?
  barcode: String?
  ticket_type: String
  price: Decimal
  status: TicketStatus
  used_at: DateTime?
  created_at: DateTime
}

entity Payments {
  o id: String
  o booking_id: String
  o status: PaymentStatus
  o transaction_id: String?
  o provider_transaction_id: String?
  --
  amount: Decimal
  payment_method: PaymentMethod
  payment_url: String?
  paid_at: DateTime?
  metadata: Json?
  created_at: DateTime
  updated_at: DateTime
}

entity Refunds {
  o id: String
  o payment_id: String
  --
  amount: Decimal
  reason: String
  status: RefundStatus
  refunded_at: DateTime?
  created_at: DateTime
}

entity Concessions {
  o id: String
  o category: ConcessionCategory
  o available: Boolean
  o cinema_id: String?
  --
  name: String
  name_en: String?
  description: String?
  price: Decimal
  image_url: String?
  inventory: Int?
  nutrition_info: Json?
  allergens: String[]
  created_at: DateTime
  updated_at: DateTime
}

entity BookingConcessions {
  o id: String
  o booking_id: String
  o concession_id: String
  --
  quantity: Int
  unit_price: Decimal
  total_price: Decimal
  created_at: DateTime
}

entity Promotions {
  o id: String
  o code: String
  o active: Boolean
  --
  name: String
  description: String?
  type: PromotionType
  value: Decimal
  min_purchase: Decimal?
  max_discount: Decimal?
  valid_from: DateTime
  valid_to: DateTime
  usage_limit: Int?
  usage_per_user: Int?
  current_usage: Int
  applicable_for: String[]
  conditions: Json?
  created_at: DateTime
  updated_at: DateTime
}

entity LoyaltyAccounts {
  o id: String
  o user_id: String
  --
  current_points: Int
  tier: LoyaltyTier
  total_spent: Decimal
  created_at: DateTime
  updated_at: DateTime
}

entity LoyaltyTransactions {
  o id: String
  o loyalty_account_id: String
  o type: LoyaltyTransactionType
  o transaction_id: String?
  --
  points: Int
  description: String?
  expires_at: DateTime?
  created_at: DateTime
}

}
```

## User Service (`apps/user-service/prisma/schema.prisma`)

```plantuml
package "User Service" {

entity Role {
  o id: String
  o name: String
}

entity Permission {
  o id: String
  o name: String
}

entity UserRole {
  o id: String
  o userId: String
  o roleId: String
}

entity RolePermission {
  o id: String
  o roleId: String
  o permissionId: String
}

entity Staff {
  o id: String
  o cinemaId: String
  o email: String
  --
  fullName: String
  phone: String
  gender: Gender
  dob: DateTime
  position: StaffPosition
  status: StaffStatus
  workType: WorkType
  shiftType: ShiftType
  salary: Decimal
  hireDate: DateTime
  createdAt: DateTime
  updatedAt: DateTime
}

entity Setting {
  o key: String
  --
  value: Json
  description: String?
}

}
```

## Cinema Service (`apps/cinema-service/prisma/schema.prisma`)

```plantuml
package "Cinema Service" {

entity Cinemas {
  o id: String
  --
  name: String
  address: String
  city: String
  district: String?
  phone: String?
  email: String?
  website: String?
  latitude: Decimal?
  longitude: Decimal?
  description: String?
  amenities: String[]
  facilities: Json?
  images: String[]
  virtual_tour_360_url: String?
  rating: Decimal?
  total_reviews: Int
  operating_hours: Json?
  social_media: Json?
  status: CinemaStatus
  timezone: String
  created_at: DateTime
  updated_at: DateTime
}

entity Halls {
  o id: String
  o cinema_id: String
  --
  name: String
  type: HallType
  capacity: Int
  rows: Int
  screen_type: String?
  sound_system: String?
  features: String[]
  status: HallStatus
  created_at: DateTime
  updated_at: DateTime
  layout_type: LayoutType
}

entity Seats {
  o id: String
  o hall_id: String
  o row_letter: String
  o seat_number: Int
  --
  type: SeatType
  status: SeatStatus
  created_at: DateTime
}

entity TicketPricing {
  o id: String
  o hall_id: String
  o seat_type: SeatType
  o day_type: DayType
  --
  price: Decimal
  created_at: DateTime
}

entity Showtimes {
  o id: String
  o movie_id: String
  o cinema_id: String
  o hall_id: String
  o movie_release_id: String
  --
  start_time: DateTime
  end_time: DateTime
  format: Format
  language: String
  subtitles: String[]
  available_seats: Int
  total_seats: Int
  status: ShowtimeStatus
  created_at: DateTime
  updated_at: DateTime
  day_type: DayType
}

entity SeatReservations {
  o id: String
  o showtime_id: String
  o seat_id: String
  o user_id: String?
  o booking_id: String?
  --
  status: ReservationStatus
  created_at: DateTime
}

entity CinemaReviews {
  o id: String
  o cinema_id: String
  o user_id: String
  --
  rating: Int
  comment: String?
  aspects: Json?
  verified_visit: Boolean
  status: ReviewStatus
  created_at: DateTime
  updated_at: DateTime
}

}
```

## Movie Service (`apps/movie-service/prisma/schema.prisma`)

```plantuml
package "Movie Service" {

entity Movie {
  o id: String
  --
  title: String
  originalTitle: String
  overview: String
  posterUrl: String
  trailerUrl: String
  backdropUrl: String
  runtime: Int
  releaseDate: DateTime
  ageRating: AgeRating
  originalLanguage: String
  spokenLanguages: String[]
  productionCountry: String
  languageType: LanguageOption
  director: String
  cast: Json
  createdAt: DateTime
  updatedAt: DateTime
}

entity MovieRelease {
  o id: String
  o movieId: String
  --
  startDate: DateTime
  endDate: DateTime?
  note: String?
}

entity Genre {
  o id: String
  --
  name: String
}

entity MovieGenre {
  o movieId: String
  o genreId: String
  --
  createdAt: DateTime
  updatedAt: DateTime
}

entity Review {
  o id: String
  o movieId: String
  o userId: String
  --
  rating: Int
  content: String
  createdAt: DateTime
  updatedAt: DateTime
}

}
```
