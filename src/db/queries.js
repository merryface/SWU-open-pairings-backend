const { getDb } = require('./init');

async function createUser(username, passwordHash) {
  const db = getDb();
  const result = await db.run(
    'INSERT INTO users (username, password_hash) VALUES (?, ?)',
    [username, passwordHash]
  );
  return { id: result.lastID, username };
}

async function findUserByUsername(username) {
  const db = getDb();
  return db.get('SELECT * FROM users WHERE username = ?', [username]);
}

async function findUserById(id) {
  const db = getDb();
  return db.get('SELECT * FROM users WHERE id = ?', [id]);
}

async function getUserCount() {
  const db = getDb();
  const row = await db.get('SELECT COUNT(*) as count FROM users');
  return row.count || 0;
}

async function findApprovedAdmin(username) {
  const db = getDb();
  return db.get('SELECT * FROM approved_admins WHERE username = ?', [username]);
}

async function createApprovedAdmin(username, specialWord) {
  const db = getDb();
  const result = await db.run(
    'INSERT INTO approved_admins (username, special_word) VALUES (?, ?)',
    [username, specialWord]
  );
  return { id: result.lastID, username };
}

async function deleteApprovedAdmin(username) {
  const db = getDb();
  const result = await db.run('DELETE FROM approved_admins WHERE username = ?', [username]);
  return result.changes > 0;
}

async function getAllApprovedAdmins() {
  const db = getDb();
  return db.all(
    'SELECT id, username, created_at FROM approved_admins ORDER BY created_at DESC'
  );
}

async function createPairing(name, rounds, winnerSelections, isPublished = 0) {
  const db = getDb();
  const result = await db.run(
    'INSERT INTO pairings (name, rounds, winner_selections, is_published) VALUES (?, ?, ?, ?)',
    [name, JSON.stringify(rounds), JSON.stringify(winnerSelections), isPublished]
  );
  return getPairing(result.lastID);
}

async function getPairing(id) {
  const db = getDb();
  return db.get('SELECT * FROM pairings WHERE id = ?', [id]);
}

async function getPublishedPairings() {
  const db = getDb();
  return db.all('SELECT * FROM pairings WHERE is_published = 1 ORDER BY created_at DESC');
}

async function getAllPairings() {
  const db = getDb();
  return db.all('SELECT * FROM pairings ORDER BY created_at DESC');
}

async function updatePairing(id, fields) {
  const db = getDb();
  const existing = await getPairing(id);
  if (!existing) {
    return null;
  }

  const updated = {
    name: fields.name ?? existing.name,
    rounds: fields.rounds ? JSON.stringify(fields.rounds) : existing.rounds,
    winner_selections: fields.winner_selections
      ? JSON.stringify(fields.winner_selections)
      : existing.winner_selections,
    is_published: fields.is_published ?? existing.is_published,
    played: fields.played ?? existing.played,
  };

  await db.run(
    `UPDATE pairings
     SET name = ?, rounds = ?, winner_selections = ?, is_published = ?, played = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [updated.name, updated.rounds, updated.winner_selections, updated.is_published, updated.played, id]
  );

  return getPairing(id);
}

async function deletePairing(id) {
  const db = getDb();
  const result = await db.run('DELETE FROM pairings WHERE id = ?', [id]);
  return result.changes > 0;
}

module.exports = {
  createUser,
  findUserByUsername,
  findUserById,
  getUserCount,
  findApprovedAdmin,
  createApprovedAdmin,
  deleteApprovedAdmin,
  getAllApprovedAdmins,
  createPairing,
  getPairing,
  getPublishedPairings,
  getAllPairings,
  updatePairing,
  deletePairing,
};
