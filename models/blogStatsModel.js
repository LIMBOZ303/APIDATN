const mongoose = require('mongoose');

const blogStatsSchema = new mongoose.Schema({
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  uniqueVisitors: {
    type: Number,
    default: 0
  },
  lastViewed: {
    type: Date,
    default: Date.now
  },
  dayStats: [{
    date: {
      type: Date,
      required: true
    },
    views: {
      type: Number,
      default: 0
    },
    uniqueVisitors: {
      type: Number,
      default: 0
    }
  }],
  visitorIps: [{
    type: String
  }]
}, { timestamps: true });

const BlogStats = mongoose.model('BlogStats', blogStatsSchema);

module.exports = BlogStats; 