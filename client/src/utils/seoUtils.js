/**
 * Generates SEO meta tags for a blog post.
 * @param {object} post - The post object.
 * @returns {object} An object containing title, description, and keywords.
 */
export const generateMetaTags = (post) => {
  if (!post) {
    return {
      title: 'MERN Blog Manager',
      description: 'A full-stack MERN application for managing blog content.',
      keywords: 'MERN, blog, React, Node.js, Express, MongoDB',
    };
  }

  const description = post.content ? post.content.substring(0, 155).replace(/<[^>]*>?/gm, '') + '...' : 'Read this interesting post on MERN Blog Manager.';
  const keywords = [post.title, post.category?.name, 'blog', ...post.title.split(' ')].filter(Boolean).join(', ');

  return {
    title: `${post.title} | MERN Blog Manager`,
    description,
    keywords,
  };
};