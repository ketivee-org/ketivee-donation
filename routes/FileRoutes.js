const express = require('express');
const { uploadFiles, getAllFiles, downloadFile, upload } = require('../controllers/fileController');
const router = express.Router();

// File upload route
router.post('/uploads', upload.array('files', 10), uploadFiles);

// File listing route
router.get('/files', getAllFiles);

// File download route
router.get('/files/:id', downloadFile);

module.exports = router;
