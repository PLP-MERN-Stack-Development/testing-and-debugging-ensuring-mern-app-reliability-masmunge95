import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom'; // Ensure Link is imported
import { useAuth, useUser } from '@clerk/clerk-react';
import Button from '@/components/Button';
import ErrorBoundary from '@/components/ErrorBoundary';
import { getFullImageUrl } from '@/services/api';
import { postService } from '@/services/postService';
import { Helmet } from 'react-helmet-async';
import { generateMetaTags } from '@/utils/seoUtils';

/**
 * A page component to display a single blog post.
 */
export default function PostPage() {
    const { slug } = useParams();
    const { isSignedIn, getToken } = useAuth();
    const { user } = useUser();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [commentError, setCommentError] = useState(null);
    const [meta, setMeta] = useState(generateMetaTags(null));
    const [newComment, setNewComment] = useState('');
    const [editingComment, setEditingComment] = useState({ id: null, content: '' });
    const editCommentTextareaRef = useRef(null);
    const isViewer = user?.publicMetadata?.role === 'viewer';

    const currentUserFullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');

    const fetchPost = useCallback(async () => {
        try {
            setLoading(true);
            const token = isSignedIn ? await getToken({ template: 'Metadata-claims' }) : null;
            const data = await postService.getPost(slug, token);
            setPost(data);
            setMeta(generateMetaTags(data));
        } catch (err) {
            setError('Failed to load the post. It might not exist or there was a network issue.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [slug, isSignedIn]);

    useEffect(() => {
        fetchPost();
    }, [fetchPost]);

    useEffect(() => {
        // Automatically focus the textarea when a user starts editing a comment.
        if (editingComment.id && editCommentTextareaRef.current) {
            editCommentTextareaRef.current.focus();
            // Optional: Move cursor to the end of the text
            editCommentTextareaRef.current.setSelectionRange(editCommentTextareaRef.current.value.length, editCommentTextareaRef.current.value.length);
        }
    }, [editingComment.id]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setCommentError(null);
        try {
            const token = await getToken({ template: 'Metadata-claims' });
            const updatedPost = await postService.addComment(post._id, newComment, token);
            setPost(updatedPost);
            setNewComment('');
        } catch (err) {
            setCommentError('Failed to post comment. Please try again.');
            console.error('Failed to add comment:', err);
        }
    };

    const handleUpdateComment = async (commentId) => {
        if (!editingComment.content.trim()) return;
        try {
            const token = await getToken({ template: 'Metadata-claims' });
            const updatedPost = await postService.updateComment(post._id, commentId, editingComment.content, token);
            setPost(updatedPost);
            setEditingComment({ id: null, content: '' });
        } catch (err) {
            console.error('Failed to update comment:', err); // You could add error handling here too
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            try {
                const token = await getToken({ template: 'Metadata-claims' });
                await postService.deleteComment(post._id, commentId, token);
                // Optimistically update UI
                setPost(prevPost => ({
                    ...prevPost,
                    comments: prevPost.comments.filter(c => c._id !== commentId)
                }));
            } catch (err) {
                console.error('Failed to delete comment:', err);
            }
        }
    };

    if (loading) {
        return <div className="text-center p-12">Loading post...</div>;
    }

    if (error) {
        return <div className="text-center p-12 text-red-500">{error}</div>;
    }

    if (!post) {
        return <div className="text-center p-12">Post not found.</div>;
    }

    return ( 
        <>
            <Helmet>
                <title>{meta.title}</title>
                <meta name="description" content={meta.description} />
                <meta name="keywords" content={meta.keywords} />
            </Helmet>
            <ErrorBoundary fallbackMessage="There was an error displaying this post.">
                <article className="max-w-4xl mx-auto p-8 rounded-lg shadow-xl">
                    {post.featuredImage && post.featuredImage !== 'default-post.jpg' && (
                        <img src={getFullImageUrl(post.featuredImage)} alt={post.title} className="w-full h-auto max-h-96 object-cover rounded-lg mb-6" />
                    )}
                    <h1 className="text-4xl font-extrabold mb-4 ">{post.title}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">By {post.author} on {new Date(post.createdAt).toLocaleDateString()}</p>
                    
                    <div className="flex flex-wrap gap-2 my-4">
                        {post.tags?.map(tag => (
                            <span key={tag} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
                                #{tag}
                            </span>
                        ))}
                    </div>

                    <div className="prose dark:prose-invert max-w-none text-lg" dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }} />

                    <div className="mt-12">
                        <h3 className="text-2xl font-bold mb-4">Comments ({post.comments.length})</h3>
                        {isSignedIn && isViewer && (
                            <form onSubmit={handleAddComment} className="mb-6">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Write a comment..."
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-blue-500 focus:border-blue-500"
                                    rows="3"
                                />
                                <Button type="submit" className="mt-2">Post Comment</Button>
                                {commentError && <p className="text-red-500 text-sm mt-2">{commentError}</p>}
                            </form>
                        )}
                        <div className="space-y-4">
                            {post.comments.map(comment => (
                                <div key={comment._id} className="p-4 rounded-lg shadow-sm" data-cy="comment-card">
                                    <p className="font-semibold">{comment.user}</p>
                                    <p className="text-xs text-gray-500 mb-2">{new Date(comment.createdAt).toLocaleString()}</p>
                                    {editingComment.id === comment._id ? (
                                        <div>
                                            <textarea ref={editCommentTextareaRef} value={editingComment.content} onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                                            <Button onClick={() => handleUpdateComment(comment._id)} size="sm" className="mr-2 mt-2">Save</Button>
                                            <Button onClick={() => setEditingComment({ id: null, content: '' })} size="sm" variant="secondary" className="mt-2">Cancel</Button>
                                        </div>
                                    ) : (
                                        <p>{comment.content}</p>
                                    )}
                                    {isSignedIn && currentUserFullName === comment.user && editingComment.id !== comment._id && (
                                        <div className="mt-2">
                                            <Button onClick={() => setEditingComment({ id: comment._id, content: comment.content })} size="sm" variant="secondary" className="mr-2">Edit</Button>
                                            <Button onClick={() => handleDeleteComment(comment._id)} size="sm" variant="danger">Delete</Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <Link to="/" className="inline-block mt-8 text-blue-600 hover:underline">&larr; Back to All Posts</Link>
                </article>
            </ErrorBoundary>
        </>
    );
}