describe('Authentication Flow', () => {
  context('Editor User', () => {
    beforeEach(() => {
      // Log in as the default user (editor)
      cy.login();
    });

    it('should allow an editor to log in and access the dashboard', () => {
      cy.visit('/');
      // Wait for the initial page loading to complete.
      cy.contains('Loading...', { timeout: 15000 }).should('not.exist');

      // A more robust way to wait for the dashboard and its content.
      // Find the dashboard's main container, and within it, find the h1
      // with the correct text. This waits for everything to render together.
      cy.get('.space-y-8', { timeout: 10000 })
        .contains('h1', /welcome back/i).should('be.visible');
    });
  });

  context('Non-Editor (Viewer) User', () => {
    beforeEach(() => {
      // Log in as a non-editor user
      cy.login({
        email: Cypress.env('CLERK_TEST_VIEWER_EMAIL'),
        password: Cypress.env('CLERK_TEST_VIEWER_PASSWORD'),
      });
    });

    it('should show the public post list for a non-editor user', () => {
      cy.visit('/');
      // Wait for the PublicPostList component to be fully rendered by looking for a stable element
      // within it, like the category filter. This is more reliable than waiting for a loading
      // message to disappear, as it confirms the component has mounted and fetched its data.
      cy.get('select[aria-label="Filter by category"]', { timeout: 15000 }).should('be.visible');

      // Assert that the dashboard-specific welcome message is NOT present
      cy.contains('h1', /welcome back/i).should('not.exist');
      // Assert that the public post list title is visible
      cy.contains('h1', 'Latest Posts').should('be.visible');
    });
  });

  context('Visual Regression', () => {
    it('should match the visual snapshot of the public post list', () => {
      // Log in as a viewer to ensure the PublicPostList component is rendered
      cy.login({
        email: Cypress.env('CLERK_TEST_VIEWER_EMAIL'),
        password: Cypress.env('CLERK_TEST_VIEWER_PASSWORD'),
      });

      // Mock the API calls to ensure consistent data for the snapshot
      cy.intercept('GET', '/api/posts?*', { fixture: 'posts.json' }).as('getPosts');
      cy.intercept('GET', '/api/categories', { fixture: 'categories.json' }).as('getCategories');
      // Mock any request for an image in the uploads folder to prevent 404s.
      cy.intercept('GET', '**/uploads/*', { fixture: 'test-image.jpg' }).as('getAnyImage');

      cy.visit('/');
      // Wait for the PublicPostList component to be fully rendered by looking for the category filter.
      cy.get('select[aria-label="Filter by category"]', { timeout: 15000 }).should('be.visible');

      // Wait for any images within the post cards to be fully loaded.
      // This prevents taking a snapshot while images are still rendering and is more robust.
      cy.get('.grid > a').each(($card) => {
        // Use a `then` callback to synchronously check for an `img` element using jQuery's find.
        // This avoids the Cypress `find` command's retry behavior if an image doesn't exist.
        cy.wrap($card).then(($wrappedCard) => {
          const $img = $wrappedCard.find('img');
          if ($img.length > 0) {
            // If an image is found, we run assertions on it. This will now work for
            // default-post.jpg because we are intercepting the request and serving a real image.
            cy.wrap($img)
              .should('be.visible')
              .and('have.prop', 'naturalWidth')
              .and('be.greaterThan', 0);
          }
        });
      });
      
      cy.matchImageSnapshot('public-post-list');
    });
  });
});