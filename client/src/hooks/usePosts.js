import { useState, useEffect, useCallback } from 'react';
import { postService } from '@/services/postService';

/**
 * Custom hook for managing post data, including fetching, creating, updating, and deleting.
 * @param {string} userId The ID of the user whose posts are being managed.
 */
export const usePosts = (userId) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const postsData = await postService.getAllPosts(1, 100, null, null, userId);
        setPosts(postsData.posts || []);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError(`Failed to load posts: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId]);

  const addPost = useCallback((newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  }, []);

  const updatePostInState = useCallback((id, updatedPost) => {
    setPosts((prev) => prev.map((p) => (p._id === id ? updatedPost : p)));
  }, []);

  const removePostFromState = useCallback((id) => {
    setPosts((prev) => prev.filter((p) => p._id !== id));
  }, []);

  return { posts, loading, error, setError, addPost, updatePostInState, removePostFromState };
};