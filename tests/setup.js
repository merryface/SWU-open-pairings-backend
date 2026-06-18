require('dotenv').config();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

const request = require('supertest');
const app = require('../src/app');
const { initializeDatabase, getDb } = require('../src/db/init');

async function initializeTestDatabase() {
  await initializeDatabase(':memory:');
  // Bootstrap creates merryface approval entry with NULL special_word
}

async function resetTestDatabase() {
  const db = getDb();
  await db.exec(`
    DELETE FROM users WHERE username != 'merryface';
    DELETE FROM pairings;
  `);
}

function createTestPairing() {
  return {
    name: 'Round Robin Tournament',
    rounds: [
      { round: 1, matches: [{ home: 'A', away: 'B' }, { home: 'C', away: 'D' }] },
    ],
    winner_selections: [],
    is_published: 1,
  };
}

beforeAll(async () => {
  await initializeTestDatabase();
});

beforeEach(async () => {
  await resetTestDatabase();
});

afterAll(async () => {
  const db = getDb();
  if (db) {
    await db.close();
  }
});

module.exports = {
  app,
  resetTestDatabase,
  createTestPairing,
};
