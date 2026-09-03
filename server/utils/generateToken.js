const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT token for a given user ID.
 * @param {string} id - The MongoDB user ID to encode in the token.
 * @returns {string} A signed JWT token string.
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

module.exports = generateToken;
