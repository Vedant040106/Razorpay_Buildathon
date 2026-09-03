import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('GET /api/health', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  it('should return 200 OK with healthy status and metadata', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.system).toBe('RecoverAI Revenue Recovery Engine');
    expect(res.body.meta.requestId).toBeDefined();
  });
});
