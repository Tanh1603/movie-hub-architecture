// Debug script to check what's actually stored in the database
const {
  PrismaClient: CinemaClient,
} = require('../../apps/cinema-service/generated/prisma');

const prisma = new CinemaClient({
  datasources: {
    db: {
      url:
        process.env.CINEMA_DATABASE_URL ||
        'postgresql://postgres:postgres@localhost:5435/movie_hub_cinema',
    },
  },
});

async function checkShowtimes() {
  try {
    // Get one showtime
    const showtime = await prisma.showtimes.findFirst({
      where: {
        id: '3d35c031-b48b-4df3-b7a2-7c85e721953d',
      },
    });

    if (!showtime) {
      console.log('Showtime not found');
      return;
    }

    console.log('=== SHOWTIME DEBUG ===');
    console.log('ID:', showtime.id);
    console.log('Raw start_time object:', showtime.start_time);
    console.log('Type:', typeof showtime.start_time);
    console.log('Constructor:', showtime.start_time.constructor.name);
    console.log('');
    console.log('ISO String:', showtime.start_time.toISOString());
    console.log('UTC String:', showtime.start_time.toUTCString());
    console.log('Local String:', showtime.start_time.toLocaleString());
    console.log(
      'Local String (vi-VN):',
      showtime.start_time.toLocaleString('vi-VN')
    );
    console.log(
      'Local String (vi-VN + UTC+7):',
      showtime.start_time.toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
      })
    );
    console.log('');
    console.log('Get methods:');
    console.log('  getHours():', showtime.start_time.getHours());
    console.log('  getUTCHours():', showtime.start_time.getUTCHours());
    console.log('  getTime():', showtime.start_time.getTime());
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkShowtimes();
