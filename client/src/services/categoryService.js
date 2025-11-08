import api from './api';

const createAuthHeader = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const categoryService = {
  getAllCategories: async (token) => {
    // If a token is provided, it fetches user-specific categories. Otherwise, public.
    const response = await api.get('/categories', token ? createAuthHeader(token) : {});
    return response.data;
  },

  createCategory: async (categoryData, token) => {
    const response = await api.post('/categories', categoryData, createAuthHeader(token));
    return response.data;
  },

  updateCategory: async (id, categoryData, token) => {
    const response = await api.put(`/categories/${id}`, categoryData, createAuthHeader(token));
    return response.data;
  },

  deleteCategory: async (id, token) => {
    const response = await api.delete(`/categories/${id}`, createAuthHeader(token));
    return response.data;
  },
};