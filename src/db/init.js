const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

let db;

async function initializeDatabase(databaseUrl) {
  db = await open({
    filename: databaseUrl,
    driver: sqlite3.Database,
  });

  await db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS approved_admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      special_word TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pairings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rounds TEXT NOT NULL,
      winner_selections TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      is_published INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_approved_admins_username ON approved_admins(username);
    CREATE INDEX IF NOT EXISTS idx_pairings_published ON pairings(is_published);
  `);

  // Bootstrap merryface super admin
  await bootstrapMerryface();

  return db;
}

async function bootstrapMerryface() {
  const db = getDb();
  
  // Ensure merryface is in approved_admins with NULL special_word (no approval needed)
  const approved = await db.get('SELECT * FROM approved_admins WHERE username = ?', ['merryface']);
  if (!approved) {
    await db.run('INSERT INTO approved_admins (username, special_word) VALUES (?, ?)', [
      'merryface',
      null,
    ]);
  }
}

function getDb() {
  if (!db) {
    throw new Error('Database connection is not initialized.');
  }
  return db;
}

module.exports = {
  initializeDatabase,
  getDb,
};

module.exports = {
  initializeDatabase,
  getDb,
};
