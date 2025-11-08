import { useUser, useSession, useAuth } from '@clerk/clerk-react';
import React, { useEffect, useState, useMemo } from 'react';
import PostManager from '@/components/PostManager';
import CategoryManager from '@/components/CategoryManager';
import ErrorBoundary from '@/components/ErrorBoundary';
import { categoryService } from '@/services/categoryService';

/**
 * A dashboard component that displays a welcome message and user-specific content.
 */
export default function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { session } = useSession();
  const { getToken } = useAuth();
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryError, setCategoryError] = useState(null);

  const messages = [
    "Ready to create something awesome today?",
    "Your stories won’t write themselves — let’s get started!",
    "New ideas? Let’s turn them into posts!",
    "Your dashboard’s fresh and waiting — what are we publishing today?",
    "Let’s make some blog magic happen ✨",
    "Got thoughts? Let’s get them out there!",
    "Another day, another chance to share your ideas with the world.",
    "Your readers are waiting — time to give them something good!",
    "Let’s build your next big post together.",
    "Don’t just scroll — create, post, and inspire!",
  ];

  useEffect(() => {
    // Pick a random message when the dashboard loads
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    setMessage(randomMsg);

    const loadCategories = async () => {
      try {
        setCategoryLoading(true);
        setCategoryError(null);
        const token = await getToken({ template: 'Metadata-claims' });
        const fetchedData = await categoryService.getAllCategories(token);
        setCategories(fetchedData.categories || []);
      } catch (err) {
        setCategoryError(`Failed to load categories: ${err.message}`);
      } finally {
        setCategoryLoading(false);
      }
    };

    if (isSignedIn) loadCategories();
  }, [isSignedIn, getToken]);

  // De-duplicate categories: when a user-owned category and a system-template
  // share the same name, prioritize the user's version.
  const uniqueCategories = useMemo(() => {
    const userCategories = new Map();
    const templateCategories = [];

    for (const category of categories) {
      if (category.authorId !== 'system-template') {
        userCategories.set(category.name, category);
      } else {
        templateCategories.push(category);
      }
    }

    // Filter out templates that have a user-owned version with the same name.
    const filteredTemplates = templateCategories.filter(template => !userCategories.has(template.name));

    return [...userCategories.values(), ...filteredTemplates].sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  // Render a loading state while waiting for user data.
  if (!isLoaded || !isSignedIn || !session) {
    return <div>Loading dashboard...</div>;
  }

 // Use the active session's user object for the most up-to-date role information.
  const isEditor = session.user?.publicMetadata?.role === 'editor';

  // If the user is not an editor, they should not see this page.
  // We can redirect them or show a "permission denied" message.
  if (!isEditor) {
    return (
      <div className="text-center p-12">
        <h1 className="text-2xl font-bold">Permission Denied</h1>
        <p>You do not have access to the management dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="max-w-4xl mx-auto p-6 text-center rounded-lg shadow-md ">
        <h1 className="text-4xl font-bold ">
          Welcome back, {user.firstName}!
        </h1>
        <p className="mt-2">{message}</p>
      </div>
      <ErrorBoundary fallbackMessage="There was an error loading the Post Manager.">
        <PostManager categories={uniqueCategories} />
      </ErrorBoundary>
      <hr className="my-12 border-gray-700" />
      <ErrorBoundary fallbackMessage="There was an error loading the Category Manager.">
        <div data-cy="category-manager">
          <CategoryManager
            initialCategories={uniqueCategories}
            onCategoryChange={setCategories}
            loading={categoryLoading}
            error={categoryError}
          />
        </div>
      </ErrorBoundary>
    </div>
  );
}