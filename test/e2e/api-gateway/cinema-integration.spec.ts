import axios from 'axios';

describe('Cinema Service Integration Tests', () => {
  const baseURL = process.env.API_GATEWAY_URL || 'http://localhost:4000';

  beforeAll(() => {
    axios.defaults.baseURL = baseURL;
    axios.defaults.timeout = 15000;
  });

  describe('Cinema Location and Search', () => {
    let testCinema: any;

    it('should get all cinemas with proper structure', async () => {
      const res = await axios.get('/api/v1/cinemas');

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data.length).toBeGreaterThan(0);

      testCinema = res.data.data[0];
      expect(testCinema).toHaveProperty('id');
      expect(testCinema).toHaveProperty('name');
      expect(testCinema).toHaveProperty('latitude');
      expect(testCinema).toHaveProperty('longitude');

      console.log('✅ Found', res.data.data.length, 'cinemas');
    });

    it('should search cinemas by city', async () => {
      const res = await axios.get(`/api/v1/cinemas/search?city=Hồ Chí Minh`);

      expect(res.status).toBe(200);
      expect(res.data.data).toBeDefined();
      expect(Array.isArray(res.data.data)).toBe(true);

      console.log('✅ Found', res.data.data.length, 'cinemas in Ho Chi Minh');
    });

    it('should find nearby cinemas using geolocation', async () => {
      if (!testCinema) {
        throw new Error('No test cinema available');
      }

      const lat = testCinema.latitude;
      const lng = testCinema.longitude;

      const res = await axios.get(
        `/api/v1/cinemas/nearby?lat=${lat}&lon=${lng}&radius=5`
      );

      expect(res.status).toBe(200);
      expect(res.data.cinemas).toBeDefined();
      expect(Array.isArray(res.data.cinemas)).toBe(true);

      console.log('✅ Found', res.data.cinemas.length, 'nearby cinemas');
    });

    it('should get location filters', async () => {
      const citiesRes = await axios.get('/api/v1/cinemas/locations/cities');
      const districtsRes = await axios.get(
        '/api/v1/cinemas/locations/districts'
      );

      expect(citiesRes.status).toBe(200);
      expect(districtsRes.status).toBe(200);
      expect(Array.isArray(citiesRes.data.data)).toBe(true);
      expect(Array.isArray(districtsRes.data.data)).toBe(true);

      console.log('✅ Location filters available');
    });
  });

  describe('Showtimes Integration', () => {
    let testMovie: any;
    let testCinema: any;
    let testShowtime: any;

    beforeAll(async () => {
      // Get test data
      const [moviesRes, cinemasRes] = await Promise.all([
        axios.get('/api/v1/movies'),
        axios.get('/api/v1/cinemas'),
      ]);

      testMovie = moviesRes.data.data[0];
      testCinema = cinemasRes.data.data[0];

      expect(testMovie).toBeDefined();
      expect(testCinema).toBeDefined();
    });

    it('should get showtimes for movie at cinema', async () => {
      const today = new Date().toISOString().split('T')[0];

      const res = await axios.get(
        `/api/v1/cinemas/${testCinema.id}/movies/${testMovie.id}/showtimes?date=${today}`
      );

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toBeDefined();

      if (res.data.data.length > 0) {
        testShowtime = res.data.data[0];
        expect(testShowtime).toHaveProperty('id');
        expect(testShowtime).toHaveProperty('startTime');
        console.log('✅ Found showtime for today');
      } else {
        // Try tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const tomorrowRes = await axios.get(
          `/api/v1/cinemas/${testCinema.id}/movies/${testMovie.id}/showtimes?date=${tomorrowStr}`
        );

        expect(tomorrowRes.status).toBe(200);
        if (tomorrowRes.data.data.length > 0) {
          testShowtime = tomorrowRes.data.data[0];
          console.log('✅ Found showtime for tomorrow');
        }
      }
    });

    it('should get showtimes for multiple days', async () => {
      const promises = [];

      for (let i = 0; i < 3; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        promises.push(
          axios.get(
            `/api/v1/cinemas/${testCinema.id}/movies/${testMovie.id}/showtimes?date=${dateStr}`
          )
        );
      }

      const results = await Promise.all(promises);

      results.forEach((res) => {
        expect(res.status).toBe(200);
        expect(res.data.success).toBe(true);
      });

      console.log('✅ Checked showtimes for 3 days');
    });

    it('should get seat layout for showtime', async () => {
      if (!testShowtime) {
        console.log('⚠️  Skipping seat test - no showtime available');
        return;
      }

      const res = await axios.get(`/api/v1/showtimes/${testShowtime.id}/seats`);

      expect(res.status).toBe(200);
      expect(res.data.data).toBeDefined();
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data.length).toBeGreaterThan(0);

      const seat = res.data.data[0];
      expect(seat).toHaveProperty('id');
      expect(seat).toHaveProperty('row_letter');
      expect(seat).toHaveProperty('seat_number');
      expect(seat).toHaveProperty('type');
      expect(seat).toHaveProperty('status');

      const availableSeats = res.data.data.filter(
        (s) => s.status === 'AVAILABLE'
      );
      console.log(
        '✅ Seat layout:',
        res.data.data.length,
        'total,',
        availableSeats.length,
        'available'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid movie ID gracefully', async () => {
      try {
        await axios.get('/api/v1/movies/invalid-uuid');
        fail('Should have thrown error');
      } catch (error) {
        expect([400, 404]).toContain(error.response?.status);
      }
    });

    it('should handle invalid cinema ID gracefully', async () => {
      try {
        await axios.get('/api/v1/cinemas/invalid-uuid');
        fail('Should have thrown error');
      } catch (error) {
        expect([400, 404]).toContain(error.response?.status);
      }
    });

    it('should handle invalid showtime ID gracefully', async () => {
      try {
        await axios.get('/api/v1/showtimes/invalid-uuid/seats');
        fail('Should have thrown error');
      } catch (error) {
        expect([400, 404]).toContain(error.response?.status);
      }
    });

    it('should validate required parameters for nearby search', async () => {
      try {
        await axios.get('/api/v1/cinemas/nearby');
        fail('Should have thrown error');
      } catch (error) {
        expect(error.response?.status).toBe(400);
      }
    });

    it('should handle invalid date format', async () => {
      const moviesRes = await axios.get('/api/v1/movies');
      const cinemasRes = await axios.get('/api/v1/cinemas');
      const movie = moviesRes.data.data[0];
      const cinema = cinemasRes.data.data[0];

      try {
        await axios.get(
          `/api/v1/cinemas/${cinema.id}/movies/${movie.id}/showtimes?date=invalid-date`
        );
        fail('Should have thrown error');
      } catch (error) {
        expect(error.response?.status).toBe(400);
      }
    });
  });
});
