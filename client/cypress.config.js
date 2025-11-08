import { defineConfig } from 'cypress';
// Import the named export from @clerk/backend that is actually available
import { createClerkClient } from '@clerk/backend';
import { addMatchImageSnapshotPlugin } from 'cypress-image-snapshot/plugin.js';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(on, config) {
      addMatchImageSnapshotPlugin(on, config);
      on('task', {
        'clerk:createToken': async (userId) => {
        // This task will now use the Clerk client to perform a programmatic sign-in
        // and return a session token. The implementation will be in commands.js.
          try {
            // The actual token generation logic will be moved to commands.js
            // This task will simply return a placeholder or handle the call to the client
            // based on the updated commands.js logic.
            // For now, we'll just return a dummy value to avoid immediate errors here.
            // The real logic will be in the updated commands.js.
            return null; // This will be replaced by the actual token from commands.js
          } catch (error) {
            console.error('Error creating Clerk token:', error);
            throw error;
          }
        },
      });
      return config;
    },
  },
});