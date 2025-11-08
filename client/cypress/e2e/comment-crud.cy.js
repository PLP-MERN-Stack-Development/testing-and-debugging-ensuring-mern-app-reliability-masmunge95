describe('Comment CRUD Operations', () => {
  const mockCategory = {
    _id: 'mock_category_id_123',
    name: 'Technology',
    authorId: 'user_mock_id_12345',
  };
  
  const postWithoutComments = {
    _id: 'post_no_comments_id_1',
    title: 'Post for Comments',
    content: 'Content for comments.',
    category: mockCategory._id,
    author: 'Test Editor',
    slug: 'post-for-comments',
    status: 'published',
    featuredImage: null,
    createdAt: new Date().toISOString(),
    comments: [],
  };

  const postWithExistingComment = {
    ...postWithoutComments,
    _id: 'post_with_comments_id_2',
    slug: 'post-with-existing-comments',
    comments: [
      {
        _id: 'comment_id_viewer_1',
        userId: Cypress.env('CLERK_TEST_VIEWER_ID'),
        user: 'Test Viewer', // This must match the name from the backend mock
        content: 'This is an existing comment.',
        createdAt: new Date().toISOString(),
      },
    ],
  };

  beforeEach(() => {
    // Mock categories for the PostForm and CategoryManager (needed for Dashboard)
    cy.intercept('GET', '/api/categories', {
      statusCode: 200,
      body: { categories: [mockCategory] },
    }).as('getCategories');
  });

  context('Comment Operations (as Viewer)', () => {
    beforeEach(() => {
      // Log in as a viewer user
      cy.login({
        email: Cypress.env('CLERK_TEST_VIEWER_EMAIL'),
        password: Cypress.env('CLERK_TEST_VIEWER_PASSWORD'),
      });

      // Set up intercepts for initial post fetches.
      // These will be used when cy.visit() is called within the single test block.
      // This prevents race conditions where cy.visit triggers a fetch before the intercept is ready.
      // Mock for the post initially without comments
      cy.intercept('GET', `/api/posts/authenticated/${postWithoutComments.slug}`, {
        statusCode: 200,
        body: postWithoutComments,
      }).as('getPostNoComments');
      cy.intercept('GET', `/api/posts/${postWithoutComments.slug}`, {
        statusCode: 200,
        body: postWithoutComments,
      }).as('getPostNoCommentsPublic');

      cy.intercept('GET', `/api/posts/authenticated/${postWithExistingComment.slug}`, {
        statusCode: 200,
        body: postWithExistingComment,
      }).as('getPostWithComments');
      cy.intercept('GET', `/api/posts/${postWithExistingComment.slug}`, {
        statusCode: 200,
        body: postWithExistingComment,
      }).as('getPostWithCommentsPublic');
    });

    it('should allow a viewer to add a new comment', () => {
      cy.visit(`/posts/${postWithoutComments.slug}`);
      // Wait for both the public and authenticated intercepts to ensure the component has processed both fetches
      cy.wait('@getPostNoCommentsPublic');
      cy.wait('@getPostNoComments');
      cy.contains('h1', postWithoutComments.title).should('be.visible');

      const newCommentContent = 'This is a brand new comment from a viewer!';
      const updatedPostWithComment = {
        ...postWithoutComments,
        comments: [
          {
            _id: 'new_comment_id_1',
            userId: Cypress.env('CLERK_TEST_VIEWER_ID'), // Ensure this matches the logged-in viewer's ID
            user: 'Test Viewer', // The new comment should also be created by the mock viewer
            content: newCommentContent,
            createdAt: new Date().toISOString(),
          },
        ],
      };

      // Mock the API call for adding a comment
      cy.intercept('POST', `/api/posts/${postWithoutComments._id}/comments`, {
        statusCode: 201,
        body: updatedPostWithComment,
      }).as('addComment');

      // Ensure the textarea is fully rendered and visible before typing.
      // This prevents the race condition where the component re-renders during the `type` command.
      cy.get('textarea[placeholder="Write a comment..."]').should('be.visible');
      cy.wait(100); // A short, explicit wait to ensure the component has stabilized after re-renders.
      cy.get('textarea[placeholder="Write a comment..."]') // Re-query for the element to ensure it's not detached.
        .should('be.visible')
        .type(newCommentContent);
      cy.contains('button', 'Post Comment').click();

      cy.wait('@addComment');
      cy.contains('[data-cy="comment-card"]', newCommentContent).should('be.visible');
    });

    it('should allow a viewer to edit their own comment', () => {
      cy.visit(`/posts/${postWithExistingComment.slug}`);
      // Wait for both the public and authenticated intercepts
      cy.wait('@getPostWithCommentsPublic');
      cy.wait('@getPostWithComments');
      cy.contains('h1', postWithExistingComment.title).should('be.visible');

      const updatedCommentContent = 'This comment has been updated by the viewer.';
      const updatedPost = {
        ...postWithExistingComment,
        comments: [
          { ...postWithExistingComment.comments[0], content: updatedCommentContent },
        ],
      };
      
      // Mock the API call for updating a comment
      cy.intercept('PUT', `/api/posts/${postWithExistingComment._id}/comments/${postWithExistingComment.comments[0]._id}`, {
        statusCode: 200,
        body: updatedPost,
      }).as('updateComment');

      // Find the comment card, then find the "Edit" button within it.
      // Give this command a longer timeout to wait for the button to appear after the user hook resolves.
      cy.contains('[data-cy="comment-card"]', postWithExistingComment.comments[0].content)
        .find('button', { timeout: 10000 }).contains('Edit').should('be.visible').click();
      
      // After clicking edit, the component re-renders. We find the comment card again,
      // which now contains the textarea for editing.
      cy.contains('[data-cy="comment-card"]', 'Cancel')
        .find('textarea')
        .should('be.visible');
      cy.wait(100); // Wait for potential re-renders
      cy.contains('[data-cy="comment-card"]', 'Cancel')
        .find('textarea')
        .clear().type(updatedCommentContent);
      cy.contains('button', 'Save').click();

      cy.wait('@updateComment');
      cy.contains('[data-cy="comment-card"]', updatedCommentContent).should('be.visible');
      cy.contains('[data-cy="comment-card"]', postWithExistingComment.comments[0].content).should('not.exist');
    });

    it('should allow a viewer to delete their own comment', () => {
      cy.visit(`/posts/${postWithExistingComment.slug}`);
      // Wait for both the public and authenticated intercepts
      cy.wait('@getPostWithCommentsPublic');
      cy.wait('@getPostWithComments');
      cy.contains('h1', postWithExistingComment.title).should('be.visible');

      // Mock the API call for deleting a comment
      cy.intercept('DELETE', `/api/posts/${postWithExistingComment._id}/comments/${postWithExistingComment.comments[0]._id}`, {
        statusCode: 200,
        body: { message: 'Comment removed' },
      }).as('deleteComment');

      cy.on('window:confirm', (str) => {
        expect(str).to.equal('Are you sure you want to delete this comment?');
        return true; // Click 'OK'
      });

      // Find the comment card, then find the "Delete" button within it.
      // Give this command a longer timeout to wait for the button to appear.
      cy.contains('[data-cy="comment-card"]', postWithExistingComment.comments[0].content)
        .find('button', { timeout: 10000 }).contains('Delete').should('be.visible').click();

      cy.wait('@deleteComment');
      cy.contains('[data-cy="comment-card"]', postWithExistingComment.comments[0].content).should('not.exist');
    });
  });
});