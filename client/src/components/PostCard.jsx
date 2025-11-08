import React, { useState, useEffect } from 'react';
import Button from '@/components/Button';
import { Link } from 'react-router-dom';
import { getFullImageUrl } from '@/services/api';

const PostCard = ({ post, categories = [], onUpdate, onStatusUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState({ ...post });
    const [isSaving, setIsSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

    // Reset the draft state whenever the main post prop changes.
    useEffect(() => {
        setDraft({ ...post });
    }, [post]);

    // Effect to manage the lifecycle of the image preview URL.
    // This cleans up the object URL to prevent memory leaks.
    useEffect(() => {
        // Clean up the object URL to avoid memory leaks
        return () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
        };
    }, [imagePreview]);

    const handleEditClick = () => {
        // Reset draft to current post state when starting to edit
        // This ensures any changes from other cards don't leak over
        setDraft({ ...post });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setImagePreview(null); // Clear preview on cancel
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onUpdate(post._id, draft);
        } finally {
            // Ensure isSaving is reset even if the update fails
            setIsSaving(false);
            setIsEditing(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setDraft(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        // If there's an existing preview, revoke it before creating a new one to prevent memory leaks.
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
        setDraft(prev => ({ ...prev, featuredImage: file || null }));
        setImagePreview(file ? URL.createObjectURL(file) : null);
    };

    const imageUrl = getFullImageUrl(post.featuredImage);

    return (
        <div className="rounded-lg shadow-md p-6" data-post-id={post._id}>
            {!isEditing ? (
                <div className="flex flex-col justify-between h-full gap-4">
                    <div className="flex-grow">
                        <div className="flex justify-between items-start mb-2">
                            <Link to={`/posts/${post.slug || post._id}`}>
                                <h3 className="text-lg font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    {post.title}
                                </h3>
                            </Link>
                            <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${
                               { draft: 'bg-blue-600', published: 'bg-green-600', archived: 'bg-gray-500' }[post.status] || 'bg-gray-400'
                            } text-white`}>
                                {post.status}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            By {post.author} on {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                        {imageUrl && (
                            <Link to={`/posts/${post.slug || post._id}`}>
                                <img src={imageUrl} alt={post.title} className="mt-4 w-full h-48 object-cover rounded-md hover:opacity-90 transition-opacity" />
                            </Link>
                        )}
                        {post.excerpt && <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{post.excerpt}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {post.status !== 'published' && <Button onClick={() => onStatusUpdate(post._id, 'published')} variant="success" size="sm">Publish</Button>}
                        {post.status !== 'draft' && <Button onClick={() => onStatusUpdate(post._id, 'draft')} variant="primary" size="sm">Set to Draft</Button>}
                        {post.status !== 'archived' && <Button onClick={() => onStatusUpdate(post._id, 'archived')} variant="warning" size="sm">Archive</Button>}
                        <Button onClick={handleEditClick} variant="secondary" size="sm">
                            Edit
                        </Button>
                        <Button onClick={() => onDelete(post._id)} variant="danger" size="sm">
                            Delete
                        </Button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSave} className="flex flex-col gap-4">
                    <input
                        name="title"
                        className="border border-gray-300 dark:border-gray-600 bg-transparent rounded-lg p-2 placeholder:text-gray-400 focus:ring-blue-500 focus:border-blue-500"
                        value={draft.title}
                        onChange={handleInputChange}
                        placeholder="Enter post title"
                        required
                    />
                    <input
                        name="author"
                        className="border border-gray-300 dark:border-gray-600 bg-transparent rounded-lg p-2 placeholder:text-gray-400 focus:ring-blue-500 focus:border-blue-500"
                        value={draft.author || ''}
                        onChange={handleInputChange}
                        placeholder="Author name (optional)"
                    />
                    <textarea
                        name="content"
                        className="border border-gray-300 dark:border-gray-600 bg-transparent rounded-lg p-2 placeholder:text-gray-400 focus:ring-blue-500 focus:border-blue-500"
                        value={draft.content}
                        onChange={handleInputChange}
                        placeholder="Enter post content"
                    />
                    <input
                        name="tags"
                        className="border border-gray-300 dark:border-gray-600 bg-transparent rounded-lg p-2 placeholder:text-gray-400 focus:ring-blue-500 focus:border-blue-500"
                        value={Array.isArray(draft.tags) ? draft.tags.join(', ') : draft.tags || ''}
                        onChange={handleInputChange}
                        placeholder="Tags (comma-separated, optional)"
                    />
                    {(imagePreview || imageUrl) && (
                        <div className="my-2">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image Preview:</p>
                            <img src={imagePreview || imageUrl} alt="Preview" className="w-full h-48 object-cover rounded-md" />
                        </div>
                    )}
                    <input
                        type="file"
                        name="featuredImage"
                        onChange={handleFileChange}
                        className="border border-gray-300 dark:border-gray-600 bg-transparent rounded-lg p-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <select
                        name="category"
                        className="border border-gray-300 dark:border-gray-600 bg-transparent rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                        value={draft.category}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="">Select a category</option>
                        {categories.map((cat) => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                    </select>
                    <select name="status" value={draft.status || post.status} onChange={handleInputChange} className="border border-gray-300 dark:border-gray-600 bg-transparent rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                    </select>
                    <div className="flex gap-2">
                        <Button type="submit" variant="success" size="sm" disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button type="button" onClick={handleCancel} variant="secondary" size="sm">
                            Cancel
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default React.memo(PostCard);