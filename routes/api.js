const express = require('express');
const router = express.Router();

// Import models
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Campaign = require('../models/Campaign');
const CommunicationLog = require('../models/CommunicationLog');

// Customer API: Ingest customer data
router.post('/customer', async (req, res) => {
  try {
    const customerData = req.body;
    const customer = new Customer(customerData);
    await customer.save();
    res.status(201).send(customer);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Order API: Ingest order data
router.post('/order', async (req, res) => {
  try {
    const orderData = req.body;
    const order = new Order(orderData);
    await order.save();
    res.status(201).send(order);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Campaign API: Check audience size
router.post('/check-audience', async (req, res) => {
  try {
    const { rules, operator } = req.body;

    // Build MongoDB query based on rules and operator
    let query = rules.map(rule => {
      let subQuery = {};
      if (rule.totalSpends) subQuery.totalSpends = { $gt: rule.totalSpends };
      if (rule.maxVisits) subQuery.maxVisits = { $eq: rule.maxVisits };
      if (rule.lastVisit) {
        const date = new Date();
        date.setMonth(date.getMonth() - rule.lastVisit);
        subQuery.lastVisit = { $lt: date };
      }
      return subQuery;
    });

    const mongoQuery = operator === 'AND' ? { $and: query } : { $or: query };

    const audienceSize = await Customer.countDocuments(mongoQuery);
    res.status(200).send({ size: audienceSize });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Campaign API: Create a new campaign
router.post('/campaigns', async (req, res) => {
  try {
    const { name, rules, operator, message, audienceSize } = req.body;

    // Calculate audience size if not provided
    let finalAudienceSize = audienceSize;
    if (finalAudienceSize === undefined) {
      let query = rules.map(rule => {
        let subQuery = {};
        if (rule.totalSpends) subQuery.totalSpends = { $gt: rule.totalSpends };
        if (rule.maxVisits) subQuery.maxVisits = { $eq: rule.maxVisits };
        if (rule.lastVisit) {
          const date = new Date();
          date.setMonth(date.getMonth() - rule.lastVisit);
          subQuery.lastVisit = { $lt: date };
        }
        return subQuery;
      });

      const mongoQuery = operator === 'AND' ? { $and: query } : { $or: query };
      finalAudienceSize = await Customer.countDocuments(mongoQuery);
    }

    const campaign = new Campaign({ name, criteria: rules, operator, message, audienceSize: finalAudienceSize });
    await campaign.save();
    res.status(201).send(campaign);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Campaign API: Get all campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await Campaign.find({}).sort({ createdAt: -1 });
    res.status(200).send(campaigns);
  } catch (error) {
    res.status(400).send(error);
  }
  console.log('requesting')
});

router.post('/send-campaign/:campaignId', async (req, res) => {
    try {
      const campaign = await Campaign.findById(req.params.campaignId);
      if (!campaign) {
        return res.status(404).send({ error: 'Campaign not found' });
      }
  
      // Update campaign status to "SENT"
      campaign.status = 'SENT';
      await campaign.save();
  
      // Enqueue the campaign sending task
      channel.sendToQueue('sendCampaignQueue', Buffer.from(JSON.stringify({ campaignId: campaign._id })));
  
      res.status(200).send({ message: 'Campaign enqueued for sending' });
    } catch (error) {
      res.status(400).send({ error: error.message });
    }
  });
  

// Endpoint to handle delivery receipt updates
router.post('/campaigns/:id/receipt', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).send({ error: 'Campaign not found' });
    }

    campaign.status = req.body.status;
    await campaign.save();

    // Update CommunicationLog status
    await CommunicationLog.updateMany(
      { campaignId: campaign._id },
      { $set: { status: req.body.status } }
    );

    res.status(200).send(campaign);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }

  console.log('sending cam')
});

module.exports = router;
