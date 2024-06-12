// models/order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerId: String,
  amount: Number,
  date: Date,
});

module.exports = mongoose.model('Order', orderSchema);
