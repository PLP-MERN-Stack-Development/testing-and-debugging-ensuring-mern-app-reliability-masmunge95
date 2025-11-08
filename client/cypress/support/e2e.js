// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';
import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command.js';

addMatchImageSnapshotCommand();

// Disable all CSS transitions and animations for visual regression tests
// to prevent flaky snapshots.
beforeEach(() => {
  const css = '* { transition: none !important; animation: none !important; }';
  const style = document.createElement('style');
  style.type = 'text/css';
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);
});