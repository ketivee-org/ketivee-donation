const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');
const bcrypt = require('bcrypt');

module.exports = (app) => {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: "http://localhost:3000/auth/google/callback",
            },
            async (accessToken, refreshToken, profile, done) => {
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
                            role: 'user', // Default role
                        });
                        await newUser.save();
                        return done(null, newUser);
                    }
                } catch (error) {
                    return done(error);
                }
            }
        )
    );

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

    app.use(passport.initialize());
    app.use(passport.session());
};
