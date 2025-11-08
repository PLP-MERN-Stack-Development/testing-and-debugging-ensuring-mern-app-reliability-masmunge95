const mongoose = require('mongoose');
const connectDB = require('../../src/config/db');
const logger = require('../../src/middleware/logger');
const process = require('process');

describe('Core Application Modules', () => {
  let consoleErrorSpy;
  let processExitSpy;

  beforeEach(() => {
    // Spy on console.error and process.exit to test error handling
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original implementations
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    jest.clearAllMocks();
  });

  // --- db.js tests ---
  describe('Database Connection', () => {
    it('should handle database connection errors gracefully', async () => {
      // Spy on mongoose.connect and mock its rejection
      const dbError = new Error('DB connection failed');
      const connectSpy = jest.spyOn(mongoose, 'connect').mockRejectedValue(dbError);

      await connectDB();

      expect(consoleErrorSpy).toHaveBeenCalledWith('MongoDB Connection Failed:', dbError.message);
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  // Restore all mocks after the tests in this suite have run.
  afterAll(() => jest.restoreAllMocks());

  // --- logger.js tests ---
  describe('Logger Middleware', () => {
    let consoleLogSpy;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
    });

    it('should log the request method and url', () => {
      const req = { method: 'GET', originalUrl: '/api/test' };
      const res = {};
      const next = jest.fn();

      logger(req, res, next);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('GET /api/test'));
      expect(next).toHaveBeenCalled();
    });
  });
});