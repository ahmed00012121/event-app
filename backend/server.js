const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const corsMiddleware = require('./middleware/cors');

// Route imports
const studentRoutes = require('./routes/student');
const adminRoutes = require('./routes/admin');
const eventRoutes = require('./routes/event');
const regRoutes = require('./routes/reg');
const feedbackRoutes = require('./routes/feedback');
const chatbotRoutes = require('./routes/chatbot');
const recommendRoutes = require('./routes/recommend');
const notificationRoutes = require('./routes/notification');
const profileUserRoutes = require('./routes/profileUser');
const manageUserRoutes = require('./routes/manageUser');

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(corsMiddleware);

// Test route
app.get('/api/test', (req, res) => res.send('Backend server is running!'));

// API routes
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reg', regRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/recommend', recommendRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/profile', profileUserRoutes);
app.use('/api/manage-users', manageUserRoutes);

// 🚀 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
