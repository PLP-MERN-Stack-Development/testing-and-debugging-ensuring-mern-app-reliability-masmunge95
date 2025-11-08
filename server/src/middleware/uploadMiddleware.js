const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Define the upload directory path
const uploadDir = path.join(__dirname, '../../uploads');

// Ensure the upload directory exists
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDir);
    },
    filename(req, file, cb) {
        cb(null, `image-${Date.now()}${path.extname(file.originalname)}`);
    }
});

function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('image/');

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Images only!'));
    }
}

const upload = multer({ storage, fileFilter: (req, file, cb) => checkFileType(file, cb) });

// Export both the middleware and the check function for testing
module.exports = { upload, checkFileType };