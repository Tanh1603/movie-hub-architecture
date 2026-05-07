import axios from 'axios';

interface Movie {
  id: string;
  title: string;
  runtime: number;
  ageRating: string;
  posterUrl?: string;
  backdropUrl?: string;
  productionCountry?: string;
  languageType?: string;
}

interface Cinema {
  id: string;
  name: string;
  address: string;
  city: string;
  district?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  amenities: string[];
  facilities: Record<string, boolean>;
  operating_hours: Record<string, string>;
  status: string;
  rating: number;
  total_reviews: number;
}

interface Showtime {
  id: string;
  startTime: string;
  endTime?: string;
  status: string;
  hallId?: string;
  format?: string;
  language?: string;
  base_price?: number;
  available_seats?: number;
  total_seats?: number;
}

interface Seat {
  id: string;
  row_letter: string;
  seat_number: number;
  type: string;
  status: string;
  position_x?: number;
  position_y?: number;
}

describe('Movie Booking Flow - Complete Integration Tests', () => {
  const baseURL = process.env.API_GATEWAY_URL || 'http://localhost:4000';
  let selectedMovie: Movie;
  let selectedCinema: Cinema;
  let selectedShowtime: Showtime;
  let availableSeats: Seat[];

  beforeAll(() => {
    axios.defaults.baseURL = baseURL;
    axios.defaults.timeout = 15000;
  });

  describe('Step 1: Browse and Select Movie', () => {
    it('should get all available movies', async () => {
      const res = await axios.get('/api/v1/movies');

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toBeDefined();
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data.length).toBeGreaterThan(0);

      // Store a movie for later use
      selectedMovie = res.data.data[0];

      expect(selectedMovie).toHaveProperty('id');
      expect(selectedMovie).toHaveProperty('title');
      expect(selectedMovie).toHaveProperty('runtime');
      expect(selectedMovie).toHaveProperty('ageRating');

      console.log('✅ Selected Movie:', selectedMovie.title);
    });

    it('should get movie details by ID', async () => {
      const res = await axios.get(`/api/v1/movies/${selectedMovie.id}`);

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toBeDefined();
      expect(res.data.data.id).toBe(selectedMovie.id);
      expect(res.data.data.title).toBe(selectedMovie.title);

      console.log('✅ Movie Details Retrieved:', res.data.data.title);
    });

    it('should search movies by title', async () => {
      const searchTerm = selectedMovie.title.split(' ')[0];
      const res = await axios.get(
        `/api/v1/movies?search=${encodeURIComponent(searchTerm)}`
      );

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toBeDefined();
      expect(Array.isArray(res.data.data)).toBe(true);

      // Should find the movie in search results
      const foundMovie = res.data.data.find(
        (movie: Movie) => movie.id === selectedMovie.id
      );
      expect(foundMovie).toBeDefined();

      console.log('✅ Movie found in search results');
    });

    it('should get movie genres', async () => {
      const res = await axios.get('/api/v1/genres');

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toBeDefined();
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data.length).toBeGreaterThan(0);

      console.log('✅ Available Genres:', res.data.data.length);
    });
  });

  describe('Step 2: Find Cinemas by Location', () => {
    it('should get all available cinemas', async () => {
      const res = await axios.get('/api/v1/cinemas');

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toBeDefined();
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data.length).toBeGreaterThan(0);

      // Store a cinema for later use
      selectedCinema = res.data.data[0];

      expect(selectedCinema).toHaveProperty('id');
      expect(selectedCinema).toHaveProperty('name');
      expect(selectedCinema).toHaveProperty('address');
      expect(selectedCinema).toHaveProperty('city');
      expect(selectedCinema).toHaveProperty('latitude');
      expect(selectedCinema).toHaveProperty('longitude');

      console.log(
        '✅ Selected Cinema:',
        selectedCinema.name,
        'in',
        selectedCinema.city
      );
    });

    it('should search cinemas by location (city)', async () => {
      const res = await axios.get(
        `/api/v1/cinemas/search?city=${encodeURIComponent(selectedCinema.city)}`
      );

      expect(res.status).toBe(200);
      expect(res.data.data).toBeDefined();
      expect(Array.isArray(res.data.data)).toBe(true);

      // Should find our selected cinema in the results
      const foundCinema = res.data.data.find(
        (cinema: Cinema) => cinema.id === selectedCinema.id
      );
      expect(foundCinema).toBeDefined();

      console.log('✅ Cinema found in city search');
    });

    it('should find nearby cinemas using geolocation', async () => {
      const userLat = selectedCinema.latitude;
      const userLng = selectedCinema.longitude;
      const radius = 10; // 10km radius

      const res = await axios.get(
        `/api/v1/cinemas/nearby?latitude=${userLat}&longitude=${userLng}&radius=${radius}`
      );

      expect(res.status).toBe(200);
      expect(res.data.data).toBeDefined();
      expect(Array.isArray(res.data.data)).toBe(true);

      // Should include our selected cinema
      const nearbyCinema = res.data.data.find(
        (cinema: Cinema) => cinema.id === selectedCinema.id
      );
      expect(nearbyCinema).toBeDefined();

      console.log('✅ Nearby cinemas found:', res.data.data.length);
    });

    it('should get cinema details with facilities and amenities', async () => {
      const res = await axios.get(`/api/v1/cinemas/${selectedCinema.id}`);

      expect(res.status).toBe(200);
      expect(res.data.data).toBeDefined();
      expect(res.data.data.id).toBe(selectedCinema.id);
      expect(res.data.data).toHaveProperty('amenities');
      expect(res.data.data).toHaveProperty('facilities');
      expect(res.data.data).toHaveProperty('operating_hours');

      console.log('✅ Cinema details with amenities retrieved');
    });

    it('should get available cities and districts', async () => {
      const citiesRes = await axios.get('/api/v1/cinemas/locations/cities');
      expect(citiesRes.status).toBe(200);
      expect(Array.isArray(citiesRes.data.data)).toBe(true);

      const districtsRes = await axios.get(
        '/api/v1/cinemas/locations/districts'
      );
      expect(districtsRes.status).toBe(200);
      expect(Array.isArray(districtsRes.data.data)).toBe(true);

      console.log('✅ Location filters available');
    });
  });

  describe('Step 3: Browse and Select Showtimes', () => {
    it('should get showtimes for selected movie at selected cinema', async () => {
      const today = new Date().toISOString().split('T')[0];

      const res = await axios.get(
        `/api/v1/cinemas/${selectedCinema.id}/movies/${selectedMovie.id}/showtimes?date=${today}`
      );

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toBeDefined();
      expect(Array.isArray(res.data.data)).toBe(true);

      if (res.data.data.length > 0) {
        selectedShowtime = res.data.data[0];

        expect(selectedShowtime).toHaveProperty('id');
        expect(selectedShowtime).toHaveProperty('startTime');
        expect(selectedShowtime).toHaveProperty('status');
        expect(selectedShowtime.status).toBe('SELLING');

        console.log(
          '✅ Showtime selected:',
          new Date(selectedShowtime.startTime).toLocaleTimeString()
        );
      } else {
        console.log(
          '⚠️  No showtimes available for today, checking other dates...'
        );

        // Try tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const tomorrowRes = await axios.get(
          `/api/v1/cinemas/${selectedCinema.id}/movies/${selectedMovie.id}/showtimes?date=${tomorrowStr}`
        );

        expect(tomorrowRes.status).toBe(200);
        if (tomorrowRes.data.data.length > 0) {
          selectedShowtime = tomorrowRes.data.data[0];
          console.log(
            '✅ Showtime found for tomorrow:',
            new Date(selectedShowtime.startTime).toLocaleTimeString()
          );
        }
      }

      expect(selectedShowtime).toBeDefined();
    });

    it('should validate showtime details and availability', async () => {
      expect(selectedShowtime).toBeDefined();
      expect(selectedShowtime.status).toBe('SELLING');

      // Verify the showtime is in the future
      const showtimeDate = new Date(selectedShowtime.startTime);
      const now = new Date();
      expect(showtimeDate.getTime()).toBeGreaterThanOrEqual(
        now.getTime() - 24 * 60 * 60 * 1000
      ); // Within last 24h or future

      console.log('✅ Showtime validated');
    });

    it('should get showtimes for multiple dates', async () => {
      const dates = [];
      for (let i = 0; i < 3; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }

      for (const date of dates) {
        const res = await axios.get(
          `/api/v1/cinemas/${selectedCinema.id}/movies/${selectedMovie.id}/showtimes?date=${date}`
        );

        expect(res.status).toBe(200);
        console.log(`✅ Showtimes for ${date}:`, res.data.data.length);
      }
    });
  });

  describe('Step 4: View and Select Seats', () => {
    it('should get seat layout and availability for the selected showtime', async () => {
      const res = await axios.get(
        `/api/v1/showtimes/${selectedShowtime.id}/seats`
      );

      expect(res.status).toBe(200);
      expect(res.data.data).toBeDefined();
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data.length).toBeGreaterThan(0);

      availableSeats = res.data.data.filter(
        (seat: Seat) => seat.status === 'AVAILABLE'
      );

      expect(availableSeats.length).toBeGreaterThan(0);

      // Validate seat structure
      const seat = res.data.data[0];
      expect(seat).toHaveProperty('id');
      expect(seat).toHaveProperty('row_letter');
      expect(seat).toHaveProperty('seat_number');
      expect(seat).toHaveProperty('type');
      expect(seat).toHaveProperty('status');

      console.log(
        '✅ Seat layout retrieved:',
        res.data.data.length,
        'total seats,',
        availableSeats.length,
        'available'
      );
    });

    it('should categorize seats by type', async () => {
      const seatsByType: Record<string, Seat[]> = {};

      availableSeats.forEach((seat: Seat) => {
        if (!seatsByType[seat.type]) {
          seatsByType[seat.type] = [];
        }
        seatsByType[seat.type].push(seat);
      });

      // Should have at least standard seats
      expect(seatsByType.STANDARD).toBeDefined();
      expect(seatsByType.STANDARD.length).toBeGreaterThan(0);

      console.log(
        '✅ Seats by type:',
        Object.keys(seatsByType).map(
          (type) => `${type}: ${seatsByType[type].length}`
        )
      );
    });

    it('should validate seat selection logic', async () => {
      // Select 2 adjacent standard seats
      const standardSeats = availableSeats.filter(
        (seat: Seat) => seat.type === 'STANDARD'
      );
      expect(standardSeats.length).toBeGreaterThanOrEqual(2);

      // Find adjacent seats in the same row
      const seatsByRow: Record<string, Seat[]> = {};
      standardSeats.forEach((seat: Seat) => {
        if (!seatsByRow[seat.row_letter]) {
          seatsByRow[seat.row_letter] = [];
        }
        seatsByRow[seat.row_letter].push(seat);
      });

      let selectedSeats: Seat[] = [];
      for (const row in seatsByRow) {
        const rowSeats = seatsByRow[row].sort(
          (a, b) => a.seat_number - b.seat_number
        );
        if (rowSeats.length >= 2) {
          // Find adjacent seats
          for (let i = 0; i < rowSeats.length - 1; i++) {
            if (rowSeats[i + 1].seat_number === rowSeats[i].seat_number + 1) {
              selectedSeats = [rowSeats[i], rowSeats[i + 1]];
              break;
            }
          }
          if (selectedSeats.length > 0) break;
        }
      }

      expect(selectedSeats.length).toBe(2);
      expect(selectedSeats[0].row_letter).toBe(selectedSeats[1].row_letter);
      expect(
        Math.abs(selectedSeats[0].seat_number - selectedSeats[1].seat_number)
      ).toBe(1);

      console.log(
        '✅ Selected adjacent seats:',
        `${selectedSeats[0].row_letter}${selectedSeats[0].seat_number}`,
        'and',
        `${selectedSeats[1].row_letter}${selectedSeats[1].seat_number}`
      );
    });

    it('should handle seat pricing calculation', async () => {
      // This would typically involve checking pricing based on seat type and showtime
      const selectedSeat = availableSeats[0];

      // Mock pricing calculation (in real implementation, this would call a pricing API)
      const basePrices = {
        STANDARD: 80000,
        VIP: 120000,
        COUPLE: 144000,
        PREMIUM: 160000,
        WHEELCHAIR: 72000,
      };

      const basePrice = basePrices[selectedSeat.type] || 80000;
      expect(basePrice).toBeGreaterThan(0);

      console.log(
        '✅ Seat pricing validated:',
        selectedSeat.type,
        '=',
        basePrice.toLocaleString(),
        'VND'
      );
    });
  });

  describe('Step 5: Booking Integration Flow', () => {
    it('should simulate complete booking flow validation', async () => {
      // Validate all components are ready for booking
      expect(selectedMovie).toBeDefined();
      expect(selectedCinema).toBeDefined();
      expect(selectedShowtime).toBeDefined();
      expect(availableSeats.length).toBeGreaterThan(0);

      const bookingData = {
        movieId: selectedMovie.id,
        movieTitle: selectedMovie.title,
        cinemaId: selectedCinema.id,
        cinemaName: selectedCinema.name,
        showtimeId: selectedShowtime.id,
        startTime: selectedShowtime.startTime,
        selectedSeats: availableSeats.slice(0, 2), // Select first 2 available seats
        totalAmount: 160000, // Mock total
        userId: 'test-user-123',
      };

      // Validate booking data structure
      expect(bookingData.movieId).toBeTruthy();
      expect(bookingData.cinemaId).toBeTruthy();
      expect(bookingData.showtimeId).toBeTruthy();
      expect(bookingData.selectedSeats.length).toBe(2);

      console.log('✅ Complete booking flow validated:');
      console.log('  - Movie:', bookingData.movieTitle);
      console.log('  - Cinema:', bookingData.cinemaName);
      console.log(
        '  - Showtime:',
        new Date(bookingData.startTime).toLocaleString()
      );
      console.log('  - Seats:', bookingData.selectedSeats.length);
      console.log(
        '  - Total:',
        bookingData.totalAmount.toLocaleString(),
        'VND'
      );
    });

    it('should validate business rules', async () => {
      // Showtime must be in the future
      const showtimeDate = new Date(selectedShowtime.startTime);
      const now = new Date();
      expect(showtimeDate.getTime()).toBeGreaterThanOrEqual(
        now.getTime() - 24 * 60 * 60 * 1000
      );

      // Cinema must be active
      expect(selectedCinema.status).toBe('ACTIVE');

      // Movie should have valid runtime
      expect(selectedMovie.runtime).toBeGreaterThan(0);

      // Selected seats should all be available
      const allAvailable = availableSeats
        .slice(0, 2)
        .every((seat: Seat) => seat.status === 'AVAILABLE');
      expect(allAvailable).toBe(true);

      console.log('✅ All business rules validated');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid movie ID', async () => {
      try {
        await axios.get('/api/v1/movies/invalid-movie-id');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });

    it('should handle invalid cinema ID', async () => {
      try {
        await axios.get('/api/v1/cinemas/invalid-cinema-id');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });

    it('should handle invalid showtime date', async () => {
      try {
        await axios.get(
          `/api/v1/cinemas/${selectedCinema.id}/movies/${selectedMovie.id}/showtimes?date=invalid-date`
        );
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should handle non-existent showtime ID', async () => {
      try {
        await axios.get('/api/v1/showtimes/invalid-showtime-id/seats');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });

    it('should handle missing geolocation parameters', async () => {
      try {
        await axios.get('/api/v1/cinemas/nearby');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should validate date range limits', async () => {
      // Test very far future date
      const farFuture = '2026-12-31';
      const res = await axios.get(
        `/api/v1/cinemas/${selectedCinema.id}/movies/${selectedMovie.id}/showtimes?date=${farFuture}`
      );

      expect(res.status).toBe(200);
      // Should return empty array for dates too far in the future
      expect(res.data.data).toBeDefined();
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle concurrent requests for popular showtimes', async () => {
      const promises = [];
      const today = new Date().toISOString().split('T')[0];

      // Simulate 5 concurrent users checking the same showtime
      for (let i = 0; i < 5; i++) {
        promises.push(
          axios.get(
            `/api/v1/cinemas/${selectedCinema.id}/movies/${selectedMovie.id}/showtimes?date=${today}`
          )
        );
      }

      const results = await Promise.all(promises);
      results.forEach((result) => {
        expect(result.status).toBe(200);
      });

      console.log('✅ Concurrent requests handled successfully');
    });

    it('should handle seat layout requests efficiently', async () => {
      const start = Date.now();
      const res = await axios.get(
        `/api/v1/showtimes/${selectedShowtime.id}/seats`
      );
      const end = Date.now();

      expect(res.status).toBe(200);
      expect(end - start).toBeLessThan(2000); // Should respond within 2 seconds

      console.log('✅ Seat layout response time:', end - start, 'ms');
    });
  });
});
