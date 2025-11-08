import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postService } from '@/services/postService';
import { categoryService } from '@/services/categoryService';
import { getFullImageUrl } from '@/services/api';

const PublicPostCard = React.memo(({ post, onCategoryClick }) => {
  const imageUrl = getFullImageUrl(post.featuredImage);
  return (
    <Link to={`/posts/${post.slug || post._id}`} className="block p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
      {imageUrl && <img src={imageUrl} alt={post.title} className="w-full h-48 object-cover rounded-md mb-4" />}
      <h3 className="text-xl font-bold mb-2">{post.title}</h3>
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        <span>By {post.author} on {new Date(post.createdAt).toLocaleDateString()}</span>
        {post.category && (
          <button onClick={(e) => { e.preventDefault(); onCategoryClick(post.category._id); }} className="ml-2 text-blue-600 hover:underline">
            in {post.category.name}
          </button>
        )}
      </div>
      <p className="text-gray-600 dark:text-gray-400">{post.excerpt}</p>
    </Link>
  );
});

export default function PublicPostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [tagInput, setTagInput] = useState(''); // State for the input field
  const [activeTagSearch, setActiveTagSearch] = useState(''); // State to trigger the search

  useEffect(() => {
    const fetchPublishedPosts = async () => {
      try {
        setLoading(true);
        // Fetch both posts and categories
        const [postData, categoryData] = await Promise.all([
          postService.getAllPosts(1, 100, selectedCategory, activeTagSearch), // Use the active search term
          categoryService.getAllCategories(),
        ]);
        const data = postData;
        const publishedPosts = data.posts.filter(p => p.status === 'published');
        
        // De-duplicate categories by name to ensure the filter dropdown is clean.
        // We use a Map to ensure that we only keep the first occurrence of each category name.
        const uniqueCategories = Array.from(
          new Map(categoryData.categories.map(cat => [cat.name, cat])).values()
        );

        setPosts(publishedPosts);
        // Sort the unique categories alphabetically by name for a consistent order.
        setCategories(uniqueCategories.sort((a, b) => a.name.localeCompare(b.name)) || []);

      } catch (err) {
        setError('Failed to load posts. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublishedPosts(); // Refetch when filters change
  }, [selectedCategory, activeTagSearch]);

  const handleSearch = () => {
    setActiveTagSearch(tagInput);
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setTagInput('');
    setActiveTagSearch('');
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  // Determine if any filter is currently active.
  const isFilterActive = selectedCategory || activeTagSearch;

  if (loading) return <p className="text-center p-12">Loading posts...</p>;
  if (error) return <p className="text-center p-12 text-red-500">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-4xl font-bold text-center mb-8">Latest Posts</h1>
      
      {/* Filter and Search Section */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4 p-4 rounded-lg shadow-md">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Filter by category"
          className="border border-gray-300 dark:border-gray-600 bg-transparent rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 flex-1"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
        <div className="flex flex-1">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Enter a tag and click search..."
            className="border border-gray-300 dark:border-gray-600 bg-transparent rounded-l-lg p-2 placeholder:text-gray-400 focus:ring-blue-500 focus:border-blue-500 flex-grow"
          />
          <button onClick={handleSearch} className="bg-blue-600 text-white px-4 rounded-r-lg hover:bg-blue-700 transition-colors">
            Search
          </button>
        </div>
      </div>
      {isFilterActive && (
        <div className="text-center mb-8">
          <button 
            onClick={handleClearFilters} 
            className="bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 text-xs font-semibold px-3 py-1 rounded-full transition-colors"
          >
            &times; Clear Filters
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {posts.length > 0 ? posts.map(post => (
          <PublicPostCard key={post._id} post={post} onCategoryClick={handleCategoryClick} />
        )) : <p className="col-span-full text-center text-gray-500">No published posts yet. Check back soon!</p>}
      </div>
    </div>
  );
}