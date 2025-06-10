const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User'); // Assuming you have a User model

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Use environment variable in production

const authenticationServices = {
    // Register new user
    async register(userData) {
        try {
            // Check if user already exists
            const existingUser = await User.findOne({ email: userData.email });
            if (existingUser) {
                throw new Error('User already exists');
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(userData.password, salt);

            // Create new user
            const user = new User({
                username: userData.username,
                email: userData.email,
                password: hashedPassword
            });

            // Save user
            const savedUser = await user.save();
            
            // Generate JWT token
            const token = jwt.sign({ id: savedUser._id }, JWT_SECRET, {
                expiresIn: '24h'
            });

            return { token, user: { id: savedUser._id, username: savedUser.username, email: savedUser.email } };
        } catch (error) {
            throw error;
        }
    },

    // Login user
    async login(email, password) {
        try {
            // Check if user exists
            const user = await User.findOne({ email });
            if (!user) {
                throw new Error('User not found');
            }

            // Validate password
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                throw new Error('Invalid password');
            }

            // Generate JWT token
            const token = jwt.sign({ id: user._id }, JWT_SECRET, {
                expiresIn: '24h'
            });

            return { token, user: { id: user._id, username: user.username, email: user.email } };
        } catch (error) {
            throw error;
        }
    },

    // Verify token
    verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }
};

module.exports = authenticationServices;