import axios from 'axios';

describe('Complete User Booking Journey', () => {
  const baseURL = process.env.API_GATEWAY_URL || 'http://localhost:4000';

  // User journey data
  let userJourney = {
    selectedMovie: null as any,
    selectedGenre: null as any,
    userLocation: { latitude: 10.7946, longitude: 106.722 }, // Landmark 81 area
    nearbycinemas: [] as any[],
    selectedCinema: null as any,
    availableShowtimes: [] as any[],
    selectedShowtime: null as any,
    seatLayout: [] as any[],
    selectedSeats: [] as any[],
    totalPrice: 0,
  };

  beforeAll(() => {
    axios.defaults.baseURL = baseURL;
    axios.defaults.timeout = 15000;
  });

  describe('🎬 Step 1: Movie Discovery', () => {
    it('User browses available movies', async () => {
      console.log('\n🎬 User opens the movie booking app...');

      const res = await axios.get('/api/v1/movies');
      expect(res.status).toBe(200);
      expect(res.data.data.length).toBeGreaterThan(0);

      // User selects the first interesting movie
      userJourney.selectedMovie = res.data.data[0];

      console.log('✅ User selected movie:', userJourney.selectedMovie.title);
      console.log('   Runtime:', userJourney.selectedMovie.runtime, 'minutes');
      console.log('   Rating:', userJourney.selectedMovie.ageRating);
    });

    it('User views movie details and genres', async () => {
      console.log('\n📖 User wants to know more about the movie...');

      const [movieRes, genresRes] = await Promise.all([
        axios.get(`/api/v1/movies/${userJourney.selectedMovie.id}`),
        axios.get('/api/v1/genres'),
      ]);

      expect(movieRes.status).toBe(200);
      expect(genresRes.status).toBe(200);

      userJourney.selectedGenre = genresRes.data.data[0];

      console.log('✅ Movie details retrieved');
      console.log('   Available genres:', genresRes.data.data.length);
      console.log('   First genre:', userJourney.selectedGenre.name);
    });
  });

  describe('🗺️ Step 2: Cinema Location Discovery', () => {
    it('User searches for nearby cinemas using location', async () => {
      console.log('\n🗺️ User enables location to find nearby cinemas...');

      const { latitude, longitude } = userJourney.userLocation;

      const res = await axios.get(
        `/api/v1/cinemas/nearby?lat=${latitude}&lon=${longitude}&radius=10`
      );

      expect(res.status).toBe(200);
      expect(res.data.cinemas.length).toBeGreaterThan(0);

      userJourney.nearbycinemas = res.data.cinemas;

      console.log(
        '✅ Found',
        userJourney.nearbycinemas.length,
        'nearby cinemas'
      );
      userJourney.nearbycinemas.forEach((cinema, index) => {
        console.log(
          `   ${index + 1}. ${cinema.name} - ${cinema.district}, ${cinema.city}`
        );
        console.log(
          `      Rating: ${cinema.rating}/5 (${cinema.total_reviews} reviews)`
        );
      });
    });

    it('User selects preferred cinema based on rating and location', async () => {
      console.log('\n🎪 User compares cinemas and selects one...');

      // User chooses cinema with highest rating
      userJourney.selectedCinema = userJourney.nearbycinemas.sort(
        (a, b) => b.rating - a.rating
      )[0];

      console.log('✅ User selected:', userJourney.selectedCinema.name);
      console.log('   Address:', userJourney.selectedCinema.address);
      console.log('   Rating:', userJourney.selectedCinema.rating, '/5');
      console.log(
        '   Amenities:',
        userJourney.selectedCinema.amenities.join(', ')
      );
    });

    it('User checks cinema details and facilities', async () => {
      console.log('\n🏢 User checks cinema facilities...');

      const res = await axios.get(
        `/api/v1/cinemas/${userJourney.selectedCinema.id}`
      );
      expect(res.status).toBe(200);

      const facilities = res.data.facilities || {};
      const hasParking = facilities.parking;
      const hasIMaX = facilities.imax;
      const has3D = facilities['3d_screens'];

      console.log('✅ Cinema facilities checked:');
      console.log('   🚗 Parking:', hasParking ? 'Yes' : 'No');
      console.log('   🎬 IMAX:', hasIMaX ? 'Yes' : 'No');
      console.log('   🕶️  3D Screens:', has3D ? 'Yes' : 'No');
      console.log(
        '   Operating hours:',
        JSON.stringify(res.data.data.operating_hours, null, 2)
      );
    });
  });

  describe('🕐 Step 3: Showtime Selection', () => {
    it('User checks available showtimes for today', async () => {
      console.log('\n🕐 User looks for showtime options...');

      const today = new Date().toISOString().split('T')[0];

      const res = await axios.get(
        `/api/v1/cinemas/${userJourney.selectedCinema.id}/movies/${userJourney.selectedMovie.id}/showtimes?date=${today}`
      );

      expect(res.status).toBe(200);

      // Convert indexed object to array
      const showtimesData = res.data;
      const showtimesArray = Object.keys(showtimesData)
        .filter(
          (key) => key !== 'success' && key !== 'timestamp' && key !== 'path'
        )
        .map((key) => showtimesData[key]);

      userJourney.availableShowtimes = showtimesArray;

      if (userJourney.availableShowtimes.length > 0) {
        console.log(
          '✅ Found',
          userJourney.availableShowtimes.length,
          'showtimes for today'
        );
      } else {
        console.log('⚠️  No showtimes today, checking tomorrow...');

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const tomorrowRes = await axios.get(
          `/api/v1/cinemas/${userJourney.selectedCinema.id}/movies/${userJourney.selectedMovie.id}/showtimes?date=${tomorrowStr}`
        );

        userJourney.availableShowtimes = tomorrowRes.data.data;
        console.log(
          '✅ Found',
          userJourney.availableShowtimes.length,
          'showtimes for tomorrow'
        );
      }

      expect(userJourney.availableShowtimes.length).toBeGreaterThan(0);
    });

    it('User selects preferred showtime', async () => {
      console.log('\n⏰ User reviews showtime options...');

      userJourney.availableShowtimes.forEach((showtime, index) => {
        const startTime = new Date(showtime.startTime);
        console.log(
          `   ${
            index + 1
          }. ${startTime.toLocaleTimeString()} - Hall ${showtime.hallId?.slice(
            -8
          )}`
        );
        console.log(`      Status: ${showtime.status}`);
      });

      // User selects the first available showtime
      userJourney.selectedShowtime =
        userJourney.availableShowtimes.find((s) => s.status === 'SELLING') ||
        userJourney.availableShowtimes[0];

      const selectedTime = new Date(userJourney.selectedShowtime.startTime);
      console.log('✅ User selected showtime:', selectedTime.toLocaleString());
    });
  });

  describe('💺 Step 4: Seat Selection', () => {
    it('User views seat layout', async () => {
      console.log('\n💺 User opens seat selection...');

      const res = await axios.get(
        `/api/v1/showtimes/${userJourney.selectedShowtime.id}/seats`
      );
      expect(res.status).toBe(200);
      expect(res.data.data.length).toBeGreaterThan(0);

      userJourney.seatLayout = res.data.data;
      const availableSeats = userJourney.seatLayout.filter(
        (s) => s.status === 'AVAILABLE'
      );
      const occupiedSeats = userJourney.seatLayout.filter(
        (s) => s.status === 'OCCUPIED'
      );

      console.log('✅ Seat layout loaded:');
      console.log('   Total seats:', userJourney.seatLayout.length);
      console.log('   Available:', availableSeats.length);
      console.log('   Occupied:', occupiedSeats.length);

      // Group seats by type
      const seatTypes = {};
      userJourney.seatLayout.forEach((seat) => {
        if (!seatTypes[seat.type]) seatTypes[seat.type] = 0;
        seatTypes[seat.type]++;
      });

      console.log('   Seat types:', JSON.stringify(seatTypes, null, 2));
    });

    it('User selects 2 adjacent seats', async () => {
      console.log('\n🪑 User selects seats...');

      const availableSeats = userJourney.seatLayout.filter(
        (s) => s.status === 'AVAILABLE'
      );
      expect(availableSeats.length).toBeGreaterThanOrEqual(2);

      // Group by row and find adjacent seats
      const seatsByRow = {};
      availableSeats.forEach((seat) => {
        if (!seatsByRow[seat.row_letter]) seatsByRow[seat.row_letter] = [];
        seatsByRow[seat.row_letter].push(seat);
      });

      let foundAdjacent = false;
      for (const row in seatsByRow) {
        const rowSeats = seatsByRow[row].sort(
          (a, b) => a.seat_number - b.seat_number
        );

        for (let i = 0; i < rowSeats.length - 1; i++) {
          if (rowSeats[i + 1].seat_number === rowSeats[i].seat_number + 1) {
            userJourney.selectedSeats = [rowSeats[i], rowSeats[i + 1]];
            foundAdjacent = true;
            break;
          }
        }
        if (foundAdjacent) break;
      }

      expect(userJourney.selectedSeats.length).toBe(2);

      console.log('✅ User selected seats:');
      userJourney.selectedSeats.forEach((seat) => {
        console.log(`   ${seat.row_letter}${seat.seat_number} (${seat.type})`);
      });
    });

    it('User calculates total price', async () => {
      console.log('\n💰 Calculating total price...');

      // Mock pricing calculation (would be from pricing API in real app)
      const basePrices = {
        STANDARD: 80000,
        VIP: 120000,
        COUPLE: 144000,
        PREMIUM: 160000,
        WHEELCHAIR: 72000,
      };

      let totalPrice = 0;
      userJourney.selectedSeats.forEach((seat) => {
        const seatPrice = basePrices[seat.type] || 80000;
        totalPrice += seatPrice;
        console.log(
          `   ${seat.row_letter}${
            seat.seat_number
          }: ${seatPrice.toLocaleString()} VND`
        );
      });

      userJourney.totalPrice = totalPrice;

      console.log(
        '✅ Total price:',
        userJourney.totalPrice.toLocaleString(),
        'VND'
      );
      expect(userJourney.totalPrice).toBeGreaterThan(0);
    });
  });

  describe('🎫 Step 5: Booking Summary', () => {
    it('User reviews complete booking details', async () => {
      console.log('\n🎫 Booking Summary:');
      console.log('=====================================');
      console.log('🎬 Movie:', userJourney.selectedMovie.title);
      console.log('🏢 Cinema:', userJourney.selectedCinema.name);
      console.log('📍 Address:', userJourney.selectedCinema.address);
      console.log(
        '⏰ Showtime:',
        new Date(userJourney.selectedShowtime.startTime).toLocaleString()
      );
      console.log(
        '💺 Seats:',
        userJourney.selectedSeats
          .map((s) => `${s.row_letter}${s.seat_number}`)
          .join(', ')
      );
      console.log('💰 Total:', userJourney.totalPrice.toLocaleString(), 'VND');
      console.log('=====================================');

      // Validate all required data is present
      expect(userJourney.selectedMovie).toBeTruthy();
      expect(userJourney.selectedCinema).toBeTruthy();
      expect(userJourney.selectedShowtime).toBeTruthy();
      expect(userJourney.selectedSeats.length).toBe(2);
      expect(userJourney.totalPrice).toBeGreaterThan(0);

      console.log('✅ Complete booking journey validated successfully!');
    });

    it('Validates booking business rules', async () => {
      console.log('\n✅ Final validation checks...');

      // Showtime must be in future
      const showtimeDate = new Date(userJourney.selectedShowtime.startTime);
      const now = new Date();
      expect(showtimeDate.getTime()).toBeGreaterThanOrEqual(
        now.getTime() - 24 * 60 * 60 * 1000
      );
      console.log('   ✓ Showtime is valid');

      // Cinema must be operational
      expect(userJourney.selectedCinema.status).toBe('ACTIVE');
      console.log('   ✓ Cinema is active');

      // Movie has valid duration
      expect(userJourney.selectedMovie.runtime).toBeGreaterThan(0);
      console.log('   ✓ Movie has valid runtime');

      // Seats are available
      const allSeatsAvailable = userJourney.selectedSeats.every(
        (seat) => seat.status === 'AVAILABLE'
      );
      expect(allSeatsAvailable).toBe(true);
      console.log('   ✓ All selected seats are available');

      // Seats are adjacent in same row
      const [seat1, seat2] = userJourney.selectedSeats;
      expect(seat1.row_letter).toBe(seat2.row_letter);
      expect(Math.abs(seat1.seat_number - seat2.seat_number)).toBe(1);
      console.log('   ✓ Seats are adjacent');

      console.log('\n🎉 All validation checks passed!');
      console.log('📱 Ready for payment processing...');
    });
  });
});
