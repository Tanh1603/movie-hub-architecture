const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

// Sample data for Vietnam cinema locations
const cinemaData = [
  {
    name: 'CGV Vincom Center Landmark 81',
    address:
      'Tầng 5-6, Vincom Center Landmark 81, 720A Điện Biên Phủ, Phường 22',
    city: 'Hồ Chí Minh',
    district: 'Bình Thạnh',
    phone: '1900 6017',
    email: 'landmark81@cgv.vn',
    latitude: 10.7946,
    longitude: 106.722,
    description:
      'Rạp chiếu phim hiện đại tại tòa nhà cao nhất Việt Nam với công nghệ chiếu tiên tiến',
    amenities: [
      'Thang máy',
      'Điều hòa',
      'Đồ ăn nhanh',
      'Bãi đỗ xe',
      'Free WiFi',
      'Ghế massage',
    ],
    facilities: {
      parking: true,
      food_court: true,
      disabled_access: true,
      '3d_screens': true,
      imax: true,
    },
    images: [
      'https://example.com/cgv-landmark81-1.jpg',
      'https://example.com/cgv-landmark81-2.jpg',
    ],
    rating: 4.5,
    total_reviews: 1250,
    operating_hours: {
      monday: '09:00-23:00',
      tuesday: '09:00-23:00',
      wednesday: '09:00-23:00',
      thursday: '09:00-23:00',
      friday: '09:00-23:30',
      saturday: '09:00-23:30',
      sunday: '09:00-23:00',
    },
    social_media: {
      facebook: 'cgv.landmark81',
      instagram: 'cgv_vietnam',
    },
  },
  {
    name: 'Galaxy Nguyễn Du',
    address: '116 Nguyễn Du, Phường Bến Nghé',
    city: 'Hồ Chí Minh',
    district: 'Quận 1',
    phone: '028 3827 7717',
    email: 'nguyendu@galaxystudio.vn',
    latitude: 10.7769,
    longitude: 106.7009,
    description:
      'Rạp chiếu phim Galaxy với công nghệ hiện đại tại trung tâm Sài Gòn',
    amenities: ['Thang máy', 'Điều hòa', 'Đồ ăn nhanh', 'Free WiFi'],
    facilities: {
      parking: true,
      food_court: true,
      disabled_access: true,
      '3d_screens': true,
      imax: false,
    },
    images: ['https://example.com/galaxy-nguyendu-1.jpg'],
    rating: 4.2,
    total_reviews: 890,
    operating_hours: {
      monday: '10:00-22:30',
      tuesday: '10:00-22:30',
      wednesday: '10:00-22:30',
      thursday: '10:00-22:30',
      friday: '10:00-23:00',
      saturday: '10:00-23:00',
      sunday: '10:00-22:30',
    },
  },
  {
    name: 'Lotte Cinema Diamond Plaza',
    address: 'Tầng 13, Diamond Plaza, 34 Lê Duẩn, Phường Bến Nghé',
    city: 'Hồ Chí Minh',
    district: 'Quận 1',
    phone: '028 3822 5468',
    email: 'diamond@lottecinema.vn',
    latitude: 10.7878,
    longitude: 106.7017,
    description:
      'Rạp Lotte Cinema với ghế VIP và công nghệ âm thanh Dolby Atmos',
    amenities: [
      'Thang máy',
      'Điều hòa',
      'Đồ ăn nhanh',
      'Bãi đỗ xe',
      'Free WiFi',
      'VIP Lounge',
    ],
    facilities: {
      parking: true,
      food_court: true,
      disabled_access: true,
      '3d_screens': true,
      imax: false,
      dolby_atmos: true,
    },
    images: [
      'https://example.com/lotte-diamond-1.jpg',
      'https://example.com/lotte-diamond-2.jpg',
    ],
    rating: 4.3,
    total_reviews: 1105,
    operating_hours: {
      monday: '09:30-22:30',
      tuesday: '09:30-22:30',
      wednesday: '09:30-22:30',
      thursday: '09:30-22:30',
      friday: '09:30-23:00',
      saturday: '09:30-23:00',
      sunday: '09:30-22:30',
    },
  },
  {
    name: 'BHD Star Bitexco',
    address: 'Tầng 3-4, Bitexco Financial Tower, 2 Hải Triều, Phường Bến Nghé',
    city: 'Hồ Chí Minh',
    district: 'Quận 1',
    phone: '028 3914 4414',
    email: 'bitexco@bhdstar.vn',
    latitude: 10.7718,
    longitude: 106.7037,
    description:
      'Rạp BHD Star tại tòa nhà Bitexco với view toàn cảnh thành phố',
    amenities: ['Thang máy', 'Điều hòa', 'Đồ ăn nhanh', 'Free WiFi', 'Ghế đôi'],
    facilities: {
      parking: false,
      food_court: true,
      disabled_access: true,
      '3d_screens': true,
      imax: false,
    },
    images: ['https://example.com/bhd-bitexco-1.jpg'],
    rating: 4.1,
    total_reviews: 675,
    operating_hours: {
      monday: '10:00-22:00',
      tuesday: '10:00-22:00',
      wednesday: '10:00-22:00',
      thursday: '10:00-22:00',
      friday: '10:00-23:00',
      saturday: '10:00-23:00',
      sunday: '10:00-22:00',
    },
  },
  {
    name: 'CGV Aeon Bình Tân',
    address: 'Tầng 3, Aeon Mall Bình Tân, 1 Đường số 17A, KDC Bình Hưng',
    city: 'Hồ Chí Minh',
    district: 'Bình Tân',
    phone: '1900 6017',
    email: 'aeonbinhtan@cgv.vn',
    latitude: 10.7515,
    longitude: 106.6133,
    description:
      'Rạp CGV tại Aeon Mall với nhiều phòng chiếu và khu vui chơi gia đình',
    amenities: [
      'Thang máy',
      'Điều hòa',
      'Đồ ăn nhanh',
      'Bãi đỗ xe',
      'Free WiFi',
      'Khu vui chơi trẻ em',
    ],
    facilities: {
      parking: true,
      food_court: true,
      disabled_access: true,
      '3d_screens': true,
      imax: false,
      kids_area: true,
    },
    images: ['https://example.com/cgv-aeon-1.jpg'],
    rating: 4.0,
    total_reviews: 520,
    operating_hours: {
      monday: '09:00-22:00',
      tuesday: '09:00-22:00',
      wednesday: '09:00-22:00',
      thursday: '09:00-22:00',
      friday: '09:00-23:00',
      saturday: '09:00-23:00',
      sunday: '09:00-22:00',
    },
  },
  {
    name: 'Galaxy Linh Đàm',
    address: 'Tầng 5, Vincom Plaza Linh Đàm, Đường Linh Đàm',
    city: 'Hà Nội',
    district: 'Hoàng Mai',
    phone: '024 3633 9999',
    email: 'linhdam@galaxystudio.vn',
    latitude: 20.9656,
    longitude: 105.8906,
    description: 'Rạp Galaxy tại Hà Nội với công nghệ 4DX và IMAX',
    amenities: [
      'Thang máy',
      'Điều hòa',
      'Đồ ăn nhanh',
      'Bãi đỗ xe',
      'Free WiFi',
    ],
    facilities: {
      parking: true,
      food_court: true,
      disabled_access: true,
      '3d_screens': true,
      imax: true,
      '4dx': true,
    },
    images: ['https://example.com/galaxy-linhdam-1.jpg'],
    rating: 4.4,
    total_reviews: 780,
    operating_hours: {
      monday: '09:30-22:30',
      tuesday: '09:30-22:30',
      wednesday: '09:30-22:30',
      thursday: '09:30-22:30',
      friday: '09:30-23:00',
      saturday: '09:30-23:00',
      sunday: '09:30-22:30',
    },
  },
];

// Hall configurations for different cinema types
const hallConfigurations = [
  {
    name: 'Hall 1',
    type: 'IMAX',
    capacity: 300,
    rows: 20,
    screen_type: 'IMAX',
    sound_system: 'Dolby Atmos',
  },
  {
    name: 'Hall 2',
    type: 'PREMIUM',
    capacity: 120,
    rows: 10,
    screen_type: '4K Digital',
    sound_system: 'DTS-X',
  },
  {
    name: 'Hall 3',
    type: 'STANDARD',
    capacity: 180,
    rows: 15,
    screen_type: 'Digital',
    sound_system: 'Dolby Digital',
  },
  {
    name: 'Hall 4',
    type: 'VIP',
    capacity: 80,
    rows: 8,
    screen_type: '4K Digital',
    sound_system: 'Dolby Atmos',
  },
  {
    name: 'Hall 5',
    type: 'FOUR_DX',
    capacity: 60,
    rows: 6,
    screen_type: '4DX',
    sound_system: '4DX Audio',
  },
  {
    name: 'Hall 6',
    type: 'STANDARD',
    capacity: 160,
    rows: 12,
    screen_type: 'Digital',
    sound_system: 'Dolby Digital',
  },
];

// Seat layout generator
function generateSeats(hallId, capacity, rows) {
  const seats = [];
  const seatsPerRow = Math.ceil(capacity / rows);
  const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  for (let i = 0; i < rows; i++) {
    const rowLetter = rowLetters[i];
    for (let j = 1; j <= seatsPerRow; j++) {
      // Make some seats VIP (front 2 rows) or COUPLE (back 2 rows)
      let seatType = 'STANDARD';
      if (i < 2) seatType = 'VIP';
      else if (i >= rows - 2 && j % 2 === 1) seatType = 'COUPLE';
      else if (j === 1 || j === seatsPerRow) seatType = 'WHEELCHAIR';

      seats.push({
        hall_id: hallId,
        row_letter: rowLetter,
        seat_number: j,
        type: seatType,
        position_x: j * 60, // pixels
        position_y: i * 50,
        status: 'ACTIVE',
      });

      if (seats.length >= capacity) break;
    }
    if (seats.length >= capacity) break;
  }

  return seats;
}

// Pricing data
function generatePricing(hallId, hallType) {
  const pricing = [];
  const seatTypes = ['STANDARD', 'VIP', 'COUPLE', 'PREMIUM', 'WHEELCHAIR'];
  const ticketTypes = ['ADULT', 'CHILD', 'STUDENT'];
  const dayTypes = ['WEEKDAY', 'WEEKEND', 'HOLIDAY'];
  const timeSlots = ['MORNING', 'AFTERNOON', 'EVENING', 'LATE_NIGHT'];

  // Base prices by hall type
  const basePrices = {
    IMAX: 180000,
    PREMIUM: 150000,
    FOUR_DX: 200000,
    VIP: 120000,
    STANDARD: 80000,
  };

  const basePrice = basePrices[hallType] || 80000;

  seatTypes.forEach((seatType) => {
    ticketTypes.forEach((ticketType) => {
      dayTypes.forEach((dayType) => {
        timeSlots.forEach((timeSlot) => {
          let price = basePrice;

          // Seat type multipliers
          if (seatType === 'VIP') price *= 1.5;
          else if (seatType === 'COUPLE') price *= 1.8;
          else if (seatType === 'PREMIUM') price *= 2.0;
          else if (seatType === 'WHEELCHAIR') price *= 0.9;

          // Ticket type multipliers
          if (ticketType === 'CHILD') price *= 0.7;
          else if (ticketType === 'STUDENT') price *= 0.8;

          // Day type multipliers
          if (dayType === 'WEEKEND') price *= 1.2;
          else if (dayType === 'HOLIDAY') price *= 1.5;

          // Time slot multipliers
          if (timeSlot === 'EVENING') price *= 1.1;
          else if (timeSlot === 'LATE_NIGHT') price *= 0.9;

          pricing.push({
            hall_id: hallId,
            seat_type: seatType,
            ticket_type: ticketType,
            day_type: dayType,
            time_slot: timeSlot,
            price: Math.round(price),
          });
        });
      });
    });
  });

  return pricing;
}

// Showtime generator
function generateShowtimes(cinemas, halls, movieIds) {
  const showtimes = [];
  const formats = ['TWO_D', 'THREE_D', 'IMAX', 'FOUR_DX'];
  const languages = ['VI', 'EN'];
  const subtitles = [['VI'], ['EN'], ['VI', 'EN']];

  // Generate showtimes for the next 7 days
  const today = new Date();
  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + day);

    halls.forEach((hall) => {
      const cinema = cinemas.find((c) => c.id === hall.cinema_id);
      if (!cinema) return;

      // 3-4 showtimes per hall per day
      const showtimesPerDay = Math.floor(Math.random() * 2) + 3;

      for (let i = 0; i < showtimesPerDay; i++) {
        const movieId = movieIds[Math.floor(Math.random() * movieIds.length)];
        const format = formats[Math.floor(Math.random() * formats.length)];
        const language =
          languages[Math.floor(Math.random() * languages.length)];
        const subtitle =
          subtitles[Math.floor(Math.random() * subtitles.length)];

        // Generate start time (9 AM to 9 PM)
        const startHour = 9 + i * 3; // Spread throughout the day
        const startTime = new Date(currentDate);
        startTime.setHours(startHour, Math.floor(Math.random() * 60), 0);

        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + 2, startTime.getMinutes() + 30); // ~2.5h runtime

        // Determine day type and time slot
        const dayOfWeek = currentDate.getDay();
        const dayType =
          dayOfWeek === 0 || dayOfWeek === 6 ? 'WEEKEND' : 'WEEKDAY';

        let timeSlot = 'MORNING';
        if (startHour >= 12 && startHour < 17) timeSlot = 'AFTERNOON';
        else if (startHour >= 17 && startHour < 22) timeSlot = 'EVENING';
        else if (startHour >= 22) timeSlot = 'LATE_NIGHT';

        const basePrice =
          hall.type === 'IMAX'
            ? 180000
            : hall.type === 'PREMIUM'
            ? 150000
            : hall.type === 'VIP'
            ? 120000
            : 80000;

        showtimes.push({
          movie_id: movieId,
          cinema_id: cinema.id,
          hall_id: hall.id,
          start_time: startTime,
          end_time: endTime,
          day_type: dayType,
          time_slot: timeSlot,
          format: format,
          language: language,
          subtitles: subtitle,
          base_price: basePrice,
          available_seats: hall.capacity,
          total_seats: hall.capacity,
          status: 'SELLING',
        });
      }
    });
  }

  return showtimes;
}

async function main() {
  console.log('🎬 Starting cinema service seeding...');

  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await prisma.seatReservations.deleteMany();
    await prisma.showtimes.deleteMany();
    await prisma.ticketPricing.deleteMany();
    await prisma.seats.deleteMany();
    await prisma.halls.deleteMany();
    await prisma.cinemaReviews.deleteMany();
    await prisma.cinemas.deleteMany();

    // Create cinemas
    console.log('🏢 Creating cinemas...');
    const createdCinemas = [];
    for (const cinema of cinemaData) {
      const createdCinema = await prisma.cinemas.create({
        data: cinema,
      });
      createdCinemas.push(createdCinema);
    }
    console.log(`✅ Created ${createdCinemas.length} cinemas`);

    // Create halls for each cinema
    console.log('🎭 Creating halls...');
    const allHalls = [];
    for (const cinema of createdCinemas) {
      const numHalls = Math.floor(Math.random() * 3) + 4; // 4-6 halls per cinema
      const halls = [];

      for (let i = 0; i < numHalls; i++) {
        const config = hallConfigurations[i % hallConfigurations.length];
        const hall = await prisma.halls.create({
          data: {
            cinema_id: cinema.id,
            name: config.name,
            type: config.type,
            capacity: config.capacity,
            rows: config.rows,
            screen_type: config.screen_type,
            sound_system: config.sound_system,
            features: [
              'Digital Projection',
              'Surround Sound',
              'Climate Control',
            ],
            layout_data: {
              width: config.capacity > 200 ? 25 : 20,
              height: config.rows,
              screen_position: 'front',
            },
          },
        });
        halls.push(hall);
        allHalls.push(hall);
      }

      console.log(`  📍 ${cinema.name}: ${halls.length} halls`);
    }
    console.log(`✅ Created ${allHalls.length} halls total`);

    // Create seats for each hall
    console.log('💺 Creating seats...');
    let totalSeats = 0;
    for (const hall of allHalls) {
      const seats = generateSeats(hall.id, hall.capacity, hall.rows);
      await prisma.seats.createMany({
        data: seats,
      });
      totalSeats += seats.length;
    }
    console.log(`✅ Created ${totalSeats} seats`);

    // Create pricing for each hall
    console.log('💰 Creating pricing...');
    let totalPricingEntries = 0;
    for (const hall of allHalls) {
      const pricing = generatePricing(hall.id, hall.type);
      await prisma.ticketPricing.createMany({
        data: pricing,
      });
      totalPricingEntries += pricing.length;
    }
    console.log(`✅ Created ${totalPricingEntries} pricing entries`);

    // Sample movie IDs (these should exist in movie service)
    const movieIds = [
      '60b4cefd-4cf9-4da9-afb2-ba2f08f01d7a',
      'efbf24be-c0c2-407c-af56-89c8c45b1b7e',
      '8fa24256-b743-4a78-bc75-edf7f8809f17',
      '6575a547-de21-480d-bbad-f4c375183868',
      '3dd55399-d93d-4086-85e6-c6597a89b78f',
      '2ba48cba-2b8d-47a5-bebc-2361fb288409',
      'c6d3a8c8-d1e3-4f6a-ac82-c0ebdad98199',
      'bfc9b7b3-3e70-497c-b217-0d135a31364b',
      '9d7db22a-5cb8-4be3-a50a-d3aa689dc25f',
      '3e98636c-77ca-4cde-bd5f-8d601dc9e283',
    ];

    // Create showtimes
    console.log('🎪 Creating showtimes...');
    const showtimes = generateShowtimes(createdCinemas, allHalls, movieIds);
    await prisma.showtimes.createMany({
      data: showtimes,
    });
    console.log(`✅ Created ${showtimes.length} showtimes`);

    // Create some sample cinema reviews
    console.log('⭐ Creating cinema reviews...');
    const sampleUserIds = [
      'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
      'b1c2d3e4-f5a6-789b-cdef-012345678abc',
      'c2d3e4f5-a6b7-89cd-ef01-23456789abcd',
      'd3e4f5a6-b789-cdef-0123-456789abcdef',
      'e4f5a6b7-89cd-ef01-2345-6789abcdef01',
    ];

    const reviews = [];
    for (const cinema of createdCinemas) {
      const numReviews = Math.floor(Math.random() * 3) + 2; // 2-4 reviews per cinema

      for (let i = 0; i < numReviews; i++) {
        const baseUserId =
          sampleUserIds[Math.floor(Math.random() * sampleUserIds.length)];
        // Create a unique user_id by modifying the last part
        const user_id = baseUserId.slice(0, -2) + i.toString().padStart(2, '0');
        const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars

        const comments = [
          'Rạp rất đẹp và hiện đại, âm thanh tuyệt vời!',
          'Dịch vụ tốt, ghế ngồi thoải mái',
          'Màn hình lớn, chất lượng hình ảnh rất tốt',
          'Nhân viên thân thiện, không gian sạch sẽ',
          'Giá vé hợp lý, sẽ quay lại lần sau',
        ];

        reviews.push({
          cinema_id: cinema.id,
          user_id: user_id,
          rating: rating,
          comment: comments[Math.floor(Math.random() * comments.length)],
          aspects: {
            sound_quality: rating,
            seat_comfort: rating,
            screen_quality: rating - Math.floor(Math.random() * 2),
            service: rating,
            cleanliness: rating,
          },
          verified_visit: Math.random() > 0.3, // 70% verified
        });
      }
    }

    await prisma.cinemaReviews.createMany({
      data: reviews,
    });
    console.log(`✅ Created ${reviews.length} cinema reviews`);

    console.log('\n🎉 Cinema service seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Cinemas: ${createdCinemas.length}`);
    console.log(`   - Halls: ${allHalls.length}`);
    console.log(`   - Seats: ${totalSeats}`);
    console.log(`   - Pricing entries: ${totalPricingEntries}`);
    console.log(`   - Showtimes: ${showtimes.length}`);
    console.log(`   - Reviews: ${reviews.length}`);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
