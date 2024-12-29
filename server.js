require('dotenv').config();
const os = require('os');
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const morgan = require('morgan');
const fs = require('fs');
const passport = require('passport');
const dotenv = require('dotenv');
const session = require('express-session');
const authConfig = require('./config/auth');
const authRoutes = require('./routes/authRoutes');
const fileController = require('./controllers/fileController');
const User = require('./models/user');
const bodyParser = require('body-parser');
const File = require('./models/file');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const router = express.Router();

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Middleware for JSON parsing and static file serving
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Middleware to log requests
const logFilePath = path.join(__dirname, 'access.log');
const accessLogStream = fs.createWriteStream(logFilePath, { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev'));

// MongoDB connection
const Connection = require('./config/db')
dbConnection();
// Multer storage configuration for file uploads// Configure session
authConfig(app);

// Multer storage configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

// Routes for file upload, fetching, and downloading
app.post('/upload', upload.array('files', 10), fileController.uploadFiles);
app.get('/files', fileController.getAllFiles);
app.get('/files/:id', fileController.downloadFile);

// Authentication and user management routes
app.use('/', authRoutes);
app.use(passport.initialize());
app.use(passport.session());

app.get('/signup', (req, res) => {
    console.log(req.body)
    res.send('data recived')
})



// Admin panel route with authentication check
app.get('/admin', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Forbidden');
    }
    res.render('admin');
});



//admin login

app.get('/adminconsoledonation', (req, res) => {
    // Path to the directory containing uploaded files
    const uploadsDir = path.join(__dirname, 'uploads');
    
    // Read uploaded files (ensure the uploads directory exists)
    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            console.error('Error reading uploads directory:', err);
            return res.status(500).send('Error reading uploaded files.');
        }

        // Collect system information
        const systemInfo = {
            platform: os.platform(),
            cpu: os.cpus(),
            totalMemory: os.totalmem(),
            freeMemory: os.freemem()
        };

        // Pass both systemInfo and uploadedFiles to the template
        res.render('adminconsoledonation', {
            uploadedFiles: files, // Array of file names
            systemInfo: systemInfo // System information
        });
    });
});


// Additional routes for site content
app.get('/', (req, res) => res.render('index'));
app.get('/about', (req, res) => res.render('about'));
app.get('/donation', (req, res) => res.render('donation'));
app.get('/gallery', (req, res) => res.render('gallery'));
app.get('/privacy', (req, res) => res.render('privacy'));
app.get('/signup', (req, res) => res.render('signup'));
app.get('/login', (req, res) => res.render('login'));
app.get('/cookiepopups', (req, res) => res.render('cookiepopups'));

// Protected route example: dashboard
app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('dashboard', { user: req.session.user });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});