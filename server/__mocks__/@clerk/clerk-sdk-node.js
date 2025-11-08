// d:\PLP Academy\JULY 2025 COHORT\Module Assignments\Full Stack With MERN\Week 6 Assignment\testing-and-debugging-ensuring-mern-app-reliability-masmunge95\server\__mocks__\@clerk\clerk-sdk-node.js

// This is a manual mock for the Clerk SDK.
// Jest will automatically use this file instead of the actual module in all tests.

const clerkClient = {
  users: {
    getUser: jest.fn((userId) => {
      if (userId === 'user_359GZRn514AzpgRUxGgXnZ5qseT') { // CLERK_TEST_USER_ID (editor)
        return Promise.resolve({
          id: 'user_359GZRn514AzpgRUxGgXnZ5qseT',
          firstName: 'Test',
          lastName: 'Editor',
          username: 'testeditor',
        });
      } else if (userId === 'user_359dlTgkBcCUHk6TnpRaY1FXtbP') { // CLERK_TEST_VIEWER_ID
        return Promise.resolve({
          id: 'user_359dlTgkBcCUHk6TnpRaY1FXtbP',
          firstName: 'Test',
          lastName: 'Viewer',
          username: 'testviewer',
        });
      }
      // Fallback for any other userId
      return Promise.resolve({ id: userId, firstName: 'Unknown', lastName: 'User', username: 'unknown' });
    }),
    // Add a mock for updateUser to prevent errors in webhook tests
    updateUser: jest.fn((userId, data) => {
      return Promise.resolve({ id: userId, ...data });
    }),
  },
};

const ClerkExpressRequireAuth = () => (req, res, next) => next();

module.exports = { clerkClient, ClerkExpressRequireAuth };