// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })

// We will add our custom login command here in the next step.

/**
 * Custom Cypress command to programmatically log in a user via Clerk.
 * This avoids UI interaction for authentication, making tests faster and more reliable.
 * It uses cy.session to cache the session and speed up subsequent tests.
 */
Cypress.Commands.add('login', (options = {}) => {
  const {
    email = Cypress.env('CLERK_TEST_USER_EMAIL'),
    password = Cypress.env('CLERK_TEST_USER_PASSWORD'),
  } = options;

  const session_id = ['clerk_session', email, password];

  cy.session(
    session_id,
    () => {
      cy.visit('/'); // Visit a page to ensure ClerkJS is loaded

      // Wait for the Clerk object to be attached to the window
      cy.window().should('have.property', 'Clerk');

      cy.window().then(async (win) => {
        // Wait for the Clerk object and for it to be fully loaded.
        // Clerk.load() returns a promise that resolves when initialization is complete.
        await win.Clerk.load();

        if (!email || !password) {
          throw new Error('CLERK_TEST_USER_EMAIL and CLERK_TEST_USER_PASSWORD must be set in cypress.env.json');
        }

        // 1. Create a signIn attempt
        const signIn = await win.Clerk.client.signIn.create({
          identifier: email,
        });

        // 2. Attempt the first factor (password)
        if (signIn.status === 'needs_first_factor') {
          const firstFactor = await signIn.attemptFirstFactor({
            strategy: 'password',
            password,
          });

          // 3. Set the active session with the session ticket
          if (firstFactor.status === 'complete') {
            await win.Clerk.setActive({ session: firstFactor.createdSessionId });
            cy.log('Clerk session set programmatically via password.');
          } else {
            throw new Error(`Clerk sign-in failed with status: ${firstFactor.status}`);
          }
        } else {
          throw new Error(`Clerk sign-in failed with status: ${signIn.status}`);
        }
      });
    }
  );
});
      