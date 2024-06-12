// consumers/orderConsumer.js
const mongoose = require('mongoose');
const amqp = require('amqplib');
const Order = require('../models/order');

mongoose.connect('mongodb://localhost:27017/crm', { useNewUrlParser: true, useUnifiedTopology: true });

async function processOrderData() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();
  await channel.consume('orderQueue', async (msg) => {
    const order = JSON.parse(msg.content.toString());
    await Order.create(order);
    channel.ack(msg);
  });
}

processOrderData();
