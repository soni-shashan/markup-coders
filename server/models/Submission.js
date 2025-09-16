const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
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
  submissionId: {
    type: String,
    required: true,
  },
  submissionNumber: {
    type: Number,
    default: 1
  },
  uniqueSubmissionId: {
    type: String,
    required: true,
    unique: true 
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
submissionSchema.index({ teamName: 1, submittedAt: -1 });
submissionSchema.index({ email: 1, submittedAt: -1 });
submissionSchema.index({ uniqueSubmissionId: 1 });

module.exports = mongoose.model('Submission', submissionSchema);