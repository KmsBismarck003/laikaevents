/**
 * Utility to generate full image URLs
 * Handles local vs server paths
 */
export const getImageUrl = (path) => {
    if (!path) return 'https://placehold.co/400x200?text=No+Image';

    // If it's already an absolute URL (http/https) or blob, return as is
    if (path.startsWith('http') || path.startsWith('https') || path.startsWith('blob:')) {
        return path;
    }

    // Construct backend base URL based on current window location
    // Use port 8000 for backend
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    // Default to port 8000 if not specified (assumption for this project)
    const port = '8000';
    const baseUrl = `${protocol}//${hostname}:${port}`;

    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${baseUrl}${cleanPath}`;
};
