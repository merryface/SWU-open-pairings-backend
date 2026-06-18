const request = require('supertest');
const { app, resetTestDatabase, createTestPairing } = require('./setup');

describe('Pairings endpoints', () => {
  let adminToken;

  beforeAll(async () => {
    // Register merryface if not already registered
    try {
      await request(app).post('/api/auth/register').send({
        username: 'merryface',
        password: 'test-password-123',
      });
    } catch (err) {
      // May already exist
    }
    
    // Login as merryface
    const loginRes = await request(app).post('/api/auth/login').send({
      username: 'merryface',
      password: 'test-password-123',
    });
    const merryToken = loginRes.body.token;

    // Approve admin user
    await request(app)
      .post('/api/auth/admin/approve')
      .set('Authorization', `Bearer ${merryToken}`)
      .send({
        username: 'pairing-admin',
        special_word: 'admin-secret',
      });

    // Register pairing-admin
    await request(app).post('/api/auth/register').send({
      username: 'pairing-admin',
      password: 'password123',
      special_word: 'admin-secret',
    });

    const adminLoginRes = await request(app).post('/api/auth/login').send({
      username: 'pairing-admin',
      password: 'password123',
    });

    adminToken = adminLoginRes.body.token;
  });

  describe('GET /api/pairings (public)', () => {
    test('returns empty list initially', async () => {
      const response = await request(app).get('/api/pairings');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('returns only published pairings', async () => {
      const pairingData = createTestPairing();

      // Create published pairing
      await request(app)
        .post('/api/pairings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...pairingData, is_published: 1 });

      // Create unpublished pairing
      await request(app)
        .post('/api/pairings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...pairingData, name: 'Private Tournament', is_published: 0 });

      const response = await request(app).get('/api/pairings');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe('Round Robin Tournament');
    });
  });

  describe('GET /api/pairings/:id (public)', () => {
    test('returns published pairing', async () => {
      const pairingData = createTestPairing();
      const createRes = await request(app)
        .post('/api/pairings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(pairingData);

      const pairingId = createRes.body.id;
      const response = await request(app).get(`/api/pairings/${pairingId}`);
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(pairingId);
    });

    test('returns 404 for nonexistent pairing', async () => {
      const response = await request(app).get('/api/pairings/9999');
      expect(response.status).toBe(404);
    });

    test('returns 403 for unpublished pairing', async () => {
      const pairingData = createTestPairing();
      const createRes = await request(app)
        .post('/api/pairings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...pairingData, is_published: 0 });

      const pairingId = createRes.body.id;
      const response = await request(app).get(`/api/pairings/${pairingId}`);
      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/pairings (admin only)', () => {
    test('creates new pairing with auth', async () => {
      const pairingData = createTestPairing();
      const response = await request(app)
        .post('/api/pairings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(pairingData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(pairingData.name);
    });

    test('rejects request without auth', async () => {
      const pairingData = createTestPairing();
      const response = await request(app).post('/api/pairings').send(pairingData);

      expect(response.status).toBe(401);
    });

    test('rejects request with missing fields', async () => {
      const response = await request(app)
        .post('/api/pairings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ message: 'Name and rounds are required' });
    });
  });

  describe('PUT /api/pairings/:id (admin only)', () => {
    test('updates pairing with auth', async () => {
      const pairingData = createTestPairing();
      const createRes = await request(app)
        .post('/api/pairings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(pairingData);

      const pairingId = createRes.body.id;
      const response = await request(app)
        .put(`/api/pairings/${pairingId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Tournament' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Tournament');
    });

    test('rejects request without auth', async () => {
      const response = await request(app)
        .put('/api/pairings/1')
        .send({ name: 'Updated' });

      expect(response.status).toBe(401);
    });

    test('returns 404 for nonexistent pairing', async () => {
      const response = await request(app)
        .put('/api/pairings/9999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/pairings/:id (admin only)', () => {
    test('deletes pairing with auth', async () => {
      const pairingData = createTestPairing();
      const createRes = await request(app)
        .post('/api/pairings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(pairingData);

      const pairingId = createRes.body.id;
      const response = await request(app)
        .delete(`/api/pairings/${pairingId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ message: 'Pairing deleted' });
    });

    test('rejects request without auth', async () => {
      const response = await request(app).delete('/api/pairings/1');
      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/pairings/:id/publish (admin only)', () => {
    test('toggles publish status', async () => {
      const pairingData = createTestPairing();
      const createRes = await request(app)
        .post('/api/pairings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...pairingData, is_published: 0 });

      const pairingId = createRes.body.id;

      // Toggle to published
      const publishRes = await request(app)
        .patch(`/api/pairings/${pairingId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(publishRes.status).toBe(200);
      expect(publishRes.body.is_published).toBe(1);

      // Toggle back to unpublished
      const unpublishRes = await request(app)
        .patch(`/api/pairings/${pairingId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(unpublishRes.status).toBe(200);
      expect(unpublishRes.body.is_published).toBe(0);
    });
  });
});
