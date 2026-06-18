const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authRoutes = require('./routes/auth');
const pairingsRoutes = require('./routes/pairings');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/pairings', pairingsRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'SWU Open Pairings backend is running' });
});

app.use(errorHandler);

module.exports = app;
