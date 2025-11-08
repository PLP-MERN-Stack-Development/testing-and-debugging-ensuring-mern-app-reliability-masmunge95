const mongoose = require('mongoose');

const mockUserId = new mongoose.Types.ObjectId().toString();

/**
 * Mocks the Clerk authentication middleware for testing purposes.
 * It injects a fake `req.auth` object into the request.
 */
const mockAuth = (req, res, next) => {
  req.auth = {
    userId: mockUserId,
    sessionClaims: {
      sub: mockUserId,
      metadata: {
        role: 'editor', 
      },
    },
  };
  next();
};

module.exports = { mockAuth, mockUserId };