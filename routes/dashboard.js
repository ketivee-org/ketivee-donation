const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware'); // Adjust the path based on your project structure

// Dashboard route (protected)
router.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', { user: req.session.user });
});

// Other protected routes
router.get('/profile', isAuthenticated, (req, res) => {
    res.render('profile', { user: req.session.user });
});

module.exports = router;
