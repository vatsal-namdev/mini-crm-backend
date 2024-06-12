const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
  totalSpends: { type: Number, required: false },
  maxVisits: { type: Number, required: false },
  lastVisitMonths: { type: Number, required: false },
});

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  criteria: {
    type: [ruleSchema],
    required: true,
  },
  operator: { type: String, enum: ['AND', 'OR'], required: true },
  message: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  status: { type: String, default: 'pending' },
  audienceSize: { type: Number, default: 0 },
});

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;
