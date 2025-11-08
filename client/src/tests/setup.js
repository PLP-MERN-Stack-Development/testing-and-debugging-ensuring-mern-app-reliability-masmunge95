// d:\PLP Academy\JULY 2025 COHORT\Module Assignments\Full Stack With MERN\Week 6 Assignment\testing-and-debugging-ensuring-mern-app-reliability-masmunge95\client\src\tests\setup.js

import { jest } from '@jest/globals';
// This adds helpful assertions like .toBeInTheDocument() to Jest
// for testing React components.
import '@testing-library/jest-dom';

// Polyfill for TextEncoder, which is used by react-router-dom but not available in JSDOM.
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock the URL.createObjectURL function, which is not available in JSDOM.
// This is necessary for components that handle file previews.
window.URL.createObjectURL = jest.fn(() => 'mock-object-url');
window.URL.revokeObjectURL = jest.fn();