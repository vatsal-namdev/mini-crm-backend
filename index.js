require('dotenv').config(); // Load environment variables at the top
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('./auth'); 

const Customer = require('./models/Customer');
const Order = require('./models/Order');
const Campaign = require('./models/Campaign');
const CommunicationLog = require('./models/CommunicationLog');
const apiRoutes = require('./routes/api'); // Import the api routes

const app = express();
app.use(bodyParser.json());
app.use(cors());

mongoose.connect('mongodb://localhost:27017/mini-crm', { useNewUrlParser: true, useUnifiedTopology: true });

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/api/google-client-id', (req, res) => {
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID });
});

// Authentication routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    console.log('auth')
    res.redirect('https://crm-frontend-beryl.vercel.app/aud');
  }
);

app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('http://localhost:3000'); 
  });
});

// Protect routes
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

app.get('/campaigns', ensureAuthenticated, async (req, res) => {
  try {
    const campaigns = await Campaign.find({}).sort({ createdAt: -1 });
    res.status(200).send(campaigns);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Use the api routes
app.use('/api', apiRoutes);

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});
