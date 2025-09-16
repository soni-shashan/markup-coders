const mongoose = require('mongoose');

const tempCodeSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: true
  },
  studentId: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  htmlCode: {
    type: String,
    default: ''
  },
  cssCode: {
    type: String,
    default: ''
  },
  jsCode: {
    type: String,
    default: ''
  },
  lastSaved: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Compound indexes for faster queries
tempCodeSchema.index({ teamName: 1, email: 1 });
tempCodeSchema.index({ email: 1, isActive: 1 });

module.exports = mongoose.model('TempCode', tempCodeSchema);