const fs = require('fs');
const path = require('path');
const File = require('../models/file'); // Import File model
const multer = require('multer');

//fileController.js
// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

// File upload route handler
async function uploadFiles(req, res) {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded.' });
        }

        const files = req.files.map(file => {
            return new File({
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                path: file.path,
            });
        });

        await File.insertMany(files);

        res.status(200).json({
            message: 'Files uploaded successfully!',
            files: files.map(file => ({
                id: file._id,
                originalName: file.originalName,
                mimeType: file.mimeType,
                size: file.size,
            })),
        });
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

// Route to get all files
async function getAllFiles(req, res) {
    try {
        const files = await File.find();
        res.status(200).json(files);
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

// Route to download a file by ID
async function downloadFile(req, res) {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).json({ message: 'File not found.' });

        res.download(file.path, file.originalName);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

module.exports = { uploadFiles, getAllFiles, downloadFile, upload };
