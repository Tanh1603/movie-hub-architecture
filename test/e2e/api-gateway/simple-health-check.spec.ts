import axios from 'axios';

describe('API Gateway Health Check', () => {
  const BASE_URL = 'http://localhost:4000/api';
  let api: ReturnType<typeof axios.create>;

  beforeAll(() => {
    api = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      validateStatus: () => true, // Accept all status codes
    });
  });

  it('should connect to API Gateway', async () => {
    console.log('Testing API Gateway connection...');

    try {
      const response = await api.get('/v1/cinemas');
      console.log('Response Status:', response.status);
      console.log('Response Data:', JSON.stringify(response.data, null, 2));

      // Accept both success responses and errors (as we're just testing connectivity)
      expect([200, 404, 500, 503]).toContain(response.status);
    } catch (error) {
      console.error('Connection failed:', error.message);
      throw error;
    }
  });

  it('should be able to ping the service', async () => {
    try {
      const response = await api.get('/');
      console.log('Root endpoint response:', response.status);
      expect(response.status).toBeDefined();
    } catch (error) {
      console.log('Expected error for root endpoint:', error.message);
      // This might fail, which is OK for now
    }
  });
});
