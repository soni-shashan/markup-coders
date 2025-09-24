const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    teamName: { type: String, required: true },
    studentId: { type: String, required: true },
    email: { type: String, required: true },
    htmlCode: { type: String, required: true },
    cssCode: { type: String, default: '' },
    jsCode: { type: String, default: '' },
    projectStructure: { type: String, default: null }, // JSON string
    submissionId: { type: String, required: true },
    submissionNumber: { type: Number, required: true },
    uniqueSubmissionId: { type: String, required: true, unique: true },
    submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Submission', submissionSchema);