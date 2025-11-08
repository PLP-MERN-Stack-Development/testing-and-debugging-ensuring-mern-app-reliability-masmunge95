// posts.test.js - Integration tests for posts API endpoints
jest.setTimeout(30000);

const request = require('supertest');
const mongoose = require('mongoose'); 
const { MongoMemoryServer } = require('mongodb-memory-server'); 
const setupApp = require('../../server');
const path = require('path');
const Post = require('../../src/models/Post'); // This path is correct
const Category = require('../../src/models/Category'); // Import Category model
const { mockAuth, mockUserId } = require('./auth');
const { clerkClient } = require('@clerk/clerk-sdk-node');

// Mock the clerk client since we don't want to make real API calls
jest.mock('@clerk/clerk-sdk-node', () => ({
  clerkClient: {
    users: {
      getUser: jest.fn(),
    },
  },
}));

let mongoServer;
let app;
let unauthenticatedApp;

// Helper to create a dummy image file for testing uploads
const createDummyFile = (filename = 'test-image.jpg') => path.join(__dirname, filename);

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
  // Clean up the database after each test to ensure isolation
  await Post.deleteMany({});
  jest.clearAllMocks();
});

describe('POST /api/posts', () => {
  it('should create a new post when authenticated', async () => {
    const newPost = {
      title: 'New Test Post',
      content: 'This is a new test post content',
      category: new mongoose.Types.ObjectId().toString(),
    };

    // Mock the clerk client call that happens when author is not provided
    clerkClient.users.getUser.mockResolvedValue({ firstName: 'Mock', lastName: 'User' });

    const res = await request(app)
      .post('/api/posts')
      .send(newPost);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toBe(newPost.title);
    expect(res.body.content).toBe(newPost.content);
    expect(res.body.authorId).toBe(mockUserId.toString());
  });

  it('should auto-generate author name from Clerk if not provided', async () => {
    const newPost = {
      title: 'Post with Auto Author',
      content: 'This is a new test post content',
      category: new mongoose.Types.ObjectId().toString(),
    };

    // Mock the clerk client to return a user
    clerkClient.users.getUser.mockResolvedValue({ firstName: 'Mock', lastName: 'User' });

    const res = await request(app)
      .post('/api/posts')
      .send(newPost);

    expect(res.status).toBe(201);
    expect(res.body.author).toBe('Mock User');
  });

  it('should return 401 if not authenticated', async () => {
    const newPost = {
      title: 'Unauthorized Post',
      content: 'This should not be created',
      category: new mongoose.Types.ObjectId().toString(),
    };

    const unauthenticatedApp = setupApp(null); // Create an app instance with no auth middleware

    const res = await request(unauthenticatedApp)
      .post('/api/posts')
      .send(newPost);
    expect(res.status).toBe(401);
  });

  it('should create a new post with a featured image when authenticated', async () => {
    const newPost = {
      title: 'Post with Image',
      content: 'This post has a featured image.',
      category: new mongoose.Types.ObjectId().toString(),
      status: 'published',
    };
    const imagePath = createDummyFile('upload-test.jpg');
    // Create a dummy file for upload
    require('fs').writeFileSync(imagePath, 'dummy image content');

    const res = await request(app)
      .post('/api/posts')
      .field('title', newPost.title)
      .field('content', newPost.content)
      .field('category', newPost.category)
      .field('status', newPost.status)
      .attach('image', imagePath); // 'image' is the field name expected by multer

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('featuredImage');
    expect(res.body.featuredImage).toMatch(/\/uploads\/image-\d+\.jpg$/);
  });
  it('should return 400 if validation fails', async () => {
    const invalidPost = {
      // Missing title
      content: 'This post is missing a title',
      category: new mongoose.Types.ObjectId().toString(),
    };

    const res = await request(app)
      .post('/api/posts')
      .send(invalidPost);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
});

describe('GET /api/posts', () => {
  it('should return all posts', async () => {
    await Post.create({
      title: 'Test Post',
      content: 'This is a test post content',
      authorId: mockUserId,
      category: new mongoose.Types.ObjectId(),
      slug: 'test-post',
      status: 'published',
    });

    const res = await request(app).get('/api/posts');

    expect(res.status).toBe(200); 
    expect(Array.isArray(res.body.posts)).toBeTruthy();
    expect(res.body.posts.length).toBeGreaterThan(0);
  });

  it('should return only published posts for unauthenticated users', async () => {
    await Post.create({ title: 'Published Post', content: '...', authorId: mockUserId, category: new mongoose.Types.ObjectId(), slug: 'published-post', status: 'published' });
    await Post.create({ title: 'Draft Post', content: '...', authorId: mockUserId, category: new mongoose.Types.ObjectId(), slug: 'draft-post', status: 'draft' });

    const unauthenticatedApp = setupApp(null);
    const res = await request(unauthenticatedApp).get('/api/posts');

    expect(res.status).toBe(200);
    expect(res.body.posts.length).toBe(1);
    expect(res.body.posts[0].status).toBe('published');
  });

  it('should return all posts by a specific author for authenticated users with authorId filter', async () => {
    await Post.create({ title: 'Author Published', content: '...', authorId: mockUserId, category: new mongoose.Types.ObjectId(), slug: 'author-published', status: 'published' });
    await Post.create({ title: 'Author Draft', content: '...', authorId: mockUserId, category: new mongoose.Types.ObjectId(), slug: 'author-draft', status: 'draft' });

    const res = await request(app).get(`/api/posts?authorId=${mockUserId}`);
    expect(res.status).toBe(200);
    expect(res.body.posts.length).toBe(2);
  });

  it('should filter posts by category', async () => {
    // Create a real category in the database for populate to work
    const category = await Category.create({ name: 'Test Category', authorId: mockUserId });

    // Create a post with specific category
    await Post.create({
      title: 'Filtered Post',
      content: 'This post should be filtered by category',
      authorId: mockUserId,
      category: category._id,
      slug: 'filtered-post',
      status: 'published',
    });

    const res = await request(app)
      .get(`/api/posts?category=${category._id}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.posts)).toBeTruthy();
    expect(res.body.posts.length).toBeGreaterThan(0);
    expect(res.body.posts[0].category._id.toString()).toBe(category._id.toString());
  });

  it('should paginate results', async () => {
    // Create multiple posts
    const posts = [];
    for (let i = 0; i < 15; i++) {
      posts.push({
        title: `Pagination Post ${i}`,
        content: `Content for pagination test ${i}`,
        authorId: mockUserId,
        category: new mongoose.Types.ObjectId(),
        slug: `pagination-post-${i}`,
        status: 'published',
      });
    }
    await Post.insertMany(posts);

    const page1 = await request(app)
      .get('/api/posts?page=1&limit=10');
    
    const page2 = await request(app)
      .get('/api/posts?page=2&limit=10');

    expect(page1.status).toBe(200);
    expect(page2.status).toBe(200);
    expect(page1.body.posts.length).toBe(10);
    expect(page2.body.posts.length).toBeGreaterThan(0);
    expect(page1.body.posts[0]._id).not.toBe(page2.body.posts[0]._id);
  });
});

describe('GET /api/posts/:id', () => {
  it('should return a post by ID', async () => {
    const post = await Post.create({
      title: 'Test Post by ID',
      content: 'This is a test post content',
      authorId: mockUserId,
      category: new mongoose.Types.ObjectId(),
      slug: 'test-post-by-id',
    });

    const res = await request(app)
      .get(`/api/posts/${post._id}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(post._id.toString());
    expect(res.body.title).toBe('Test Post by ID');
  });

  it('should return 404 for non-existent post', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/posts/${nonExistentId}`);

    expect(res.status).toBe(404);
  });

  it('should return 404 for an invalid post ID format (CastError)', async () => {
    const res = await request(app)
      .get(`/api/posts/invalid-id-format`);

    // This tests the CastError handling in our global errorHandler
    expect(res.status).toBe(404);
    expect(res.body.message).toContain('Resource not found');
  });
});

describe('PUT /api/posts/:id', () => {
  it('should update a post when authenticated as author', async () => {
    const post = await Post.create({
      title: 'Test Post to Update',
      content: 'This is a test post content',
      authorId: mockUserId,
      category: new mongoose.Types.ObjectId(),
      slug: 'test-post-to-update',
    });

    const updates = {
      title: 'Updated Test Post',
      content: 'This content has been updated',
      category: new mongoose.Types.ObjectId().toString(),
    };

    const res = await request(app)
      .put(`/api/posts/${post._id}`)
      .send(updates);

    expect(res.status).toBe(200);
    expect(res.body.title).toBe(updates.title);
    expect(res.body.content).toBe(updates.content);
  });

  it('should auto-generate tags from title if tags are cleared', async () => {
    const post = await Post.create({
      title: 'Initial Title',
      content: 'This post has tags',
      authorId: mockUserId,
      category: new mongoose.Types.ObjectId(),
      tags: ['initial', 'tags'],
    });

    const updates = {
      title: 'A New Title For Tags',
      content: post.content,
      category: post.category.toString(),
      tags: '', // Clear tags
    };

    const res = await request(app)
      .put(`/api/posts/${post._id}`)
      .send(updates);

    expect(res.status).toBe(200);
    expect(res.body.tags).toEqual(['new', 'title', 'for', 'tags']);
  });

  it('should update a post with a new featured image and delete the old one', async () => {
    const initialImagePath = createDummyFile('initial-image.jpg');
    require('fs').writeFileSync(initialImagePath, 'initial image content');

    // Create a real category in the database for the post to reference
    const category = await Category.create({ name: 'Test Category for Image Update', authorId: mockUserId });

    const post = await Post.create({
      title: 'Post with Old Image',
      content: 'This post has an initial image.',
      authorId: mockUserId,
      category: category._id, // Use the ID of the created category
      slug: 'post-with-old-image',
      featuredImage: `/uploads/initial-image.jpg`, // Simulate path after upload
    });

    const newImagePath = createDummyFile('new-image.png');
    require('fs').writeFileSync(newImagePath, 'new image content');

    const updates = {
      title: 'Updated Post with New Image',
      content: post.content, // Ensure content is always present for validation
      category: post.category.toString(), // This is now a valid existing category ID string
    };

    const res = await request(app)
      .put(`/api/posts/${post._id}`)
      .field('title', updates.title)
      .field('content', updates.content)
      .field('category', updates.category)
      .attach('image', newImagePath);

    expect(res.status).toBe(200);
    expect(res.body.title).toBe(updates.title);
    expect(res.body.featuredImage).toMatch(/\/uploads\/image-\d+\.png$/);
    // In a real scenario, you'd also check if initial-image.jpg was deleted from the mock filesystem.
  });

  it('should return 401 if not authenticated', async () => {
    const post = await Post.create({
      title: 'Test Post for 401 Update',
      content: 'This is a test post content',
      authorId: mockUserId,
      category: new mongoose.Types.ObjectId(),
      slug: 'test-post-401-update',
    });

    const updates = {
      title: 'Unauthorized Update',
      category: new mongoose.Types.ObjectId().toString(),
    };

    const unauthenticatedApp = setupApp(null); // Create an app instance with no auth middleware
    const res = await request(unauthenticatedApp)
      .put(`/api/posts/${post._id}`)
      .send(updates);
    expect(res.status).toBe(401);
  });

  it('should return 403 if not the author', async () => {
    const post = await Post.create({
      title: 'Test Post for 403 Update',
      content: 'This is a test post content',
      authorId: 'another_user_id',
      category: new mongoose.Types.ObjectId(),
      slug: 'test-post-403-update',
    });

    const updates = {
      title: 'Forbidden Update',
      category: new mongoose.Types.ObjectId().toString(),
    };
    const res = await request(app)
      .put(`/api/posts/${post._id}`)
      .send(updates);

    expect(res.status).toBe(403);
  });

  it('should return 404 for an invalid post ID format on update (CastError)', async () => {
    const updates = {
      title: 'This will fail',
      content: 'Because of the invalid ID',
      category: new mongoose.Types.ObjectId().toString(),
    };
    const res = await request(app)
      .put('/api/posts/invalid-id-format')
      .send(updates);
    // This tests the CastError handling in our global errorHandler
    expect(res.status).toBe(404);
    expect(res.body.message).toContain('Resource not found');
  });
});

describe('PATCH /api/posts/:id/status', () => {
  it('should update a post status when authenticated as author', async () => {
    const post = await Post.create({
      title: 'Post to Change Status',
      content: 'This post will have its status updated.',
      authorId: mockUserId,
      category: new mongoose.Types.ObjectId(),
      slug: 'post-to-change-status',
      status: 'draft',
    });

    const res = await request(app)
      .patch(`/api/posts/${post._id}/status`)
      .send({ status: 'published' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('published');
    const updatedPost = await Post.findById(post._id);
    expect(updatedPost.status).toBe('published');
  });

  it('should return 403 if not the author trying to update status', async () => {
    const post = await Post.create({
      title: 'Post for 403 Status Update',
      content: 'This post belongs to another user.',
      authorId: 'another_user_id',
      category: new mongoose.Types.ObjectId(),
      slug: 'post-403-status-update',
      status: 'draft',
    });

    const res = await request(app)
      .patch(`/api/posts/${post._id}/status`)
      .send({ status: 'published' });

    expect(res.status).toBe(403);
  });

  it('should return 400 for an invalid status value', async () => {
    const post = await Post.create({
      title: 'Post for Invalid Status',
      content: 'This post will attempt an invalid status update.',
      authorId: mockUserId,
      category: new mongoose.Types.ObjectId(),
      slug: 'post-for-invalid-status',
      status: 'draft',
    });

    const res = await request(app)
      .patch(`/api/posts/${post._id}/status`)
      .send({ status: 'invalid-status' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Invalid status value.');
    const originalPost = await Post.findById(post._id);
    expect(originalPost.status).toBe('draft'); // Status should not have changed
  });
});


describe('DELETE /api/posts/:id', () => {
  it('should delete a post when authenticated as author', async () => {
    const post = await Post.create({
      title: 'Test Post to Delete',
      content: 'This is a test post content',
      authorId: mockUserId,
      category: new mongoose.Types.ObjectId(),
      slug: 'test-post-to-delete',
    });

    const res = await request(app)
      .delete(`/api/posts/${post._id}`)

    expect(res.status).toBe(200);
    
    // Verify post is deleted
    const deletedPost = await Post.findById(post._id);
    expect(deletedPost).toBeNull();
  });

  it('should return 401 if not authenticated', async () => {
    const post = await Post.create({
      title: 'Test Post for 401 Delete',
      content: 'This is a test post content',
      authorId: mockUserId,
      category: new mongoose.Types.ObjectId(),
      slug: 'test-post-401-delete',
    });

    const unauthenticatedApp = setupApp(null); // Create an app instance with no auth middleware
    const resUnauthenticated = await request(unauthenticatedApp).delete(`/api/posts/${post._id}`);
    expect(resUnauthenticated.status).toBe(401);
  });

  it('should return 403 if not the author', async () => {
    const post = await Post.create({
      title: 'Test Post for 403 Delete',
      content: 'This is a test post content',
      authorId: 'another_user_id', // Different author
      category: new mongoose.Types.ObjectId(),
      slug: 'test-post-403-delete',
    });

    const res = await request(app)
      .delete(`/api/posts/${post._id}`);

    expect(res.status).toBe(403);
  });
});

describe('Comments Endpoints', () => {
  let post;
  let commentId;

  beforeEach(async () => {
    // Create a post for comments
    post = await Post.create({
      title: 'Post for Comments',
      content: 'Content for comments.',
      authorId: mockUserId,
      category: new mongoose.Types.ObjectId(),
      slug: 'post-for-comments',
      status: 'published',
    });
  });

  it('should add a comment to a post when authenticated', async () => {
    const commentContent = 'This is a new comment.';
    const res = await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .send({ content: commentContent });

    expect(res.status).toBe(201);
    expect(res.body.comments.length).toBe(1);
    expect(res.body.comments[0].content).toBe(commentContent);
    expect(res.body.comments[0].userId).toBe(mockUserId);

    const updatedPost = await Post.findById(post._id);
    expect(updatedPost.comments.length).toBe(1);
    expect(updatedPost.comments[0].content).toBe(commentContent);
    commentId = updatedPost.comments[0]._id; // Store for later tests
  });

  it('should return 404 when adding a comment to a non-existent post', async () => {
    const nonExistentPostId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/posts/${nonExistentPostId}/comments`)
      .send({ content: 'This should fail.' });

    expect(res.status).toBe(404);
  });

  it('should update a comment when authenticated as the author', async () => {
    // First, add a comment
    const addRes = await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .send({ content: 'Original comment content.' });
    const addedCommentId = addRes.body.comments[0]._id;

    const updatedContent = 'This comment has been updated.';
    const res = await request(app)
      .put(`/api/posts/${post._id}/comments/${addedCommentId}`)
      .send({ content: updatedContent });

    expect(res.status).toBe(200);
    const updatedComment = res.body.comments.find(c => c._id.toString() === addedCommentId.toString());
    expect(updatedComment.content).toBe(updatedContent);

    const postAfterUpdate = await Post.findById(post._id);
    const dbComment = postAfterUpdate.comments.id(addedCommentId);
    expect(dbComment.content).toBe(updatedContent);
  });

  it('should return 404 when updating a non-existent comment', async () => {
    // First, add a comment so the post has one
    await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .send({ content: 'An existing comment.' });

    const nonExistentCommentId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/posts/${post._id}/comments/${nonExistentCommentId}`)
      .send({ content: 'This should fail.' });

    expect(res.status).toBe(404);
  });

  it('should return 403 if not the author trying to update a comment', async () => {
    // First, add a comment by mockUserId
    const addRes = await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .send({ content: 'Comment by mockUserId.' });
    const addedCommentId = addRes.body.comments[0]._id;

    // Now, try to update it as a different user
    const unauthenticatedApp = setupApp((req, res, next) => {
      req.auth = { userId: 'another_user_id' };
      next();
    });

    const res = await request(unauthenticatedApp)
      .put(`/api/posts/${post._id}/comments/${addedCommentId}`)
      .send({ content: 'Attempted unauthorized update.' });

    expect(res.status).toBe(403);
  });

  it('should delete a comment when authenticated as the author', async () => {
    // First, add a comment
    const addRes = await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .send({ content: 'Comment to be deleted.' });
    const addedCommentId = addRes.body.comments[0]._id;

    const res = await request(app)
      .delete(`/api/posts/${post._id}/comments/${addedCommentId}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Comment removed');

    const updatedPost = await Post.findById(post._id);
    expect(updatedPost.comments.length).toBe(0);
  });

  it('should return 403 if not the author trying to delete a comment', async () => {
    // First, add a comment by mockUserId
    const addRes = await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .send({ content: 'Comment by mockUserId.' });
    const addedCommentId = addRes.body.comments[0]._id;

    // Now, try to delete it as a different user
    const otherUserApp = setupApp((req, res, next) => {
      req.auth = { userId: 'another_user_id' };
      next();
    });

    const res = await request(otherUserApp)
      .delete(`/api/posts/${post._id}/comments/${addedCommentId}`);

    expect(res.status).toBe(403);
  });
});