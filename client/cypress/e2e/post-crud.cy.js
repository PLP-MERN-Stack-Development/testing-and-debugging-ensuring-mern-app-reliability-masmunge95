describe('Post CRUD Operations', () => {
  const mockCategory = {
    _id: 'mock_category_id_123',
    name: 'Tech',
    name: 'Technology', // Standardized category name
    authorId: 'user_mock_id_12345',
  };

  const existingPost = {
    _id: 'existing_post_id_456',
    title: 'Original Post Title',
    content: 'Original content here.',
    category: mockCategory._id,
    author: 'Test Editor', // Consistent with Clerk mock
    slug: 'original-post-title',
    status: 'draft',
    featuredImage: null,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    cy.login(); // Login as editor

    // Mock categories for the PostForm and CategoryManager
    cy.intercept('GET', '/api/categories', {
      statusCode: 200, // Correct status code for a successful GET request
      body: {
        categories: [mockCategory],
      },
    }).as('getCategories');

    // Mock fetching existing posts for the PostManager list
    cy.intercept('GET', '/api/posts?*', {
      statusCode: 200,
      body: {
        posts: [existingPost],
        totalPages: 1,
        currentPage: 1,
      },
    }).as('getPosts');

    // Visit the homepage, which will render the dashboard for an editor
    cy.visit('/');

    // Wait for the initial loading to complete.
    cy.contains('Loading...', { timeout: 10000 }).should('not.exist');

    // Wait for the dashboard to be ready
    cy.get('.space-y-8', { timeout: 10000 })
      .contains('h1', /welcome back/i).should('be.visible');

    // Ensure the existing post is visible before proceeding with CRUD operations
    cy.contains('h3', existingPost.title).should('be.visible');
  });

  it('should allow an editor to edit an existing post', () => {
    // Mock the update post API call
    cy.intercept('PUT', `/api/posts/${existingPost._id}`, {
      statusCode: 200,
      body: {
        ...existingPost,
        title: 'Updated Post Title',
        content: 'Updated content here.',
        status: 'published',
        tags: ['cypress', 'testing'],
      },
    }).as('updatePost');

    // Click the edit button for the existing post
    cy.get(`[data-post-id="${existingPost._id}"]`).contains('button', 'Edit').click();

    // Ensure the form is visible and fill updated details
    cy.get(`[data-post-id="${existingPost._id}"]`).find('input[name="title"]').should('be.visible');
    cy.wait(100);
    cy.get(`[data-post-id="${existingPost._id}"]`).find('input[name="title"]').clear().type('Updated Post Title');
    cy.get(`[data-post-id="${existingPost._id}"]`).find('textarea[name="content"]').should('be.visible');
    cy.wait(100);
    cy.get(`[data-post-id="${existingPost._id}"]`).find('textarea[name="content"]').clear().type('Updated content here.');
    cy.get(`[data-post-id="${existingPost._id}"]`).find('input[name="tags"]').should('be.visible');
    cy.wait(100);
    cy.get(`[data-post-id="${existingPost._id}"]`).find('input[name="tags"]').type('cypress, testing');
    cy.get(`[data-post-id="${existingPost._id}"]`).find('select[name="status"]').should('be.visible').select('published');

    // Click save
    cy.get(`[data-post-id="${existingPost._id}"]`).contains('button', 'Save').click();

    // Wait for the update API call
    cy.wait('@updatePost');

    // Assert that the UI reflects the updated post
    cy.contains('h3', 'Updated Post Title').should('be.visible');
    cy.get(`[data-post-id="${existingPost._id}"]`).contains('.text-xs.font-bold.uppercase', /published/i).should('be.visible');
  });

  it('should allow an editor to edit a post and add a new image', () => {
    // Mock the update post API call for a multipart/form-data request
    cy.intercept('PUT', `/api/posts/${existingPost._id}`, (req) => {
      req.reply({
        statusCode: 200,
        body: {
          ...existingPost,
          title: 'Updated Post With Image',
          featuredImage: '/uploads/new-test-image.jpg', // Mock the new image path
        },
      });
    }).as('updatePostWithImage');

    // Click the edit button for the existing post
    cy.get(`[data-post-id="${existingPost._id}"]`).contains('button', 'Edit').click();

    // Load a dummy image fixture
    cy.fixture('test-image.jpg', 'binary').then((fileContent) => {
      // Ensure the form is visible and fill updated details
      cy.get(`[data-post-id="${existingPost._id}"]`).find('input[name="title"]').should('be.visible');
      cy.wait(100);
      cy.get(`[data-post-id="${existingPost._id}"]`).find('input[name="title"]').clear().type('Updated Post With Image');

      // Attach the new image file
      cy.get(`[data-post-id="${existingPost._id}"]`).find('input[type="file"][name="featuredImage"]').selectFile({
        contents: Cypress.Buffer.from(fileContent, 'binary'),
        fileName: 'new-test-image.jpg',
        mimeType: 'image/jpeg',
        lastModified: Date.now(),
      });

      // Click save
      cy.get(`[data-post-id="${existingPost._id}"]`).contains('button', 'Save').click();

      // Wait for the update API call.
        // For multipart/form-data, Cypress's `request.body` might be an empty object.
        // We'll rely on the `Content-Type` header to confirm it's a file upload
        // and the UI assertion to confirm successful processing.
        cy.wait('@updatePostWithImage').its('request.headers')
          .should('have.property', 'content-type').and('include', 'multipart/form-data');

      // Assert that the UI reflects the updated post title
      cy.contains('h3', 'Updated Post With Image').should('be.visible');

      // Assert that the new image is displayed
      cy.get(`[data-post-id="${existingPost._id}"]`)
        .find(`img[alt="Updated Post With Image"]`)
        .should('be.visible')
        .and('have.attr', 'src')
        .and('include', '/uploads/new-test-image.jpg');
    });
  });

  it('should allow an editor to change post status to published', () => {
    // Mock the status update API call
    cy.intercept('PATCH', `/api/posts/${existingPost._id}/status`, {
      statusCode: 200,
      body: {
        ...existingPost,
        status: 'published',
      },
    }).as('updatePostStatus');

    // Click the publish button
    cy.get(`[data-post-id="${existingPost._id}"]`).contains('button', 'Publish').click();

    // Wait for the status update API call
    cy.wait('@updatePostStatus');

    // Assert that the UI reflects the new status
    cy.get(`[data-post-id="${existingPost._id}"]`).contains('.text-xs.font-bold.uppercase', /published/i).should('be.visible');
  });

  it('should allow an editor to change post status to archived', () => {
    // Mock the status update API call
    cy.intercept('PATCH', `/api/posts/${existingPost._id}/status`, {
      statusCode: 200,
      body: {
        ...existingPost,
        status: 'archived',
      },
    }).as('archivePostStatus');

    // Click the archive button
    cy.get(`[data-post-id="${existingPost._id}"]`).contains('button', 'Archive').click();

    // Wait for the status update API call
    cy.wait('@archivePostStatus');

    // Assert that the UI reflects the new status
    cy.get(`[data-post-id="${existingPost._id}"]`).contains('.text-xs.font-bold.uppercase', /archived/i).should('be.visible');
  });

  it('should allow an editor to delete a post', () => {
    // Mock the delete post API call
    cy.intercept('DELETE', `/api/posts/${existingPost._id}`, {
      statusCode: 200,
      body: { message: 'Post Deleted successfully, Bye' },
    }).as('deletePost');

    // Click the delete button
    cy.get(`[data-post-id="${existingPost._id}"]`).contains('button', 'Delete').click();

    // Confirm the deletion (if a confirmation dialog appears)
    // Assuming a simple window.confirm, Cypress handles it by default.
    // If it's a custom modal, you'd need to interact with its buttons.
    cy.on('window:confirm', (str) => {
      expect(str).to.equal('Are you sure you want to delete this post?');
      return true; // Click 'OK'
    });

    // Wait for the delete API call
    cy.wait('@deletePost');

    // Assert that the post is no longer visible in the UI
    cy.contains('h3', existingPost.title).should('not.exist');
  });
});