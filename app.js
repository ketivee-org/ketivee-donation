require('dotenv').config();
const os = require('os');
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const morgan = require('morgan');
const fs = require('fs');
const passport = require('passport');
const session = require('express-session');
const authConfig = require('./config/auth');
const authRoutes = require('./routes/authRoutes');
const fileController = require('./controllers/fileController');
const dbConnection = require('./config/db');
const Log = require('./models/log');

const app = express();
const port = process.env.PORT || 3000;

console.log('log model:', Log); // Debugging statement

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Middleware for JSON parsing and static file serving
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware to log requests
const logFilePath = path.join(__dirname, 'access.log');
const accessLogStream = fs.createWriteStream(logFilePath, { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev'));

// MongoDB connection

dbConnection();

// Configure session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Passport configuration
authConfig(passport);


// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

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

// Admin panel route with authentication check
app.get('/admin', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Forbidden');
    }
    res.render('admin');
});

// Admin console donation route
// Route to render the admin console
app.get('/adminconsoledonation', (req, res) => {
    // Read uploaded files
    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            console.error('Error reading uploads directory:', err);
            return res.status(500).send('Error reading uploaded files.');
        }

        // Debugging: Check if Log is defined
        console.log('Log model:', Log);

        // Fetch logs from MongoDB
        Log.find({})
            .then(logs => {
                // Collect system information
                const systemInfo = {
                    platform: os.platform(),
                    cpu: os.cpus(),
                    totalMemory: os.totalmem(),
                    freeMemory: os.freemem(),
                    uptime: os.uptime()
                };

                // Example data for donation collected and users logged in
                const donationCollected = 1500.75; // Replace with actual data
                const usersLoggedIn = 10; // Replace with actual data

                // Pass uploadedFiles, systemInfo, logs, donationCollected, and usersLoggedIn to the template
                res.render('adminconsoledonation', {
                    uploadedFiles: files,
                    systemInfo: systemInfo,
                    logs: logs,
                    donationCollected: donationCollected,
                    usersLoggedIn: usersLoggedIn
                });
            })
            .catch(err => {
                console.error('Error fetching logs from MongoDB:', err);
                res.status(500).send('Error fetching logs.');
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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});