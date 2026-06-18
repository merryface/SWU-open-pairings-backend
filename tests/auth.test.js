const request = require('supertest');
const { app } = require('./setup');

describe('Auth endpoints', () => {
  let adminToken;

  beforeAll(async () => {
    // Register merryface admin (no special_word required since approved with NULL)
    const registerRes = await request(app).post('/api/auth/register').send({
      username: 'merryface',
      password: 'test-password-123',
    });
    
    if (registerRes.status !== 201) {
      throw new Error(`Failed to register merryface: ${registerRes.body.message}`);
    }

    const loginRes = await request(app).post('/api/auth/login').send({
      username: 'merryface',
      password: 'test-password-123',
    });

    adminToken = loginRes.body.token;
  });

  describe('POST /api/auth/register', () => {
    test('allows registration with approved username and correct special_word', async () => {
      // First, approve a new admin
      await request(app)
        .post('/api/auth/admin/approve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'admin1',
          special_word: 'secret-word-1',
        });

      // Then register with that username
      const response = await request(app).post('/api/auth/register').send({
        username: 'admin1',
        password: 'password123',
        special_word: 'secret-word-1',
      });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({ username: 'admin1' });
    });

    test('rejects registration with incorrect special_word', async () => {
      // Approve a username
      await request(app)
        .post('/api/auth/admin/approve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'admin2',
          special_word: 'secret-word-2',
        });

      // Try to register with wrong special_word
      const response = await request(app).post('/api/auth/register').send({
        username: 'admin2',
        password: 'password123',
        special_word: 'wrong-word',
      });

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({ message: 'Incorrect special word' });
    });

    test('rejects registration with unapproved username', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'unapproved',
        password: 'password123',
        special_word: 'any-word',
      });

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({ message: 'Username is not approved for registration' });
    });

    test('rejects missing fields', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'admin1',
      });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        message: 'Username and password are required',
      });
    });
  });

  describe('POST /api/auth/login', () => {
    test('returns token for valid credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'merryface',
        password: 'test-password-123',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('expiresIn');
    });

    test('rejects invalid credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'merryface',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/admin/approve', () => {
    test('allows merryface to approve new usernames', async () => {
      const response = await request(app)
        .post('/api/auth/admin/approve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'newadmin',
          special_word: 'new-secret',
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({ username: 'newadmin' });
    });

    test('rejects approval from non-merryface user', async () => {
      // Register a different admin
      await request(app)
        .post('/api/auth/admin/approve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'other-admin',
          special_word: 'other-secret',
        });

      // Register other-admin
      await request(app).post('/api/auth/register').send({
        username: 'other-admin',
        password: 'other-password',
        special_word: 'other-secret',
      });

      const loginRes = await request(app).post('/api/auth/login').send({
        username: 'other-admin',
        password: 'other-password',
      });

      const otherToken = loginRes.body.token;

      const response = await request(app)
        .post('/api/auth/admin/approve')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          username: 'random',
          special_word: 'random-secret',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/auth/admin/approved-users', () => {
    test('allows merryface to view approved users', async () => {
      const response = await request(app)
        .get('/api/auth/admin/approved-users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some((u) => u.username === 'merryface')).toBe(true);
    });
  });

  describe('DELETE /api/auth/admin/approve/:username', () => {
    test('allows merryface to remove approved username', async () => {
      // Approve and then remove
      await request(app)
        .post('/api/auth/admin/approve')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'to-remove',
          special_word: 'remove-me',
        });

      const response = await request(app)
        .delete('/api/auth/admin/approve/to-remove')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ message: 'Approved admin removed' });
    });

    test('prevents removing merryface', async () => {
      const response = await request(app)
        .delete('/api/auth/admin/approve/merryface')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });
});
