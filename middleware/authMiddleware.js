// middleware/authMiddleware.js

exports.isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next(); // User is authenticated, proceed to the next middleware or route handler
    }
    res.redirect('/login'); // User is not authenticated, redirect to login page
};
