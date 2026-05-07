const fs = require('fs');
const path = require('path');

// Helper to find PrismaClient in different environments
function getPrismaClient(serviceName, customPath) {
  const possiblePaths = [
    customPath || `../../apps/${serviceName}/generated/prisma`, // Local
    '../../generated/prisma', // Docker (own service)
    `../../apps/${serviceName}/generated/prisma`, // Docker (other service if mounted)
  ];

  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(path.resolve(__dirname, p))) {
        return require(p).PrismaClient;
      }
    } catch (e) {
      /* skip */
    }
  }
  return null;
}

const BookingClient = getPrismaClient('booking-service');
const CinemaClient = getPrismaClient('cinema-service');

const prisma = BookingClient ? new BookingClient() : null;
const cinemaPrisma = CinemaClient
  ? new CinemaClient({
      datasources: {
        db: {
          url:
            process.env.CINEMA_DATABASE_URL ||
            'postgresql://postgres:postgres@localhost:5437/movie_hub_cinema',
        },
      },
    })
  : null;

// ==========================================
// 1. SMART PRICING LOGIC
// ==========================================
function calculatePrice(basePrice, seatType, showtimeDate) {
  let finalPrice = basePrice;

  // Seat Type Modifiers
  if (seatType === 'VIP') finalPrice *= 1.5;
  if (seatType === 'COUPLE') finalPrice *= 2.0; // Usually price for 2 people
  if (seatType === 'PREMIUM') finalPrice *= 1.25;

  // Day of Week Modifiers
  const day = showtimeDate.getDay();
  const isWeekend = day === 0 || day === 6; // Sun or Sat
  if (isWeekend) finalPrice *= 1.2;

  // Time of Day Modifiers
  const hour = showtimeDate.getHours();
  if (hour < 12) finalPrice *= 0.8; // Morning discount
  else if (hour >= 18 && hour <= 21) finalPrice *= 1.1; // Prime time

  return Math.round(finalPrice / 1000) * 1000; // Round to nearest 1000 VND
}

// ==========================================
// 2. BOOKING DENSITY SIMULATION
// ==========================================
/**
 * Determines how full a showtime should be based on movie rating, time, and day.
 * Returns a target occupancy percentage (0.0 to 1.0).
 */
function getTargetOccupancy(showtime, movieRating) {
  const date = new Date(showtime.start_time);
  const day = date.getDay();
  const hour = date.getHours();
  const isWeekend = day === 0 || day === 6;
  const isPrimeTime = hour >= 18 && hour <= 21;

  let baseOccupancy = 0.1; // Always at least 10% filled

  // Movie Popularity Factor (simulated by rating 1-10)
  // Higher rating = higher demand
  const popularityFactor = (movieRating || 7) / 10;
  baseOccupancy += popularityFactor * 0.3;

  // Temporal Factors
  if (isWeekend) baseOccupancy += 0.3;
  if (isPrimeTime) baseOccupancy += 0.2;
  if (hour < 12) baseOccupancy -= 0.1; // Mornings are quieter

  // Cap at 1.0 (100%) and Min at 0.05 (5%)
  return Math.max(0.05, Math.min(0.98, baseOccupancy));
}

// ==========================================
// 3. USER PERSONAS
// ==========================================
const PERSONAS = [
  { email: 'admin@moviehub.com', name: 'Super Admin', type: 'ADMIN' },
  { email: 'whale@moviehub.com', name: 'Whale Spender', type: 'WHALE' }, // Books VIP, Combos
  { email: 'family@moviehub.com', name: 'Family Nguyen', type: 'FAMILY' }, // Books 3-4 seats
  { email: 'student@moviehub.com', name: 'Student Le', type: 'STUDENT' }, // Books Standard, Discount codes
  { email: 'newbie@moviehub.com', name: 'New User', type: 'NEWBIE' },
];

function getRandomUser(personaType = null) {
  // If persona requested, return that specific one
  if (personaType) {
    const persona = PERSONAS.find((p) => p.type === personaType);
    if (persona)
      return { ...persona, id: `user_${persona.type.toLowerCase()}` };
  }

  // Otherwise weighted random
  const rand = Math.random();
  if (rand < 0.05) return { ...PERSONAS[1], id: 'user_whale' }; // 5% Whales
  if (rand < 0.2) return { ...PERSONAS[3], id: 'user_student' }; // 15% Students
  if (rand < 0.4) return { ...PERSONAS[2], id: 'user_family' }; // 20% Families

  // 60% Random "Guest" or Regular users
  return {
    id: `user_guest_${Math.floor(Math.random() * 1000)}`,
    name: 'Guest User',
    email: 'guest@example.com',
  };
}

// Helper: Heatmap Seating (Pick seats from middle out)
function pickBestSeats(seats, count) {
  if (seats.length < count) return [];

  // Simple heuristic: Middle of the array is roughly middle of the theater
  // for a flat array sorted by Row/Number.
  // Ideally we'd calculate distance from center (Rows/2, Cols/2).

  // Sort logic to simulate preference (Middle rows, Middle columns)
  // We'll assume the input 'seats' array is somewhat ordered by database insertion.
  const centerIndex = Math.floor(seats.length / 2);

  // Take a slice around the center
  const start = Math.max(0, centerIndex - Math.floor(count / 2));
  const selected = seats.slice(start, start + count);

  // Remove selected from available pool (by filter or splice in the caller)
  return selected;
}

async function main() {
  const dataPath = path.join(__dirname, 'data.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  console.log('🎟️ Starting Scenario-Based Booking Seed...');

  if (!prisma || !cinemaPrisma) {
    console.error('❌ Missing Prisma Clients');
    process.exit(1);
  }

  // CLEANUP
  await prisma.$transaction([
    prisma.bookingConcessions.deleteMany(),
    prisma.payments.deleteMany(),
    prisma.tickets.deleteMany(),
    prisma.bookings.deleteMany(),
    prisma.promotions.deleteMany(),
    prisma.concessions.deleteMany(),
  ]);

  // 1. SEED CONCESSIONS & PROMOTIONS
  console.log('🍿 Seeding Concessions...');
  const concessions = await Promise.all(
    data.concessions.map((c) =>
      prisma.concessions.create({
        data: {
          ...c,
          image_url:
            c.category === 'FOOD'
              ? 'https://placehold.co/400x400?text=Popcorn'
              : 'https://placehold.co/400x400?text=Drink',
        },
      })
    )
  );

  console.log('🏷️ Seeding Promotions...');
  await prisma.promotions.createMany({
    data: data.promotions.map((p) => ({
      ...p,
      value: Number(p.value), // Ensure numeric types
      min_purchase: Number(p.min_purchase),
      max_discount: p.max_discount ? Number(p.max_discount) : null,
      valid_from: new Date(p.valid_from),
      valid_to: new Date(p.valid_to),
    })),
  });

  // 2. FETCH SHOWTIMES
  const showtimes = await cinemaPrisma.showtimes.findMany({
    include: {
      hall: { include: { seats: true } },
      cinema: true,
      // We might need movie details for rating, but assume default rating=7 if not available easily
      // In a real app we'd fetch movie details or include them if relation existed across services
    },
    take: 50, // Focus on next few days
  });

  if (showtimes.length === 0) {
    console.log('⚠️ No showtimes. Run seed_cinema first.');
    return;
  }

  // 3. SIMULATE TRAFFIC PER SHOWTIME
  let totalBookings = 0;
  let totalRevenue = 0;

  console.log(`\n🚦 Simulating Traffic for ${showtimes.length} Showtimes...`);

  for (const showtime of showtimes) {
    // Step A: Determine Traffic Volume
    // Assume a random rating between 5-9 for simulation if we can't cross-fetch movie
    const simulatedRating = Math.floor(Math.random() * 5) + 5;
    const occupancyRate = getTargetOccupancy(showtime, simulatedRating);

    const availableSeats = [...showtime.hall.seats]; // Copy array
    const targetBookedCount = Math.floor(availableSeats.length * occupancyRate);

    if (targetBookedCount === 0) continue;

    // Group booking logic
    let seatsBooked = 0;

    while (seatsBooked < targetBookedCount && availableSeats.length > 0) {
      // B. Determine User Persona & Group Size
      const user = getRandomUser();
      let groupSize = 1;

      if (user.id === 'user_family') groupSize = 4;
      else if (user.id === 'user_whale') groupSize = 2; // Couple
      else groupSize = Math.floor(Math.random() * 3) + 1; // 1-3

      // C. Pick Seats (Heatmap logic simulated by picking chunks from center-ish)
      // We randomly slice to avoid perfect sequential filling every time
      const startIdx = Math.floor(
        Math.random() * (availableSeats.length - groupSize)
      );
      const selectedSeats = availableSeats.splice(startIdx, groupSize);

      if (selectedSeats.length === 0) break;

      // D. Create Booking
      const showDate = new Date(showtime.start_time);
      const now = new Date();
      // Booking time relative to showtime
      const bookingTime =
        showDate > now
          ? new Date(now.getTime() - Math.random() * 86400000) // Booked recently for future show
          : new Date(showDate.getTime() - Math.random() * 86400000 * 3); // Booked 1-3 days before past show

      let bookingSubtotal = 0;
      const ticketItems = [];

      for (const seat of selectedSeats) {
        const price = calculatePrice(120000, seat.type, showDate);
        bookingSubtotal += price;
        ticketItems.push({ seat_id: seat.id, price, type: 'ADULT' });
      }

      // Add Concessions for Whales/Families
      let concessionTotal = 0;
      const concessionItems = [];
      if (user.id === 'user_whale' || user.id === 'user_family') {
        const item = concessions[0]; // Popcorn
        concessionItems.push({
          concession_id: item.id,
          quantity: 2,
          unit_price: item.price,
          total_price: item.price * 2,
        });
        concessionTotal += Number(item.price) * 2;
      }

      const finalTotal = bookingSubtotal + concessionTotal;

      // DB INSERT
      try {
        const booking = await prisma.bookings.create({
          data: {
            booking_code: `BK${Date.now()}${Math.floor(Math.random() * 1000)}`,
            user_id: user.id,
            showtime_id: showtime.id,
            customer_name: user.name,
            customer_email: user.email,
            subtotal: bookingSubtotal,
            final_amount: finalTotal,
            status: 'CONFIRMED',
            payment_status: 'COMPLETED', // Simplify to completed for revenue reports
            created_at: bookingTime,
            updated_at: bookingTime,
            tickets: {
              create: ticketItems.map((t) => ({
                seat_id: t.seat_id,
                ticket_code: `TK${Math.floor(Math.random() * 1000000)}`,
                ticket_type: t.type,
                price: t.price,
                status: showDate < now ? 'USED' : 'VALID', // Auto-use past tickets
              })),
            },
            booking_concessions: {
              create: concessionItems,
            },
            payments: {
              create: {
                amount: finalTotal,
                payment_method: 'CREDIT_CARD',
                status: 'COMPLETED',
                transaction_id: `TX-${Date.now()}-${Math.random()}`,
              },
            },
          },
        });

        totalBookings++;
        totalRevenue += finalTotal;
        seatsBooked += selectedSeats.length;
      } catch (e) {
        // Ignore unique constraint bumps or glitches
      }
    }
  }

  console.log('\n📊 =============== SEED SUMMARY ===============');
  console.log(`✅ Total Bookings: ${totalBookings}`);
  console.log(
    `💰 Total Fake Revenue: ${totalRevenue.toLocaleString('vi-VN')} VND`
  );
  console.log(`📅 Showtimes Simulated: ${showtimes.length}`);
  console.log('==============================================\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    if (cinemaPrisma) await cinemaPrisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    if (cinemaPrisma) await cinemaPrisma.$disconnect();
    process.exit(1);
  });
