const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateRegistration, validateLogin } = require('../middleware/validationMiddleware');

// Route: POST /api/auth/register
// Description: Register a new user
router.post('/register', validateRegistration, registerUser);

// Route: POST /api/auth/login
// Description: Authenticate user & get token
router.post('/login', validateLogin, loginUser);

// Route: GET /api/auth/profile
// Description: Get current user's profile (Protected)
router.get('/profile', protect, getUserProfile);

module.exports = router;
