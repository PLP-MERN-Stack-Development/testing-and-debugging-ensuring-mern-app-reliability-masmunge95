// Mock express-validator's validationResult
jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
  body: jest.fn(() => ({
    not: jest.fn().mockReturnThis(),
    isEmpty: jest.fn().mockReturnThis(),
    withMessage: jest.fn().mockReturnThis(),
    trim: jest.fn().mockReturnThis(),
    escape: jest.fn().mockReturnThis(),
    isMongoId: jest.fn().mockReturnThis(),
    optional: jest.fn().mockReturnThis(),
    isIn: jest.fn().mockReturnThis(),
  })),
}));

// Now import the functions after the mock is set up
const { validationResult } = require('express-validator');
const { validateRequest } = require('../../src/middleware/validationMiddleware');

describe('validationMiddleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks(); // This will clear the mock implementations set by mockReturnValue
    validationResult.mockClear(); // Explicitly clear the mock for validationResult
  });

  it('should call next() if there are no validation errors', () => {
    validationResult.mockReturnValue({ isEmpty: () => true });
    validateRequest(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  it('should return 400 and errors if there are validation errors', () => {
    const errors = [{ msg: 'Title is required' }];
    validationResult.mockReturnValue({ isEmpty: () => false, array: () => errors });
    validateRequest(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ errors });
  });
});