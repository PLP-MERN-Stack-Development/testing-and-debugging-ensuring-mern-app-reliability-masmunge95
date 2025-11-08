// src/services/postService.js
import api from './api';

const createAuthHeader = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Post API services
export const postService = {
  // Get all posts with optional pagination and filters.
  // authorId is used to fetch posts for a specific editor.
  getAllPosts: async (page = 1, limit = 10, category = null, tag = null, authorId = null) => {
    let url = `/posts?page=${page}&limit=${limit}`;
    if (category) url += `&category=${category}`;
    if (tag) url += `&tag=${tag}`;
    if (authorId) url += `&authorId=${authorId}`;
    const response = await api.get(url);
    return response.data;
  },

  // Get a single post by ID or slug
  getPost: async (idOrSlug, token) => {
    // If a token is provided, use the authenticated endpoint to get role-aware data.
    if (token) {
      const response = await api.get(`/posts/authenticated/${idOrSlug}`, createAuthHeader(token));
      return response.data;
    }
    // Otherwise, use the public endpoint.
    const response = await api.get(`/posts/${idOrSlug}`);
    return response.data;
  },

  // Create a new post
  createPost: async (postData, token) => {
    const response = await api.post('/posts', postData, createAuthHeader(token));
    return response.data;
  },

  // Update an existing post
  updatePost: async (id, postData, token) => {
    const response = await api.put(`/posts/${id}`, postData, createAuthHeader(token));
    return response.data;
  },

  // Update only the status of a post
  updatePostStatus: async (id, status, token) => {
    const response = await api.patch(`/posts/${id}/status`, { status }, createAuthHeader(token));
    return response.data;
  },

  // Delete a post
  deletePost: async (id, token) => {
    const response = await api.delete(`/posts/${id}`, createAuthHeader(token));
    return response.data;
  },

  // Upload an image
  uploadImage: async (formData, token) => {
    const response = await api.post('/posts/upload', formData, createAuthHeader(token));
    return response.data;
  },

  // Add a comment to a post
  addComment: async (postId, content, token) => {
    const response = await api.post(`/posts/${postId}/comments`, { content }, createAuthHeader(token));
    return response.data;
  },

  // Update a comment
  updateComment: async (postId, commentId, content, token) => {
    const response = await api.put(`/posts/${postId}/comments/${commentId}`, { content }, createAuthHeader(token));
    return response.data;
  },

  // Delete a comment
  deleteComment: async (postId, commentId, token) => {
    const response = await api.delete(`/posts/${postId}/comments/${commentId}`, createAuthHeader(token));
    return response.data;
  },
};