const express = require('express');
const publicRouter = express.Router();
const privateRouter = express.Router();
const { validateCategory } = require('../middleware/validationMiddleware');
const { requireRole } = require('../middleware/authMiddleware');
const {
    getAllCategories,
    createCategory,
    getCategoryById,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');

// --- Public Routes ---
// Public routes can still exist if you want unauthenticated users to see system templates
// We remove the routes from the public router to avoid conflicts.
// The private router will handle both authenticated and unauthenticated requests, with logic inside the controller.

// --- Private (Authenticated) Routes ---
privateRouter.route('/').get(getAllCategories).post(requireRole('editor'), validateCategory, createCategory);
privateRouter.route('/:id')
    .get(getCategoryById)
    .put(requireRole('editor'), validateCategory, updateCategory)
    .delete(requireRole('editor'), deleteCategory);

module.exports = { public: publicRouter, private: privateRouter };
