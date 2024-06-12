const amqp = require('amqplib');
const axios = require('axios');
const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
const CommunicationLog = require('../models/CommunicationLog');

mongoose.connect('mongodb://localhost:27017/mini-crm', { useNewUrlParser: true, useUnifiedTopology: true });

async function connectRabbitMQ() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();
  await channel.assertQueue('sendCampaignQueue');
  await channel.assertQueue('updateStatusQueue');

  channel.consume('sendCampaignQueue', async (msg) => {
    const { campaignId } = JSON.parse(msg.content.toString());
    const campaign = await Campaign.findById(campaignId);

    if (campaign) {
      // Simulate sending the campaign
      const communicationLog = new CommunicationLog({
        campaignId: campaign._id,
        status: 'PENDING',
      });
      await communicationLog.save();

      // Simulate calling the Delivery Receipt API
      await axios.post(`http://127.0.0.1:3001/api/campaigns/${campaign._id}/receipt`, {
        message: 'Your message here',
        operator: 'Operator name',
        status: Math.random() < 0.9 ? 'SENT' : 'FAILED',
      });

      channel.sendToQueue('updateStatusQueue', Buffer.from(JSON.stringify({ campaignId: campaign._id })));
    }

    channel.ack(msg);
  });

  channel.consume('updateStatusQueue', async (msg) => {
    const { campaignId } = JSON.parse(msg.content.toString());
    const campaign = await Campaign.findById(campaignId);

    if (campaign) {
      // Update CommunicationLog status
      await CommunicationLog.updateMany(
        { campaignId: campaign._id },
        { $set: { status: campaign.status } }
      );
    }

    channel.ack(msg);
  });
}

connectRabbitMQ();
