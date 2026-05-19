import { createHash } from 'crypto';
import {
  PrismaClient,
  CinemaStatus,
  HallType,
  HallStatus,
  LayoutType,
  SeatType,
  SeatStatus,
  DayType,
  Format,
  ShowtimeStatus,
  ReservationStatus,
} from '../generated/prisma';

const prisma = new PrismaClient();

const toUuid = (seed: string) => {
  const h = createHash('md5').update(seed).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
};

const movieRefs = {
  dune2: { movieId: '11111111-1111-1111-1111-111111111111', releaseId: '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', runtime: 166 },
  insideOut2: { movieId: '22222222-2222-2222-2222-222222222222', releaseId: '22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', runtime: 100 },
  oppenheimer: { movieId: '33333333-3333-3333-3333-333333333333', releaseId: '33333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', runtime: 180 },
  gxk: { movieId: '44444444-4444-4444-4444-444444444444', releaseId: '44444444-aaaa-aaaa-aaaa-aaaaaaaaaaaa', runtime: 115 },
};

const cinemaSeed = [
  {
    id: 'aaaa1111-0000-0000-0000-000000000001',
    name: 'CGV Aeon Tân Phú',
    address: '30 Bờ Bao Tân Thắng, Sơn Kỳ',
    city: 'TP. Hồ Chí Minh',
    district: 'Tân Phú',
    phone: '028 3620 2000',
    email: 'tanphu@cgv.vn',
    website: 'https://www.cgv.vn',
    latitude: 10.8028,
    longitude: 106.6171,
    description: 'Rạp lớn với phòng IMAX và khu premium.',
    amenities: ['Bãi đỗ xe', 'IMAX', 'Premium Lounge'],
    facilities: { parking_slots: 320, wheelchair_accessible: true },
    images: ['https://cdn.galaxycine.vn/media/2023/8/2/cgv-aeon-tan-phu-1_1690945376540.jpg'],
    rating: 4.6,
    total_reviews: 2100,
    operating_hours: { weekday: '09:00-23:00', weekend: '08:00-00:00' },
    social_media: { facebook: 'cgv.vietnam' },
    status: CinemaStatus.ACTIVE,
  },
  {
    id: 'aaaa1111-0000-0000-0000-000000000002',
    name: 'BHD Star Bitexco',
    address: '2 Hải Triều, Bến Nghé, Quận 1',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    phone: '1900 2099',
    email: 'bitexco@bhdstar.vn',
    website: 'https://www.bhdstar.vn',
    latitude: 10.7714,
    longitude: 106.7041,
    description: 'Rạp hiện đại trong toà Bitexco, vị trí trung tâm.',
    amenities: ['Bãi đỗ xe', 'Snack', 'VIP Zone'],
    facilities: { parking_slots: 120, wheelchair_accessible: true },
    images: ['https://bhdstar.vn/wp-content/uploads/2023/04/BHD-Bitexco-3-scaled.jpg'],
    rating: 4.4,
    total_reviews: 1400,
    operating_hours: { weekday: '09:00-23:00', weekend: '08:00-00:00' },
    social_media: { facebook: 'bhdstar' },
    status: CinemaStatus.ACTIVE,
  },
];

const hallSeed = [
  {
    id: 'bbbb1111-0000-0000-0000-000000000001',
    cinemaId: cinemaSeed[0].id,
    name: 'IMAX 1',
    type: HallType.IMAX,
    rows: 6,
    seatsPerRow: 12,
    layout: LayoutType.STADIUM,
    screen: 'IMAX Laser',
    sound: 'IMAX 12.1',
  },
  {
    id: 'bbbb1111-0000-0000-0000-000000000002',
    cinemaId: cinemaSeed[0].id,
    name: 'Standard 2',
    type: HallType.STANDARD,
    rows: 6,
    seatsPerRow: 10,
    layout: LayoutType.STANDARD,
    screen: '2K Digital',
    sound: 'Dolby 7.1',
  },
  {
    id: 'bbbb2222-0000-0000-0000-000000000001',
    cinemaId: cinemaSeed[1].id,
    name: 'VIP 1',
    type: HallType.VIP,
    rows: 5,
    seatsPerRow: 10,
    layout: LayoutType.DUAL_AISLE,
    screen: '4K Digital',
    sound: 'Dolby Atmos',
  },
  {
    id: 'bbbb2222-0000-0000-0000-000000000002',
    cinemaId: cinemaSeed[1].id,
    name: 'Standard 2',
    type: HallType.STANDARD,
    rows: 5,
    seatsPerRow: 10,
    layout: LayoutType.STANDARD,
    screen: '2K Digital',
    sound: 'Dolby 7.1',
  },
];

const slots = [
  { label: '18:30', hour: 18, minute: 30 },
  { label: '21:15', hour: 21, minute: 15 },
];

const today = new Date();
const bookingDateStr = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 2)).toISOString().slice(0, 10);

const bookingRef = {
  bookingId: toUuid('booking-dune2-1'),
  showtimeSeed: { date: bookingDateStr, slot: slots[0].label, hallId: hallSeed[0].id, movieId: movieRefs.dune2.movieId },
  seats: ['A-1', 'A-2'],
};

async function main() {
  console.log('🌱 Seeding Cinema Service database...');

  await prisma.seatReservations.deleteMany();
  await prisma.showtimes.deleteMany();
  await prisma.ticketPricing.deleteMany();
  await prisma.seats.deleteMany();
  await prisma.cinemaReviews.deleteMany();
  await prisma.halls.deleteMany();
  await prisma.cinemas.deleteMany();

  await Promise.all(cinemaSeed.map((c) => prisma.cinemas.create({ data: c })));

  await Promise.all(
    hallSeed.map((h) =>
      prisma.halls.create({
        data: {
          id: h.id,
          cinema_id: h.cinemaId,
          name: h.name,
          type: h.type,
          capacity: h.rows * h.seatsPerRow,
          rows: h.rows,
          screen_type: h.screen,
          sound_system: h.sound,
          features: ['Ghế mềm', 'Giữ chỗ online'],
          layout_type: h.layout,
          status: HallStatus.ACTIVE,
        },
      })
    )
  );

  const seatsByHall: Record<string, { id: string; type: SeatType }[]> = {};

  for (const hall of hallSeed) {
    const seats: { id: string; type: SeatType; hall_id: string; row_letter: string; seat_number: number; status: SeatStatus }[] = [];
    for (let r = 0; r < hall.rows; r++) {
      const rowLetter = String.fromCharCode(65 + r);
      for (let s = 1; s <= hall.seatsPerRow; s++) {
        let type: SeatType = SeatType.STANDARD;
        if (hall.type === HallType.IMAX) {
          type = r >= hall.rows - 1 && s % 2 === 0 ? SeatType.COUPLE : SeatType.PREMIUM;
        }
        if (hall.type === HallType.VIP) {
          const inCenter = r >= 1 && r <= hall.rows - 2 && s >= 3 && s <= hall.seatsPerRow - 2;
          type = inCenter ? SeatType.VIP : SeatType.STANDARD;
        }

        const id = toUuid(`seat-${hall.id}-${rowLetter}-${s}`);
        seats.push({ id, type, hall_id: hall.id, row_letter: rowLetter, seat_number: s, status: SeatStatus.ACTIVE });
      }
    }
    seatsByHall[hall.id] = seats.map((s) => ({ id: s.id, type: s.type }));
    await prisma.seats.createMany({ data: seats });
  }

  for (const hall of hallSeed) {
    const seatTypes = Array.from(new Set(seatsByHall[hall.id].map((s) => s.type)));
    const price = (seatType: SeatType, isWeekend: boolean) => {
      if (seatType === SeatType.COUPLE) return isWeekend ? 240000 : 200000;
      if (seatType === SeatType.PREMIUM) return isWeekend ? 180000 : 150000;
      if (seatType === SeatType.VIP) return isWeekend ? 160000 : 130000;
      return isWeekend ? 140000 : 110000;
    };

    for (const seatType of seatTypes) {
      await prisma.ticketPricing.create({
        data: {
          hall_id: hall.id,
          seat_type: seatType,
          day_type: DayType.WEEKDAY,
          price: price(seatType, false),
        },
      });
      await prisma.ticketPricing.create({
        data: {
          hall_id: hall.id,
          seat_type: seatType,
          day_type: DayType.WEEKEND,
          price: price(seatType, true),
        },
      });
    }
  }

  // Use UTC to keep day string stable across environments and match booking seed IDs
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 5)); // 5 days ago
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 10)); // 10 days hence
  const movieOrder = [movieRefs.dune2, movieRefs.insideOut2, movieRefs.oppenheimer, movieRefs.gxk];

  const showtimesPayload: any[] = [];
  const seatReservationsPayload: any[] = [];

  for (let day = new Date(start); day <= end; day.setUTCDate(day.getUTCDate() + 1)) {
    const dayStr = day.toISOString().slice(0, 10); // YYYY-MM-DD in UTC
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    const dayType = isWeekend ? DayType.WEEKEND : DayType.WEEKDAY;

    hallSeed.forEach((hall, hallIndex) => {
      slots.forEach((slot, slotIndex) => {
        const movie = movieOrder[(hallIndex + slotIndex + day.getDate()) % movieOrder.length];
        const showtimeId = toUuid(`${hall.id}-${dayStr}-${slot.label}-${movie.movieId}`);

        const startTime = new Date(`${dayStr}T${String(slot.hour).padStart(2, '0')}:${String(slot.minute).padStart(2, '0')}:00Z`);
        const endTime = new Date(startTime.getTime() + (movie.runtime + 20) * 60000);

        const reservedSeatIds: string[] = [];
        const isBookingShow =
          hall.id === bookingRef.showtimeSeed.hallId &&
          dayStr === bookingRef.showtimeSeed.date &&
          slot.label === bookingRef.showtimeSeed.slot &&
          movie.movieId === bookingRef.showtimeSeed.movieId;

        if (isBookingShow) {
          bookingRef.seats.forEach((s) => reservedSeatIds.push(toUuid(`seat-${hall.id}-${s}`)));
        }

        const totalSeats = seatsByHall[hall.id].length;
        const available = totalSeats - reservedSeatIds.length;

        showtimesPayload.push({
          id: showtimeId,
          movie_id: movie.movieId,
          movie_release_id: movie.releaseId,
          cinema_id: hall.cinemaId,
          hall_id: hall.id,
          start_time: startTime,
          end_time: endTime,
          format: hall.type === HallType.IMAX ? Format.IMAX : Format.TWO_D,
          language: 'vi',
          subtitles: ['vi'],
          available_seats: available,
          total_seats: totalSeats,
          status: ShowtimeStatus.SELLING,
          day_type: dayType,
        });

        reservedSeatIds.forEach((seatId) => {
          seatReservationsPayload.push({
            showtime_id: showtimeId,
            seat_id: seatId,
            user_id: 'user-customer-001',
            status: ReservationStatus.CONFIRMED,
            booking_id: bookingRef.bookingId,
          });
        });
      });
    });
  }

  await prisma.showtimes.createMany({ data: showtimesPayload });
  if (seatReservationsPayload.length) {
    await prisma.seatReservations.createMany({ data: seatReservationsPayload });
  }

  const reviews = [
    {
      cinema_id: cinemaSeed[0].id,
      user_id: 'user-customer-001',
      rating: 5,
      comment: 'Phòng IMAX màn to, ghế thoải mái, âm thanh rất đã.',
      verified_visit: true,
    },
    {
      cinema_id: cinemaSeed[1].id,
      user_id: 'user-customer-002',
      rating: 4,
      comment: 'Vị trí trung tâm, mua vé online nhanh nhưng bãi xe hơi đông.',
      verified_visit: true,
    },
  ];

  await prisma.cinemaReviews.createMany({ data: reviews });

  console.log('✅ Seeded cinemas, halls, seats, pricing, showtimes (28/12/2025–15/01/2026), và review');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding cinema database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
