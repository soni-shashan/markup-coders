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
  // Image assignment and timing fields for the "show image" feature
  assignedImage: {
    type: String,
    default: null,
    trim: true
  },
  // When the image was last shown to this team (Date)
  lastImageShownAt: {
    type: Date
  },
  // When the team last clicked the "More" button (Date) to request the image again
  lastButtonClickAt: {
    type: Date
  },
  // Whether the initial image (on first login) has already been shown
  firstImageShown: {
    type: Boolean,
    default: false
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