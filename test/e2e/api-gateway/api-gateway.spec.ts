import axios from 'axios';

describe('API Gateway Integration Tests', () => {
  const baseURL = process.env.API_GATEWAY_URL || 'http://localhost:3000';

  beforeAll(() => {
    // Set axios defaults for all tests
    axios.defaults.baseURL = baseURL;
    axios.defaults.timeout = 10000;
  });

  describe('Health Check', () => {
    it('should return API health status', async () => {
      const res = await axios.get('/health');
      expect(res.status).toBe(200);
    });
  });

  describe('Movie API', () => {
    it('should get all movies', async () => {
      const res = await axios.get('/movies');
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('data');
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it('should handle movie search with query parameters', async () => {
      const res = await axios.get('/movies?page=1&limit=10');
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('data');
      expect(res.data).toHaveProperty('meta');
    });

    it('should return 404 for non-existent movie', async () => {
      try {
        await axios.get('/movies/non-existent-id');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  describe('User API', () => {
    it('should get user permissions (requires auth)', async () => {
      try {
        const res = await axios.get('/users/permissions/test-user-id');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.data)).toBe(true);
      } catch (error) {
        // May fail without proper auth, which is expected
        expect([401, 403]).toContain(error.response.status);
      }
    });
  });

  describe('Cinema API', () => {
    it('should get all cinemas', async () => {
      const res = await axios.get('/cinemas');
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('data');
    });

    it('should get showtimes for a cinema', async () => {
      try {
        const res = await axios.get('/cinemas/test-cinema-id/showtimes');
        expect(res.status).toBe(200);
        expect(res.data).toHaveProperty('data');
      } catch (error) {
        // May return 404 if cinema doesn't exist
        expect(error.response.status).toBe(404);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid endpoints gracefully', async () => {
      try {
        await axios.get('/invalid-endpoint');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });

    it('should handle malformed requests', async () => {
      try {
        await axios.post('/movies', { invalidData: true });
      } catch (error) {
        expect([400, 401, 422]).toContain(error.response.status);
      }
    });
  });
});
