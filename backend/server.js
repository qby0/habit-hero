require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const cron = require('node-cron');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const habitRoutes = require('./routes/habitRoutes');
const achievementRoutes = require('./routes/achievementRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const groupRoutes = require('./routes/groupRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');

// Import controller for generating daily challenges
const challengeController = require('./controllers/challengeController');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/leaderboards', leaderboardRoutes);

// Health check endpoint for Kubernetes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://mongodb-service:27017/habits-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

// Task scheduler for generating daily challenges
// Runs every day at 00:05
cron.schedule('5 0 * * *', async () => {
  console.log('Generating daily challenges...');
  await challengeController.generateDailyChallenges();
});

// Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 