describe('Public Site', () => {
  it('should load the homepage and display the latest posts', () => {
    // Visit the homepage
    cy.visit('/');

    // Check that the main heading is visible
    cy.contains('h1', 'Latest Posts').should('be.visible');

    // Check that the component is not stuck in a loading state
    cy.contains('Loading posts...').should('not.exist');
  });
});