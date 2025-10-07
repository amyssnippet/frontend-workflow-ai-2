const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const multer = require('multer');
const dotenv = require('dotenv');
dotenv.config();

const sequelize = require('./db');
const authRoutes = require('./routes');
const chatRoutes = require('./routes/chat');
const flowchartRoutes = require('./routes/flowchartRoutes');
const { rateLimiter } = require('./middleware');
const { authenticate } = require('./middleware');

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/static', express.static(path.join(__dirname, 'static')));

// Rate limiting for all API routes
app.use('/api', rateLimiter(100, 15 * 60 * 1000));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// API routes
app.use('/api', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/flowcharts', flowchartRoutes);

// Error handling & 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Database and server start
(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected.');
    // For development
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('DB synced.');
    }
    const port = process.env.PORT || 8000;
    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (error) {
    console.error('Failed to initialize DB', error);
  }
})();
