// We are unit testing the checkFileType function directly, so we don't need to mock multer or fs.
const { checkFileType } = require('../../src/middleware/uploadMiddleware');

describe('uploadMiddleware', () => {
  let mockCb;

  beforeEach(() => {
    mockCb = jest.fn();
  });

  it('should allow valid image file types (jpeg, png, gif)', () => {
    const file = { originalname: 'test.jpg', mimetype: 'image/jpeg' };
    checkFileType(file, mockCb);
    expect(mockCb).toHaveBeenCalledWith(null, true);

    file.originalname = 'test.png'; file.mimetype = 'image/png';
    checkFileType(file, mockCb);
    expect(mockCb).toHaveBeenCalledWith(null, true);
  });

  it('should reject invalid file types', () => {
    const file = { originalname: 'document.pdf', mimetype: 'application/pdf' };
    checkFileType(file, mockCb);
    expect(mockCb).toHaveBeenCalledWith(new Error('Images only!'));
  });
});