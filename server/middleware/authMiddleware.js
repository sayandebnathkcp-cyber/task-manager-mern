const jwt = require('jsonwebtoken');
const User = require('../models/user');

/**
 * Protect middleware — verifies the JWT Bearer token from the Authorization header.
 * If valid, attaches the user document (without password) to req.user.
 * Returns 401 if token is missing or invalid.
 */
const protect = async (req, res, next) => {
    const authorization = req.headers.authorization;

    if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    const token = authorization.slice('Bearer '.length).trim();
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'Not authorized, user no longer exists' });
        }

        req.user = user;
        return next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

module.exports = { protect };
