const mongoose = require('mongoose');

const tempCodeSchema = new mongoose.Schema({
    teamName: { type: String, required: true },
    studentId: { type: String, required: true },
    email: { type: String, required: true },
    htmlCode: { type: String, default: '' },
    cssCode: { type: String, default: '' },
    jsCode: { type: String, default: '' },
    projectStructure: { type: String, default: null }, // JSON string
    lastSaved: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
});

// Compound indexes for faster queries

module.exports = mongoose.model('TempCode', tempCodeSchema);