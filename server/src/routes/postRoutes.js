const express = require('express');
const publicRouter = express.Router();
const privateRouter = express.Router();
const { upload } = require('../middleware/uploadMiddleware');
const { validatePost } = require('../middleware/validationMiddleware');
const { requireRole } = require('../middleware/authMiddleware');
const {
    getAllPosts,
    getPostById,
    createPost,
    updatePost,
    updatePostStatus,
    deletePost,
    addComment,
    updateComment,
    deleteComment
} = require('../controllers/postController');

// --- Public Routes ---
publicRouter.route('/').get(getAllPosts);
publicRouter.route('/:id').get(getPostById);

// A new private route for fetching a single post when a user is authenticated.
privateRouter.route('/authenticated/:id').get(getPostById);

// --- Private (Authenticated) Routes ---
privateRouter.route('/').post(requireRole('editor'), upload.single('image'), validatePost, createPost);
// The PUT route now also uses multer to handle optional image uploads during an update.
privateRouter.route('/:id')
    .put(requireRole('editor'), upload.single('image'), validatePost, updatePost)
    .delete(requireRole('editor'), deletePost);

// A new route specifically for partial updates like changing status.
privateRouter.route('/:id/status').patch(requireRole('editor'), updatePostStatus);

// Comment routes
privateRouter.route('/:id/comments').post(requireRole(['viewer', 'editor']), addComment);
privateRouter.route('/:id/comments/:commentId').put(updateComment); // User-specific logic is in the controller
privateRouter.route('/:id/comments/:commentId').delete(deleteComment); // User-specific logic is in the controller

module.exports = { public: publicRouter, private: privateRouter };