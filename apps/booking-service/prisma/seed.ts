import { createHash } from 'crypto';
import {
  PrismaClient,
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
  TicketStatus,
  ConcessionCategory,
  PromotionType,
  LoyaltyTier,
  LoyaltyTransactionType,
  RefundStatus,
} from '../generated/prisma';

const prisma = new PrismaClient();

const toUuid = (seed: string) => {
  const h = createHash('md5').update(seed).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(
    16,
    20
  )}-${h.slice(20, 32)}`;
};

const refs = {
  showtime: toUuid(
    'bbbb1111-0000-0000-0000-000000000001-2025-12-30-18:30-11111111-1111-1111-1111-111111111111'
  ),
  seatA1: toUuid('seat-bbbb1111-0000-0000-0000-000000000001-A-1'),
  seatA2: toUuid('seat-bbbb1111-0000-0000-0000-000000000001-A-2'),
  seatB1: toUuid('seat-bbbb1111-0000-0000-0000-000000000002-B-1'),
  booking1: toUuid('booking-dune2-1'),
  booking2: toUuid('booking-insideout2-1'),
  users: {
    admin: 'user-admin-001',
    customer1: 'user-customer-001',
    customer2: 'user-customer-002',
  },
};

async function main() {
  console.log('🌱 Seeding Booking Service database...');

  await prisma.loyaltyTransactions.deleteMany();
  await prisma.loyaltyAccounts.deleteMany();
  await prisma.refunds.deleteMany();
  await prisma.payments.deleteMany();
  await prisma.tickets.deleteMany();
  await prisma.bookingConcessions.deleteMany();
  await prisma.bookings.deleteMany();
  await prisma.promotions.deleteMany();
  await prisma.concessions.deleteMany();

  const concessions = [
    {
      name: 'Bắp rang bơ lớn',
      name_en: 'Large Popcorn',
      description: 'Bắp rang bơ thơm, size lớn',
      category: ConcessionCategory.FOOD,
      price: 60000,
      image_url:
        'https://image.tmdb.org/t/p/w500/5xoQ94rRB4dq2YCPo11PLff0Eno.jpg',
      available: true,
      inventory: 120,
      allergens: ['Butter', 'Corn'],
    },
    {
      name: 'Coca Cola lớn',
      name_en: 'Large Coca Cola',
      description: 'Nước ngọt Coca Cola ly lớn',
      category: ConcessionCategory.DRINK,
      price: 40000,
      image_url:
        'https://image.tmdb.org/t/p/w500/egWLRPbiEM5Qn2ATqNn7qY5T2bQ.jpg',
      available: true,
      inventory: 200,
      allergens: [],
    },
    {
      name: 'Combo Couple',
      name_en: 'Couple Combo',
      description: '2 bắp lớn + 2 nước lớn',
      category: ConcessionCategory.COMBO,
      price: 150000,
      image_url:
        'https://image.tmdb.org/t/p/w500/6w5TTI9fyYQntKR3HjU28WSLhdC.jpg',
      available: true,
      inventory: 80,
      allergens: ['Butter', 'Corn'],
    },
  ];

  await prisma.concessions.createMany({ data: concessions });

  const now = new Date('2025-12-20T00:00:00+07:00');
  const oneMonthLater = new Date('2027-01-20T00:00:00+07:00');

  const promotions = [
    {
      code: 'TET2026',
      name: 'Ưu đãi Tết 2026',
      description: 'Giảm 15% cho đơn vé từ 200.000đ',
      type: PromotionType.PERCENTAGE,
      value: 15,
      min_purchase: 200000,
      max_discount: 70000,
      valid_from: now,
      valid_to: oneMonthLater,
      usage_limit: 1000,
      usage_per_user: 2,
      current_usage: 0,
      applicable_for: ['tickets'],
      active: true,
    },
    {
      code: 'COMBO50K',
      name: 'Giảm combo 50K',
      description: 'Giảm 50.000đ cho combo Couple',
      type: PromotionType.FIXED_AMOUNT,
      value: 50000,
      min_purchase: 120000,
      max_discount: 50000,
      valid_from: now,
      valid_to: oneMonthLater,
      usage_limit: 300,
      usage_per_user: 3,
      current_usage: 0,
      applicable_for: ['concessions'],
      active: true,
    },
  ];

  await prisma.promotions.createMany({ data: promotions });

  const loyaltyAccounts = [
    {
      user_id: refs.users.customer1,
      current_points: 1500,
      tier: LoyaltyTier.SILVER,
      total_spent: 3200000,
    },
    {
      user_id: refs.users.customer2,
      current_points: 600,
      tier: LoyaltyTier.BRONZE,
      total_spent: 1200000,
    },
  ];

  for (const account of loyaltyAccounts) {
    const created = await prisma.loyaltyAccounts.create({ data: account });
    await prisma.loyaltyTransactions.createMany({
      data: [
        {
          loyalty_account_id: created.id,
          points: 300,
          type: LoyaltyTransactionType.EARN,
          description: 'Thưởng đặt vé',
        },
        {
          loyalty_account_id: created.id,
          points: -100,
          type: LoyaltyTransactionType.REDEEM,
          description: 'Dùng điểm giảm giá',
        },
      ],
    });
  }

  const bookings = [
    {
      id: refs.booking1,
      booking_code: 'BK-20251230-IMAX-01',
      user_id: refs.users.customer1,
      showtime_id: refs.showtime,
      customer_name: 'Nguyễn Văn An',
      customer_email: 'an.nguyen@example.com',
      customer_phone: '0901234567',
      subtotal: 320000,
      discount: 48000,
      points_used: 300,
      points_discount: 30000,
      final_amount: 242000,
      promotion_code: 'TET2026',
      status: BookingStatus.CONFIRMED,
      payment_status: PaymentStatus.COMPLETED,
    },
    {
      id: refs.booking2,
      booking_code: 'BK-20251231-STD-02',
      user_id: refs.users.customer2,
      showtime_id: toUuid(
        'bbbb1111-0000-0000-0000-000000000002-2025-12-31-21:15-22222222-2222-2222-2222-222222222222'
      ),
      customer_name: 'Trần Thị Bình',
      customer_email: 'binh.tran@example.com',
      customer_phone: '0938123456',
      subtotal: 180000,
      discount: 0,
      points_used: 0,
      points_discount: 0,
      final_amount: 180000,
      status: BookingStatus.REFUNDED, // Changed to REFUNDED to test exclusion
      payment_status: PaymentStatus.REFUNDED,
      cancelled_at: new Date(),
      cancellation_reason: 'User requested refund',
    },
    {
      id: toUuid('booking-completed-3'),
      booking_code: 'BK-20251231-COMP-03',
      user_id: refs.users.customer1,
      showtime_id: refs.showtime,
      customer_name: 'Nguyễn Văn An',
      customer_email: 'an.nguyen@example.com',
      customer_phone: '0901234567',
      subtotal: 150000,
      discount: 0,
      points_used: 0,
      points_discount: 0,
      final_amount: 150000,
      status: BookingStatus.COMPLETED, // Added COMPLETED to test inclusion
      payment_status: PaymentStatus.COMPLETED,
    },
  ];

  await prisma.bookings.createMany({ data: bookings });

  await prisma.bookingConcessions.createMany({
    data: [
      {
        booking_id: refs.booking1,
        concession_id: (await prisma.concessions.findFirst({
          where: { name: 'Combo Couple' },
        }))!.id,
        quantity: 1,
        unit_price: 150000,
        total_price: 100000,
      },
    ],
  });

  await prisma.tickets.createMany({
    data: [
      {
        booking_id: refs.booking1,
        seat_id: refs.seatA1,
        ticket_code: 'TK-IMAX-A1',
        qr_code: 'QR-IMAX-A1',
        barcode: 'BC-IMAX-A1',
        ticket_type: 'ADULT',
        price: 160000,
        status: TicketStatus.VALID,
      },
      {
        booking_id: refs.booking1,
        seat_id: refs.seatA2,
        ticket_code: 'TK-IMAX-A2',
        qr_code: 'QR-IMAX-A2',
        barcode: 'BC-IMAX-A2',
        ticket_type: 'ADULT',
        price: 160000,
        status: TicketStatus.VALID,
      },
      {
        booking_id: refs.booking2,
        seat_id: refs.seatB1,
        ticket_code: 'TK-STD-B1',
        qr_code: 'QR-STD-B1',
        barcode: 'BC-STD-B1',
        ticket_type: 'ADULT',
        price: 180000,
        status: TicketStatus.CANCELLED, // Refunded booking -> Cancelled tickets
      },
      {
        booking_id: toUuid('booking-completed-3'),
        seat_id: refs.seatA1, // Using same seat ID from diff showtime or ensuring uniqueness if needed. Reusing UUID logic for simplicity.
        ticket_code: 'TK-COMP-C1',
        qr_code: 'QR-COMP-C1',
        barcode: 'BC-COMP-C1',
        ticket_type: 'ADULT',
        price: 150000,
        status: TicketStatus.USED, // Completed booking -> Used tickets
      },
    ],
  });

  await prisma.payments.createMany({
    data: [
      {
        booking_id: refs.booking1,
        amount: 242000,
        payment_method: PaymentMethod.MOMO,
        status: PaymentStatus.COMPLETED,
        transaction_id: 'TXN-IMAX-001',
        provider_transaction_id: 'MOMO_12345678',
        paid_at: new Date('2025-12-29T10:00:00Z'),
      },
      {
        booking_id: refs.booking2,
        amount: 180000,
        payment_method: PaymentMethod.VNPAY,
        status: PaymentStatus.REFUNDED,
        transaction_id: 'TXN-STD-002',
        provider_transaction_id: 'VNPAY_987654',
      },
      {
        booking_id: toUuid('booking-completed-3'),
        amount: 150000,
        payment_method: PaymentMethod.CASH,
        status: PaymentStatus.COMPLETED,
        transaction_id: 'TXN-COMP-003',
        paid_at: new Date('2025-12-28T10:00:00Z'),
      },
    ],
  });

  await prisma.refunds.create({
    data: {
      payment_id: (await prisma.payments.findFirst({
        where: { booking_id: refs.booking2 },
      }))!.id,
      amount: 180000,
      reason: 'Khách hàng đổi suất chiếu',
      status: RefundStatus.PENDING,
    },
  });

  console.log(
    '✅ Seeded concessions, promotions, loyalty, bookings, tickets, payments, refunds, booking concessions'
  );
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
