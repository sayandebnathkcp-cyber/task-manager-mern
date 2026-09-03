const User = require('../models/user');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');

const normalizeEmail = (email) => email.trim().toLowerCase();

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        // 1. Extract data from the incoming request body
        const { name, email, password } = req.body;
        const normalizedName = typeof name === 'string' ? name.trim() : '';
        const normalizedEmail = typeof email === 'string' ? normalizeEmail(email) : '';

        // 2. Validation: Check if all fields are provided
        if (!normalizedName || !normalizedEmail || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // 3. Check if user already exists in the database
        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // 4. Secure the password: Generate a salt and hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 5. Create and save the new user in MongoDB
        const user = await User.create({
            name: normalizedName,
            email: normalizedEmail,
            password: hashedPassword // Save the scrambled password, NOT the plain one!
        });

        // 6. Send a success response with a JWT token
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            },
            token: generateToken(user._id)
        });

    } catch (error) {
        console.error('Registration Error:', error.message);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'User already exists with this email' });
        }
        res.status(500).json({ message: 'Server Error during registration' });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = typeof email === 'string' ? normalizeEmail(email) : '';

        // 1. Validation
        if (!normalizedEmail || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // 2. Find user by email
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // 3. Compare provided password with hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // 4. Send success response with JWT token
        res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            },
            token: generateToken(user._id)
        });

    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(500).json({ message: 'Server Error during login' });
    }
};

// @desc    Get current user's profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Profile Error:', error.message);
        res.status(500).json({ message: 'Server Error fetching profile' });
    }
};

module.exports = { registerUser, loginUser, getUserProfile };
