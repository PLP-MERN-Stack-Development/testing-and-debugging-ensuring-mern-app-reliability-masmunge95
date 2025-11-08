import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PostForm from '@/components/PostForm';

describe('PostForm Component', () => {
  const mockCategories = [
    { _id: 'cat1', name: 'Tech' },
    { _id: 'cat2', name: 'Health' },
  ];

  it('should allow a user to fill out and submit the form', async () => {
    const handleSubmit = jest.fn();
    const user = userEvent.setup();

    render(<PostForm onSubmit={handleSubmit} categories={mockCategories} />);

    // Fill out the form fields
    await user.type(screen.getByPlaceholderText(/enter post title/i), 'My Awesome Post');
    await user.type(screen.getByPlaceholderText(/author name/i), 'John Doe');
    await user.type(screen.getByPlaceholderText(/enter post content/i), 'This is the content of the post.');
    await user.type(screen.getByPlaceholderText(/tags/i), 'react, testing, javascript');
    await user.selectOptions(screen.getByRole('combobox', { name: /category/i }), 'cat1'); // Select by value
    await user.selectOptions(screen.getByRole('combobox', { name: /status/i }), 'published');

    // Simulate file upload
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/featured image/i);
    await user.upload(fileInput, file);

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /add post/i });
    await user.click(submitButton);

    // Assert that the submit handler was called with the correct data
    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith({
      title: 'My Awesome Post',
      author: 'John Doe',
      content: 'This is the content of the post.',
      tags: 'react, testing, javascript',
      category: 'cat1',
      status: 'published',
      featuredImage: file,
    });
  });
});