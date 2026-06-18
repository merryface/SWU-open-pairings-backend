require('dotenv').config();
const app = require('./app');
const { initializeDatabase } = require('./db/init');

const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || './pairings.db';

initializeDatabase(DATABASE_URL)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
