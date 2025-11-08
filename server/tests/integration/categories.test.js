jest.setTimeout(30000);

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const setupApp = require('../../server');
const Category = require('../../src/models/Category');
const { mockAuth, mockUserId } = require('./auth');

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  app = setupApp(mockAuth);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Category.deleteMany({});
});

describe('Category API Endpoints', () => {
  // --- CREATE CATEGORY ---
  describe('POST /api/categories', () => {
    it('should create a new category when authenticated', async () => {
      const newCategory = { name: 'Tech' };

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', 'Bearer FAKE_TOKEN')
        .send(newCategory);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.name).toBe(newCategory.name);
      expect(res.body.authorId).toBe(mockUserId);
    });

    it('should return 400 for missing category name', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', 'Bearer FAKE_TOKEN')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // --- GET ALL CATEGORIES ---
  describe('GET /api/categories', () => {
    it('should return all categories', async () => {
      await Category.create({ name: 'Health', authorId: mockUserId });
      await Category.create({ name: 'Finance', authorId: mockUserId });

      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', 'Bearer FAKE_TOKEN');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.categories)).toBeTruthy();
      expect(res.body.categories.length).toBe(2);
    });

    it('should create copies of system templates for a new user', async () => {
      // 1. Create a system template
      await Category.create({ name: 'System Default', authorId: 'system-template' });

      // 2. Make a request as a new user (who has no categories yet)
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', 'Bearer FAKE_TOKEN');

      expect(res.status).toBe(200);
      expect(res.body.categories.length).toBe(1);
      expect(res.body.categories[0].name).toBe('System Default');
      expect(res.body.categories[0].authorId).toBe(mockUserId); // Verify it's now owned by the user

      const userCategories = await Category.find({ authorId: mockUserId });
      expect(userCategories.length).toBe(1);
    });
  });

  // --- GET CATEGORY BY ID ---
  describe('GET /api/categories/:id', () => {
    it('should return a single category by its ID', async () => {
      // First, create a category for the user
      const category = await Category.create({ name: 'Science', authorId: mockUserId, description: 'Science category' });

      // Trigger the logic that might create system templates, ensuring our user context is established
      await request(app)
        .get('/api/categories')
        .set('Authorization', 'Bearer FAKE_TOKEN');

      const res = await request(app)
        .get(`/api/categories/${category._id}`)
        .set('Authorization', 'Bearer FAKE_TOKEN');

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Science');
    });

    it('should return 404 for a non-existent category ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/categories/${nonExistentId}`)
        .set('Authorization', 'Bearer FAKE_TOKEN');
      expect(res.status).toBe(404);
    });

    it('should return 404 when trying to access another user\'s category', async () => {
      // Create a category owned by a different user
      const otherUsersCategory = await Category.create({ name: 'Private', authorId: new mongoose.Types.ObjectId().toString() });
      const unauthenticatedApp = setupApp(null); // No auth middleware

      const res = await request(unauthenticatedApp).get(`/api/categories/${otherUsersCategory._id}`);

      // Expect 404 because an unauthenticated user cannot see a private category
      expect(res.status).toBe(404);
    });
  });

  // --- UPDATE CATEGORY ---
  describe('PUT /api/categories/:id', () => {
    it('should update a category', async () => {
      const category = await Category.create({ name: 'Original', authorId: mockUserId });
      const updates = { name: 'Updated' };

      const res = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', 'Bearer FAKE_TOKEN')
        .send(updates);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated');
    });

    it('should return 403 when trying to update another user\'s category', async () => {
      const otherUsersCategory = await Category.create({ name: 'Private', authorId: new mongoose.Types.ObjectId().toString() });
      const updates = { name: 'Forbidden Update' };

      const res = await request(app)
        .put(`/api/categories/${otherUsersCategory._id}`)
        .set('Authorization', 'Bearer FAKE_TOKEN')
        .send(updates);

      expect(res.status).toBe(403);
    });

    it('should create a new category copy when updating a system template', async () => {
      // Create a system template category
      const template = await Category.create({ name: 'Template', authorId: 'system-template' });
      const updates = { name: 'My Copy of Template' };

      const res = await request(app)
        .put(`/api/categories/${template._id}`)
        .set('Authorization', 'Bearer FAKE_TOKEN')
        .send(updates);

      expect(res.status).toBe(201); // 201 Created, because a new resource was made
      expect(res.body.name).toBe(updates.name);
      expect(res.body.authorId).toBe(mockUserId); // The new category is owned by the user
    });
  });

  // --- DELETE CATEGORY ---
  describe('DELETE /api/categories/:id', () => {
    it('should delete a category', async () => {
      const category = await Category.create({ name: 'To Be Deleted', authorId: mockUserId });

      const res = await request(app)
        .delete(`/api/categories/${category._id}`)
        .set('Authorization', 'Bearer FAKE_TOKEN');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Category deleted successfully');

      const deletedCategory = await Category.findById(category._id);
      expect(deletedCategory).toBeNull();
    });

    it('should return 404 when trying to delete a non-existent category', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const res = await request(app)
          .delete(`/api/categories/${nonExistentId}`)
          .set('Authorization', 'Bearer FAKE_TOKEN');
        expect(res.status).toBe(404);
    });

    it('should return 403 when trying to delete another user\'s category', async () => {
      const otherUsersCategory = await Category.create({ name: 'Private', authorId: new mongoose.Types.ObjectId().toString() });

      const res = await request(app)
        .delete(`/api/categories/${otherUsersCategory._id}`)
        .set('Authorization', 'Bearer FAKE_TOKEN');

      expect(res.status).toBe(403);
    });
  });
});