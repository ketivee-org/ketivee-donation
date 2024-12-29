const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now },
});

const File = mongoose.model('File', fileSchema);

module.exports = File;
