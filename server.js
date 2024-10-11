const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
require('dotenv').config({ path: './config.env' }); // Load environment variables from config.env

app.use(express.json());

// Configure CORS to allow requests from your Netlify domain
const corsOptions = {
  origin: ['http://localhost:3000', 'https://gymwatertracker.netlify.app'], // Correct domain
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.options('*', cors(corsOptions)); // Handle preflight across all routes

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error('MONGODB_URI is not defined. Please check your config.env file.');
}

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
  socketTimeoutMS: 45000, // Increase socket timeout to 45 seconds
});

const waterSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  amount: { type: Number, default: 0 },
  bottles: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now }
});

const Water = mongoose.model('Water', waterSchema, 'waters'); // Specify the collection name

app.post('/api/water', async (req, res) => {
  console.log('Received request to add water:', req.body); // Log request body
  const today = new Date().setHours(0, 0, 0, 0);
  let water = await Water.findOne({ date: today });
  if (!water) {
    water = new Water({ date: today, amount: 0, bottles: 0 });
  }
  water.amount += req.body.amount;
  water.bottles = Math.floor(water.amount / 750);
  water.timestamp = new Date();
  await water.save();
  console.log('Water data saved:', water); // Log saved data
  res.send(water);
});

app.post('/api/water/decrement', async (req, res) => {
  console.log('Received request to decrement water:', req.body); // Log request body
  const today = new Date().setHours(0, 0, 0, 0);
  let water = await Water.findOne({ date: today });
  if (!water) {
    water = new Water({ date: today, amount: 0, bottles: 0 });
  }
  water.amount = Math.max(0, water.amount - req.body.amount); // Ensure amount doesn't go below 0
  water.bottles = Math.floor(water.amount / 750);
  water.timestamp = new Date();
  await water.save();
  console.log('Water data saved:', water); // Log saved data
  res.send(water);
});

app.get('/api/water', async (req, res) => {
  const today = new Date().setHours(0, 0, 0, 0);
  const waterData = await Water.find({ date: { $gte: new Date(today - 6 * 24 * 60 * 60 * 1000) } });
  res.send(waterData);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});