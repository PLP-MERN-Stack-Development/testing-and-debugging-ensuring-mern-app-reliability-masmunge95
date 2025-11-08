import { renderHook, act, waitFor } from '@testing-library/react'; // Keep these imports
import { jest, describe, it, expect, beforeEach } from '@jest/globals'; // Import Jest globals explicitly

// Use the modern ESM-compatible mocking API. This must be at the top level.
jest.unstable_mockModule('@/services/postService', () => ({
  postService: {
    getAllPosts: jest.fn(),
  },
}));

describe('usePosts Custom Hook', () => {
  // These will be dynamically imported *after* the mock has been defined.
  let usePosts;
  let postService;

  const mockPosts = [
    { _id: '1', title: 'Post 1' },
    { _id: '2', title: 'Post 2' },
  ];

   beforeEach(async () => {
    // Dynamically import the modules *after* the mock has been defined.
    const postsHookModule = await import('@/hooks/usePosts');
    usePosts = postsHookModule.usePosts;
    const postServiceModule = await import('@/services/postService');
    postService = postServiceModule.postService;

    // Reset mocks to ensure a clean state for each test.
    jest.resetAllMocks();
  });

  it('should fetch posts on initial render for a given userId', async () => {
    postService.getAllPosts.mockResolvedValue({ posts: mockPosts });

    const { result } = renderHook(() => usePosts('user123')); // Use the dynamically imported usePosts

    expect(result.current.loading).toBe(true);

     // Wait for the hook's async effect to complete and update the state.
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.loading).toBe(false);
    expect(result.current.posts).toEqual(mockPosts);
    expect(postService.getAllPosts).toHaveBeenCalledWith(1, 100, null, null, 'user123');
    expect(postService.getAllPosts).toHaveBeenCalledTimes(1);
  });

  it('should handle API errors gracefully', async () => {
    const errorMessage = 'Network Error';
    postService.getAllPosts.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => usePosts('user123')); // Use the dynamically imported usePosts

    // Wait for the hook to finish its loading process.
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.loading).toBe(false);
    expect(result.current.posts).toEqual([]);
    expect(result.current.error).toContain(errorMessage);
  });

  it('should allow adding and removing posts from state', async () => {
    postService.getAllPosts.mockResolvedValue({ posts: [mockPosts[0]] });
    const { result } = renderHook(() => usePosts('user123')); // Use the dynamically imported usePosts
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Test adding a post
    act(() => result.current.addPost(mockPosts[1]));
    expect(result.current.posts).toEqual([mockPosts[1], mockPosts[0]]);

    // Test removing a post
    act(() => result.current.removePostFromState('1'));
    expect(result.current.posts).toHaveLength(1);
    expect(result.current.posts[0]).toEqual(mockPosts[1]);
  });
});