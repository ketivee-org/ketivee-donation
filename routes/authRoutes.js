const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const User = require('../models/user');

dotenv.config();

const router = express.Router();

// Configure Passport with Google OAuth strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Find or create user in the database
        const user = await User.findOne({ googleId: profile.id });
        if (user) {
            return done(null, user);
        } else {
            const newUser = new User({
                googleId: profile.id,
                name: profile.displayName,
                email: profile.emails[0].value,
                role: 'user' // Default role
            });
            await newUser.save();
            return done(null, newUser);
        }
    } catch (error) {
        return done(error);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

// Set up Express session and Passport
router.use(session({
    secret: process.env.SESSION_SECRET || 'default-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, // Set to true in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));
router.use(passport.initialize());
router.use(passport.session());

// Route for initiating Google OAuth login
router.get('/auth/google', passport.authenticate('google', {
    scope: ['https://www.googleapis.com/auth/plus.login', 'email']
}));

// Login route
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.render('login', { error: 'All fields are required.' });
        }

        const user = await User.findOne({ username });

        if (!user) {
            return res.render('login', { error: 'Invalid username or password.' });
        }

        // Compare hashed passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login', { error: 'Invalid username or password.' });
        }

        // Create session
        req.session.user = { id: user._id, username: user.username, role: user.role };
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Internal server error');
    }
});

// Signup route
router.post('/signup', async (req, res) => {
    const { name, username, email, password, confirmPassword } = req.body;

    // Basic validation
    if (!name || !username || !email || !password || !confirmPassword) {
        return res.render('signup', { error: 'All fields are required.' });
    }

    if (password !== confirmPassword) {
        return res.render('signup', { error: 'Passwords do not match.' });
    }

    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.render('signup', { error: 'Username is already taken.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new User({ name, username, email, password: hashedPassword, role: 'user' });
        await newUser.save();

        res.redirect('/login'); // Redirect to login after successful signup
    } catch (error) {
        console.error(error);
        res.render('signup', { error: 'An error occurred. Please try again.' });
    }
});

// Callback route after Google OAuth login
router.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/dashboard'); // Redirect to a specific page
    }
);

// Logout route
router.get('/logout', (req, res) => {
    req.logout(err => {
        if (err) return next(err);
        res.redirect('/');
    });
});

module.exports = router;