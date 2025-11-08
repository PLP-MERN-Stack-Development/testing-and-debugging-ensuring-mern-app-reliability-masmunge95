describe('Category Management', () => {
  const mockCategories = [
    { _id: 'cat_id_1', name: 'Technology', description: 'All about tech.' },
    { _id: 'cat_id_2', name: 'Health', description: 'Wellness and fitness.' },
  ];

  beforeEach(() => {
    // Log in as an editor before each test
    cy.login();

    // Mock the initial fetch of categories
    cy.intercept('GET', '/api/categories', {
      statusCode: 200,
      body: { categories: mockCategories },
    }).as('getCategories');

    // Visit the homepage, which will render the dashboard for an editor
    cy.visit('/');

    // Wait for the dashboard to be ready
    cy.get('.space-y-8', { timeout: 10000 })
      .contains('h1', /welcome back/i)
      .should('be.visible');

    // Wait for the initial categories to be loaded and displayed
    cy.wait('@getCategories');
    cy.contains('h2', 'Manage Categories').should('be.visible');
    cy.contains(mockCategories[0].name).should('be.visible');
  });

  it('should allow an editor to create a new category', () => {
    const newCategory = {
      _id: 'cat_id_3',
      name: 'Finance',
      description: 'Money matters.',
    };

    // Intercept the API call for creating a category
    cy.intercept('POST', '/api/categories', {
      statusCode: 201,
      body: newCategory,
    }).as('createCategory');

    // Find the creation form within the CategoryManager component
    cy.get('[data-cy="category-manager"]').within(() => {
      cy.get('input[placeholder="New category name"]').type(newCategory.name);
      cy.get('textarea[placeholder="Category description (optional)"]').should('be.visible');
      cy.wait(100);
      cy.get('textarea[placeholder="Category description (optional)"]').type(newCategory.description);
      cy.contains('button', 'Add Category').click();
    });

    // Wait for the API call and assert the UI updates
    cy.wait('@createCategory');
    cy.contains(newCategory.name).should('be.visible');
  });

  it('should allow an editor to edit an existing category', () => {
    const categoryToEdit = mockCategories[0];
    const updatedName = 'Updated Tech';

    // Intercept the API call for updating a category
    cy.intercept('PUT', `/api/categories/${categoryToEdit._id}`, {
      statusCode: 200,
      body: { ...categoryToEdit, name: updatedName },
    }).as('updateCategory');

    // Find the category row and click the "Edit" button.
    // This action causes the component to re-render, so we end the chain here.
    cy.get('[data-cy="category-manager"]')
      .contains(categoryToEdit.name)
      .closest('[data-cy="category-row"]')
      .contains('button', 'Edit').click();

    // Now that the component has re-rendered into a form, re-query for the same data-cy element.
    // It will now be a <form> element.
    cy.get(`[data-cy="category-row"]`).find('input[name="name"]').should('be.visible');
    cy.wait(100);
    cy.get(`[data-cy="category-row"]`).find('input[name="name"]').clear().type(updatedName);
    cy.get(`[data-cy="category-row"]`).contains('button', 'Save').click();

    // Wait for the API call and assert the UI updates
    cy.wait('@updateCategory');
    cy.contains(updatedName).should('be.visible');
    cy.contains(categoryToEdit.name).should('not.exist');
  });

  it('should allow an editor to delete a category', () => {
    const categoryToDelete = mockCategories[1];

    // Intercept the API call for deleting a category
    cy.intercept('DELETE', `/api/categories/${categoryToDelete._id}`, {
      statusCode: 200,
      body: { message: 'Category deleted successfully' },
    }).as('deleteCategory');

    // Set up a confirmation dialog handler
    cy.on('window:confirm', (str) => {
      expect(str).to.equal('Are you sure you want to delete this category? This might affect existing posts.');
      return true; // Click 'OK'
    });

    // Find the category row and click delete
    cy.get('[data-cy="category-manager"]')
      .contains(categoryToDelete.name)
      .closest('[data-cy="category-row"]')
      .within(() => {
        cy.contains('button', 'Delete').click();
      });

    // Wait for the API call to complete before asserting the UI has changed.
    cy.wait('@deleteCategory');
    cy.contains(categoryToDelete.name).should('not.exist');
  });
});