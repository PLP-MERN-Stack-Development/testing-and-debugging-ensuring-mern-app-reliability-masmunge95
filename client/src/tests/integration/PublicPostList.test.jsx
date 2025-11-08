import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Use standard jest.mock to point to the __mocks__ directory for these services
jest.mock('@/services/postService');
jest.mock('@/services/categoryService');
jest.mock('@/services/api'); // This will automatically pick up __mocks__/api.js

// Import the actual component and mocked services
import { postService } from '@/services/postService'; // These are already the mock objects from __mocks__
import { categoryService } from '@/services/categoryService'; // These are already the mock objects from __mocks__
import { getFullImageUrl } from '@/services/api'; // This is already the mock function from __mocks__
let PublicPostList; // Declare PublicPostList with `let` so it can be assigned in beforeEach

describe('PublicPostList Component', () => {
  const mockPosts = [
    { _id: 'p1', title: 'Post One', excerpt: 'Excerpt 1', author: 'Author A', createdAt: '2023-01-01T00:00:00Z', status: 'published', category: { _id: 'c1', name: 'Tech' }, featuredImage: '/uploads/img1.jpg' },
    { _id: 'p2', title: 'Post Two', excerpt: 'Excerpt 2', author: 'Author B', createdAt: '2023-01-02T00:00:00Z', status: 'published', category: { _id: 'c2', name: 'Health' }, featuredImage: '/uploads/img2.jpg' },
    { _id: 'p3', title: 'Post Three', excerpt: 'Excerpt 3', author: 'Author A', createdAt: '2023-01-03T00:00:00Z', status: 'published', category: { _id: 'c1', name: 'Tech' }, tags: ['react'], featuredImage: '/uploads/img3.jpg' },
    { _id: 'p4', title: 'Draft Post', excerpt: 'Excerpt 4', author: 'Author C', createdAt: '2023-01-04T00:00:00Z', status: 'draft', category: { _id: 'c1', name: 'Tech' } },
  ];

  const mockCategories = [
    { _id: 'c1', name: 'Tech', authorId: 'system-template' },
    { _id: 'c2', name: 'Health', authorId: 'system-template' },
  ];

  beforeEach(() => {
    jest.resetAllMocks(); // Reset mocks for a clean slate for each test.
    postService.getAllPosts.mockResolvedValue({ posts: mockPosts });
    categoryService.getAllCategories.mockResolvedValue({ categories: mockCategories });
    // Dynamically import the component here, after mocks are set up, and assign to the `let` variable.
    PublicPostList = require('@/components/PublicPostList').default;
  });

  it('should render loading state initially and then display published posts', async () => {
    render(<Router><PublicPostList /></Router>);

    expect(screen.getByText(/loading posts.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Post One')).toBeInTheDocument();
      expect(screen.getByText('Post Two')).toBeInTheDocument();
      expect(screen.getByText('Post Three')).toBeInTheDocument();
      expect(screen.queryByText('Draft Post')).not.toBeInTheDocument(); // Drafts should not be shown
    });
    expect(postService.getAllPosts).toHaveBeenCalledTimes(1);
    expect(categoryService.getAllCategories).toHaveBeenCalledTimes(1);
  });

  it('should filter posts by selected category', async () => {
    const user = userEvent.setup();
    render(
      <Router>
        <PublicPostList />
      </Router>
    );

    await waitFor(() => expect(screen.getByText('Post One')).toBeInTheDocument());

    // Before the user acts, set up the mock to return the expected filtered result
    postService.getAllPosts.mockResolvedValue({ posts: [mockPosts.find(p => p._id === 'p2')] });

    // Select 'Health' category
    await user.selectOptions(screen.getByRole('combobox', { name: /filter by category/i }), 'c2');

    await waitFor(() => {
      expect(postService.getAllPosts).toHaveBeenCalledWith(1, 100, 'c2', '');
      expect(screen.queryByText('Post One')).not.toBeInTheDocument();
      expect(screen.getByText('Post Two')).toBeInTheDocument();
    });
  });

  it('should search posts by tag', async () => {
    const user = userEvent.setup();
    render(
      <Router>
        <PublicPostList />
      </Router>
    );

    await waitFor(() => expect(screen.getByText('Post One')).toBeInTheDocument());

    // Set up the mock to return only the post with the 'react' tag
    postService.getAllPosts.mockResolvedValue({ posts: [mockPosts.find(p => p.tags?.includes('react'))] });

    // Type 'react' into the tag search input
    await user.type(screen.getByPlaceholderText(/enter a tag and click search.../i), 'react');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(postService.getAllPosts).toHaveBeenCalledWith(1, 100, '', 'react');
      expect(screen.queryByText('Post One')).not.toBeInTheDocument();
      expect(screen.queryByText('Post Two')).not.toBeInTheDocument();
      expect(screen.getByText('Post Three')).toBeInTheDocument();
    });
  });

  it('should update category filter when clicking on a category in a post card', async () => {
    const user = userEvent.setup();
    render(
      <Router>
        <PublicPostList />
      </Router>
    );

    await waitFor(() => expect(screen.getByText('Post One')).toBeInTheDocument());

    // Set up the mock to return only posts in the 'Tech' category
    postService.getAllPosts.mockResolvedValue({ posts: mockPosts.filter(p => p.category.name === 'Tech') });

    // Click on the 'Tech' category button in 'Post One'
    await user.click(screen.getAllByRole('button', { name: /in tech/i })[0]);

    await waitFor(() => {
      expect(postService.getAllPosts).toHaveBeenCalledWith(1, 100, 'c1', '');
      expect(screen.getByText('Post One')).toBeInTheDocument();
      expect(screen.queryByText('Post Two')).not.toBeInTheDocument();
    });
  });
});