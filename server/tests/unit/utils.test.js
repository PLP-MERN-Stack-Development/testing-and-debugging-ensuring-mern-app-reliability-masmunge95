const asyncHandler = require('../../src/utils/asyncHandler');
const slugify = require('../../src/utils/slugify');

describe('Utility Functions', () => {
  // --- Tests for slugify ---
  describe('slugify', () => {
    it('should convert a simple string to a slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('should handle strings with multiple spaces and mixed case', () => {
      expect(slugify('  Hello   World  ')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(slugify('Hello World!@#$%^&*()')).toBe('hello-world');
    });

    it('should replace multiple hyphens with a single one', () => {
      expect(slugify('A---Weird--String')).toBe('a-weird-string');
    });

    it('should trim hyphens from the start and end', () => {
      expect(slugify('-Hello World-')).toBe('hello-world');
    });

    it('should handle complex strings with underscores', () => {
      expect(slugify('  A-Weird---String with_special!chars  ')).toBe('a-weird-string-with_special-chars');
    });

    it('should return an empty string for an empty input', () => {
      expect(slugify('')).toBe('');
    });

    it('should handle strings with only special characters by returning an empty string', () => {
      expect(slugify('!@#$%^&*()')).toBe('');
    });
  });

  // --- Tests for asyncHandler ---
  describe('asyncHandler', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
      mockReq = {};
      mockRes = {};
      mockNext = jest.fn();
    });

    it('should call the wrapped function with req, res, and next', () => {
      const mockFn = jest.fn();
      const handler = asyncHandler(mockFn);
      handler(mockReq, mockRes, mockNext);
      expect(mockFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });

    it('should call next with the error if the wrapped async function rejects', async () => {
      const error = new Error('Something went wrong');
      const mockAsyncFn = jest.fn().mockRejectedValue(error);
      const handler = asyncHandler(mockAsyncFn);

      await handler(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should not call next with an error if the wrapped async function resolves', async () => {
      const mockAsyncFn = jest.fn().mockResolvedValue('Success');
      const handler = asyncHandler(mockAsyncFn);

      await handler(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });
  });
});