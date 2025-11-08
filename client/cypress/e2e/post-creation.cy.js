describe('Post Creation', () => {
  const mockCategory = {
    _id: 'mock_category_id_123',
    name: 'Tech',
    name: 'Technology', // Standardized category name
    authorId: 'user_mock_id_12345',
  };
  beforeEach(() => {
    // Log in as an editor before each test
    cy.login();

    // Mock categories for the PostForm and CategoryManager
    cy.intercept('GET', '/api/categories', {
      statusCode: 200,
      body: {
        categories: [mockCategory],
      },
    }).as('getCategories');

    // Visit the homepage, which will render the dashboard for an editor
    cy.visit('/');

    // Wait for the initial loading to complete, which is more reliable.
    cy.contains('Loading...', { timeout: 10000 }).should('not.exist');

    // Wait for the dashboard to be ready
    cy.get('.space-y-8', { timeout: 10000 })
      .contains('h1', /welcome back/i).should('be.visible');
  });

  it('should allow an editor to create a new post without an image', () => {
    // Intercept the API call for creating a post to mock the response
    cy.intercept('POST', '/api/posts', {
      statusCode: 201,
      body: {
        _id: 'new_post_id_123',
        title: 'My New Test Post',
        content: 'This is the content of the new post.',
        category: mockCategory._id,
        author: 'Test Editor', // Consistent with Clerk mock
        slug: 'my-new-test-post',
        status: 'draft',
      },
    }).as('createPost');

    // Fill out the new post form
    // Use name attributes for more robust selectors, based on PostForm.jsx
    cy.get('input[name="title"]').should('be.visible');
    cy.wait(100); // Wait for potential re-renders
    cy.get('input[name="title"]').type('My New Test Post');
    cy.get('textarea[name="content"]').should('be.visible');
    cy.wait(100); // Wait for potential re-renders
    cy.get('textarea[name="content"]').type('This is the content of the new post.');

    // The category is a required field in the form. We need to select one. (No change here)
    // We'll wait for the options to be populated before selecting.
    cy.get('select[name="category"]').find('option').should('have.length.gt', 1);
    cy.get('select[name="category"]').select(mockCategory.name);

    cy.get('button').contains('Add Post').click();

    // Wait for the mocked API call to complete
    cy.wait('@createPost');

    // Assert that the UI updates to show the new post title
    cy.contains('h3', 'My New Test Post').should('be.visible');
  });

  it('should allow an editor to create a new post with an image', () => {
    // Intercept the API call for creating a post to mock the response
    cy.intercept('POST', '/api/posts', (req) => {
      req.reply({
        statusCode: 201,
        body: {
          _id: 'new_post_id_456',
          title: 'My New Test Post with Image',
          content: 'This is the content of the new post with an image.',
          category: mockCategory._id,
          author: 'Test Editor', // Consistent with Clerk mock
          slug: 'my-new-test-post-with-image',
          featuredImage: '/uploads/image-12345.jpg', // Mock the uploaded image path
          status: 'draft',
        },
      });
    }).as('createPostWithImage');

    // Load a dummy image fixture
    cy.fixture('test-image.jpg', 'binary').then((fileContent) => {
      cy.get('input[name="title"]').should('be.visible');
      cy.wait(100); // Wait for potential re-renders
      cy.get('input[name="title"]').type('My New Test Post with Image');
      cy.get('textarea[name="content"]').should('be.visible');
      cy.wait(100); // Wait for potential re-renders
      cy.get('textarea[name="content"]').type('This is the content of the new post with an image.');

      // Select the category
      cy.get('select[name="category"]').find('option').should('have.length.gt', 1);
      cy.get('select[name="category"]').select(mockCategory.name);

      // Attach the image file
      cy.get('input[type="file"][name="featuredImage"]').selectFile({
        contents: Cypress.Buffer.from(fileContent, 'binary'),
        fileName: 'test-image.jpg',
        mimeType: 'image/jpeg',
        lastModified: Date.now(),
      });

      cy.get('button').contains('Add Post').click();

      // For multipart/form-data, Cypress's `request.body` might be an empty object.
      // We'll rely on the `Content-Type` header to confirm it's a file upload
      // and the UI assertion to confirm successful processing.
      cy.wait('@createPostWithImage').its('request.headers')
        .should('have.property', 'content-type').and('include', 'multipart/form-data');

      // Assert that the UI updates to show the new post title and image
      cy.contains('h3', 'My New Test Post with Image').should('be.visible');
      cy.get(`img[alt="My New Test Post with Image"]`).should('have.attr', 'src').and('include', '/uploads/image-12345.jpg');
      cy.get(`img[alt="My New Test Post with Image"]`).should('have.attr', 'src').and('include', '/uploads/');
    });
  });
});