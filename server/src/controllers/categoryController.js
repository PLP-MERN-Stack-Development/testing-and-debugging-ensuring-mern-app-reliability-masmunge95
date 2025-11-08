const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all categories
// @route   GET /api/categories
exports.getAllCategories = asyncHandler(async (req, res) => {
    const userId = req.auth?.userId;
    const isAuthenticating = !!req.headers.authorization;

    // If the user is not trying to authenticate (i.e., a public request), only return system templates.
    if (!userId || !isAuthenticating) {
        const publicCategories = await Category.find({ authorId: 'system-template' }).sort({ name: 1 });
        return res.json({ categories: publicCategories });
    }

    // --- Logic for logged-in editors ---

    // 1. Fetch all system-wide template categories. Let's define them by a special authorId.
    const templateCategories = await Category.find({ authorId: 'system-template' });

    // 2. Fetch all categories already owned by the current user.
    const userCategories = await Category.find({ authorId: userId });
    const userCategoryNames = new Set(userCategories.map(c => c.name));

    // 3. Identify which templates the user is missing and create copies for them.
    const missingTemplates = templateCategories.filter(template => !userCategoryNames.has(template.name));

    if (missingTemplates.length > 0) {
        const newCopies = missingTemplates.map(template => ({
            name: template.name,
            description: template.description,
            authorId: userId, // Assign ownership to the current user
        }));
        await Category.insertMany(newCopies);
    }

    // 4. Fetch the user's complete list of categories again, now including the new copies.
    const finalUserCategories = await Category.find({ authorId: userId }).sort({ name: 1 });

    res.json({ categories: finalUserCategories });
});

// @desc    Create a new category
// @route   POST /api/categories
exports.createCategory = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const category = new Category({
        name,
        description,
        authorId: req.auth.userId
    });
    const saved = await category.save();
    res.status(201).json(saved);
});

// @desc    Get category by id
// @route   GET /api/categories/:id
exports.getCategoryById = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        return res.status(404).json({ message: 'Category not found' });
    }

    // A public category or one owned by the user can be viewed.
    if (category.authorId !== 'system-template' && (!req.auth || category.authorId !== req.auth.userId)) {
        return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
});
// @desc    Update category by id
// @route   PUT /api/categories/:id
exports.updateCategory = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
        return res.status(404).json({ message: 'Category not found' });
    }

    // If the category is a system template, create a new copy for the user instead of updating the template.
    if (category.authorId === 'system-template') {
        const newCategory = new Category({
            name: name || category.name,
            description: description || category.description,
            authorId: req.auth.userId, // Assign ownership to the current user
        });
        const savedCategory = await newCategory.save();
        return res.status(201).json(savedCategory); // Return 201 to signify creation
    }

    // If it's not a template, perform a standard ownership check before updating.
    if (category.authorId !== req.auth.userId) {
        return res.status(403).json({ message: 'User not authorized to update this category' });
    }

    const updatedCategory = await Category.findByIdAndUpdate(req.params.id, { name, description }, { new: true });
    res.json(updatedCategory);
});

// @desc    Delete category by id
// @route   DELETE /api/categories/:id
exports.deleteCategory = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        return res.status(404).json({ message: 'Category not found' });
    }

    // Ownership check
    if (category.authorId !== req.auth.userId) {
        return res.status(403).json({ message: 'User not authorized to delete this category' });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted successfully' });
});