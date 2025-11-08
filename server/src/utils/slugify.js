/**
 * Converts a string into a URL-friendly slug.
 * @param {string} text The string to convert.
 * @returns {string} The generated slug.
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/[^\w_]+/g, '-') // Replace all non-word chars (except underscore) with -
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

module.exports = slugify;
