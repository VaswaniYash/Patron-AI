require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 5500;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/crudapp')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }
});
UserSchema.index({ email: 1 }, { collation: { locale: 'en', strength: 2 } });
const User = mongoose.model('User', UserSchema);

// Chat Schema
const ChatSchema = new mongoose.Schema({
  userId: String,
  sender: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});
const Chat = mongoose.model('Chat', ChatSchema);

// Gemini Endpoint
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../login.html'));
});

// Signup
app.post('/AI/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email: email.toLowerCase(), password: hashedPassword });
    res.status(201).json({ success: true, message: 'User created' });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Login
app.post('/AI/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid password' });

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Chatbot API
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Invalid message format" });
    }

    const response = await axios.post(GEMINI_URL, {
      contents: [{ role: "user", parts: [{ text: message }] }]
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 
                 "I couldn't generate a response. Please try again.";
    res.json({ reply });
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    res.status(500).json({ error: "AI service unavailable", details: error.message });
  }
});

// Save Chat
app.post('/api/save-chat', async (req, res) => {
  const { userId, sender, message } = req.body;
  if (!userId || !sender || !message) return res.status(400).json({ error: "Missing fields" });
  await Chat.create({ userId, sender, message });
  res.json({ success: true });
});

// Load Chat History
app.get('/api/get-chats/:userId', async (req, res) => {
  const { userId } = req.params;
  const chats = await Chat.find({ userId }).sort({ timestamp: 1 });
  res.json(chats);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});