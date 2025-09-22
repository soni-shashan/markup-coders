const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: true,
    trim: true
  },
  teamLeaderName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  googleId: {
    type: String,
    sparse: true
  },
  isAuthenticated: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  profilePicture: {
    type: String
  },
  isFirstTimeUser: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
teamSchema.index({ email: 1 });
teamSchema.index({ googleId: 1 });
teamSchema.index({ teamName: 1 });

module.exports = mongoose.model('Team', teamSchema);