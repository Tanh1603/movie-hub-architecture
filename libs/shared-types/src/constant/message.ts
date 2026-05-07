export const UserMessage = {
  GET_PERMISSIONS: 'user.getPermissions',
  GET_USERS: 'user.getAll',
  GET_USER_DETAIL: 'user.getDetail',
  STAFF: {
    GET_LIST: 'staff.list',
    CREATED: 'staff.created',
    UPDATED: 'staff.updated',
    GET_DETAIL: 'staff.detail',
    DELETED: 'staff.deleted',
    FIND_BY_EMAIL: 'staff.findByEmail',
  },
  CONFIG: {
    GET_LIST: 'config.list',
    UPDATED: 'config.updated',
  },
};

export const MovieServiceMessage = {
  MOVIE: {
    GET_LIST: 'movie.list',
    CREATED: 'movie.created',
    UPDATED: 'movie.updated',
    GET_DETAIL: 'movie.detail',
    DELETED: 'movie.deleted',
    GET_LIST_RELEASE: 'movie.release.list',
    GET_LIST_BY_ID: 'movie.list.by-id',
    CREATED_REVIEW: 'movie.review.created',
    UPDATED_REVIEW: 'movie.review.updated',
    GET_REVIEWS: 'movie.review.list',
  },
  MOVIE_RELEASE: {
    CREATED: 'movie.release.created',
    UPDATED: 'movie.release.updated',
    DELETED: 'movie.release.deleted',
  },
  GENRE: {
    GET_LIST: 'genre.list',
    GET_DETAIL: 'genre.detail',
    CREATED: 'genre.created',
    UPDATED: 'genre.updated',
    DELETED: 'genre.deleted',
  },
  REVIEW: {
    GET_LIST: 'review.list',
    DELETED: 'review.deleted',
  },
};

export const CinemaMessage = {
  GET_CINEMAS: 'cinema.getAll',
  MOVIE: {
    GET_MOVIES_BY_CINEMA: 'cinema.movies_by_cinema',
    GET_ALL_MOVIES_AT_CINEMAS: 'cinema.all_movies_at_cinemas',
  },
  CINEMA: {
    CREATE: 'cinema.create',
    UPDATE: 'cinema.update',
    DELETE: 'cinema.delete',
    GET_SHOWTIME: 'cinema.showtime',
    ADMIN_GET_SHOWTIME: 'cinema.admin_showtime',
  },
  HALL: {
    GET_DETAIL: 'hall.get_detail',
    GET_BY_CINEMA: 'hall.get_by_cinema',
    GET_HALL_CAPACITIES: 'cinema.getHallCapacities',
    CREATE: 'hall.create',
    UPDATE: 'hall.update',
    DELETE: 'hall.delete',
    UPDATE_SEAT_STATUS: 'cinema.update_seat_status',
  },
  SHOWTIME: {
    FILTER_SHOWTIME: 'showtime.filter',
    CREATE_SHOWTIME: 'showtime.create_showtime',
    BATCH_CREATE_SHOWTIMES: 'showtime.batch_create_showtimes',
    UPDATE_SHOWTIME: 'showtime.update_showtime',
    DELETE_SHOWTIME: 'showtime.delete_showtime',
    GET_SHOWTIME: 'showtime.get_showtime',
    GET_SHOWTIME_SEATS: 'showtime.get_showtime_seats',
    GET_SEATS_HELD_BY_USER: 'showtime.get_seats_held_by_user',
    GET_SESSION_TTL: 'showtime.get_session_ttl',
    GET_SHOWTIMES_BY_IDS: 'showtime.get_showtimes_by_ids',
    // Event-based seat release (for refunds)
    RELEASE_SEATS: 'showtime.release_seats',
  },
  TICKET_PRICING: {
    GET_PRICING_FOR_HALL: 'ticket_pricing.get_pricing_for_hall',
    UPDATE_PRICING_OF_TICKET: 'ticket_pricing.update_ticket_pricing',
  },
  GET_CINEMAS_NEARBY: 'CINEMA.GET_CINEMAS_NEARBY',
  GET_CINEMAS_WITH_FILTERS: 'CINEMA.GET_CINEMAS_WITH_FILTERS',
  GET_CINEMA_DETAIL: 'CINEMA.GET_CINEMA_DETAIL',
  SEARCH_CINEMAS: 'CINEMA.SEARCH_CINEMAS',
  GET_AVAILABLE_CITIES: 'CINEMA.GET_AVAILABLE_CITIES',
  GET_AVAILABLE_DISTRICTS: 'CINEMA.GET_AVAILABLE_DISTRICTS',
};

export const BookingMessage = {
  CREATE: 'booking.create',
  FIND_ALL: 'booking.findAll',
  FIND_ONE: 'booking.findOne',
  CANCEL: 'booking.cancel',
  GET_SUMMARY: 'booking.getSummary',
  FIND_USER_BOOKING_BY_SHOWTIME: 'booking.findUserBookingByShowtime',
  // Booking actions
  UPDATE: 'booking.update',
  RESCHEDULE: 'booking.reschedule',
  CALCULATE_REFUND: 'booking.calculateRefund',
  CANCEL_WITH_REFUND: 'booking.cancelWithRefund',
  GET_CANCELLATION_POLICY: 'booking.getCancellationPolicy',
  // Admin operations
  ADMIN_FIND_ALL: 'booking.admin.findAll',
  FIND_BY_SHOWTIME: 'booking.findByShowtime',
  FIND_BY_CINEMA: 'booking.findByCinema',
  FIND_BY_DATE_RANGE: 'booking.findByDateRange',
  UPDATE_STATUS: 'booking.updateStatus',
  CONFIRM: 'booking.confirm',
  COMPLETE: 'booking.complete',
  EXPIRE: 'booking.expire',
  // Statistics
  GET_STATISTICS: 'booking.getStatistics',
  GET_REVENUE_REPORT: 'booking.getRevenueReport',
  GET_REVENUE_BY_MOVIE: 'booking.getRevenueByMovieId',
  GET_REVENUE_BY_CINEMA: 'booking.getRevenueByCinemaId',
};

export const ConcessionMessage = {
  FIND_ALL: 'concession.findAll',
  FIND_ONE: 'concession.findOne',
  CREATE: 'concession.create',
  UPDATE: 'concession.update',
  DELETE: 'concession.delete',
  UPDATE_INVENTORY: 'concession.updateInventory',
};

export const PromotionMessage = {
  FIND_ALL: 'promotion.findAll',
  FIND_ONE: 'promotion.findOne',
  FIND_BY_CODE: 'promotion.findByCode',
  VALIDATE: 'promotion.validate',
  CREATE: 'promotion.create',
  UPDATE: 'promotion.update',
  DELETE: 'promotion.delete',
  TOGGLE_ACTIVE: 'promotion.toggleActive',
};

export const PaymentMessage = {
  CREATE: 'payment.create',
  FIND_ONE: 'payment.findOne',
  FIND_BY_BOOKING: 'payment.findByBooking',
  VNPAY_IPN: 'payment.vnpay.ipn',
  VNPAY_RETURN: 'payment.vnpay.return',
  // Admin operations
  ADMIN_FIND_ALL: 'payment.admin.findAll',
  FIND_BY_STATUS: 'payment.findByStatus',
  FIND_BY_DATE_RANGE: 'payment.findByDateRange',
  RETRY: 'payment.retry',
  CANCEL: 'payment.cancel',
  // Statistics
  GET_STATISTICS: 'payment.getStatistics',
};

export const TicketMessage = {
  FIND_ONE: 'ticket.findOne',
  FIND_BY_CODE: 'ticket.findByCode',
  VALIDATE: 'ticket.validate',
  USE: 'ticket.use',
  GENERATE_QR: 'ticket.generateQR',
  // Admin operations
  ADMIN_FIND_ALL: 'ticket.admin.findAll',
  FIND_BY_SHOWTIME: 'ticket.findByShowtime',
  FIND_BY_BOOKING: 'ticket.findByBooking',
  BULK_VALIDATE: 'ticket.bulkValidate',
  CANCEL: 'ticket.cancel',
};

export const LoyaltyMessage = {
  GET_BALANCE: 'loyalty.getBalance',
  GET_TRANSACTIONS: 'loyalty.getTransactions',
  EARN_POINTS: 'loyalty.earnPoints',
  REDEEM_POINTS: 'loyalty.redeemPoints',
};

export const RefundMessage = {
  CREATE: 'refund.create',
  FIND_ALL: 'refund.findAll',
  FIND_ONE: 'refund.findOne',
  FIND_BY_PAYMENT: 'refund.findByPayment',
  PROCESS: 'refund.process',
  APPROVE: 'refund.approve',
  REJECT: 'refund.reject',
  PROCESS_VOUCHER: 'refund.processVoucher',
};
