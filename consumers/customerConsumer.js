// consumers/customerConsumer.js
const mongoose = require('mongoose');
const amqp = require('amqplib');
const Customer = require('../models/customer');

mongoose.connect('mongodb://localhost:27017/crm', { useNewUrlParser: true, useUnifiedTopology: true });

async function processCustomerData() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();
  await channel.consume('customerQueue', async (msg) => {
    const customer = JSON.parse(msg.content.toString());
    await Customer.create(customer);
    channel.ack(msg);
  });
}

processCustomerData();
