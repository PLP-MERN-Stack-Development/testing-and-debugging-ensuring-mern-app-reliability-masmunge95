// Mock the getFullImageUrl utility
export const getFullImageUrl = jest.fn((path) => (path ? `http://mocked.com${path}` : ''));
// You might need to mock other exports from api.js if your components use them directly
export default {}; // Mock the default export if it exists