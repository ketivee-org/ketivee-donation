const bcrypt = require('bcrypt');
const User = require('../models/user'); // Assuming you have a User model

// Signup function
exports.signup = async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    // Basic validation
    if (!username || !email || !password || !confirmPassword) {
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
        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });

        await newUser.save();
        res.redirect('/login'); // Redirect to login after successful signup
    } catch (error) {
        console.error('Error during signup:', error);
        res.render('signup', { error: 'An error occurred. Please try again later.' });
    }
};

// Login function
exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.render('login', { error: 'Both fields are required.' });
    }

    try {
        // Find the user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.render('login', { error: 'Invalid username or password.' });
        }

        // Compare the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login', { error: 'Invalid username or password.' });
        }

        // Log the user in (assuming you're using session management like Passport)
        req.session.user = user;
        res.redirect('/dashboard'); // Redirect to the dashboard after successful login
    } catch (error) {
        console.error('Error during login:', error);
        res.render('login', { error: 'An error occurred during login. Please try again later.' });
    }
};

// Logout function
exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error during logout:', err);
            return res.redirect('/dashboard'); // Redirect back to dashboard on error
        }
        res.clearCookie('connect.sid'); // Clear session cookie
        res.redirect('/'); // Redirect to the home page after logout
    });
};
