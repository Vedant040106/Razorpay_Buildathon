import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../../src/app.js';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { Merchant } from '../../src/modules/auth/merchant.model.js';
import { User } from '../../src/modules/auth/user.model.js';

describe('Authentication & Authorization Lifecycle (Integration Tests)', () => {
  let app;
  let testMerchant;
  let testUser;

  beforeAll(async () => {
    await connectDatabase();
    app = createApp();

    testMerchant = await Merchant.create({
      merchantId: 'merch_auth_test',
      name: 'Auth Test Merchant',
      email: 'ops@authtest.local',
      currency: 'INR'
    });

    const passwordHash = await bcrypt.hash('password123', 10);
    testUser = await User.create({
      email: 'admin@recoverai.local',
      passwordHash,
      name: 'Test Administrator',
      role: 'ADMIN',
      merchantId: testMerchant._id
    });
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('1. Successful login returns 200, JWT token, user profile, and HTTP-only cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@recoverai.local',
        password: 'password123'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe('admin@recoverai.local');
    expect(res.body.data.user.role).toBe('ADMIN');
    expect(res.body.data.token).toBeDefined();

    // Verify Set-Cookie header contains token
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some(c => c.startsWith('token='))).toBe(true);
  });

  test('2. Login with incorrect password returns 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@recoverai.local',
        password: 'wrong_password_999'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  test('3. Login with non-existent email returns 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nobody@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('4. Accessing protected route (/api/auth/me) with Bearer token succeeds', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@recoverai.local', password: 'password123' });

    const token = loginRes.body.data.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe('admin@recoverai.local');
    expect(meRes.body.data.user.role).toBe('ADMIN');
  });

  test('5. Accessing protected route without authentication token returns 401', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('6. Accessing protected route with invalid/tampered token returns 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid_tampered_token_string');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('7. Logout clears authentication cookie', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.loggedOut).toBe(true);

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    // Cookie was expired/cleared
    expect(cookies.some(c => c.includes('token=;') || c.includes('Expires='))).toBe(true);
  });
});
