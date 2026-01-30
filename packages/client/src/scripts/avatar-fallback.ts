/**
 * Replace broken avatar images with a green square fallback
 * @param event The error event from the img element
 */
export function handleAvatarImageError(event: Event): void {
	const img = event.target as HTMLImageElement;
	// Create a simple green square using a data URI (SVG)
	img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect width="48" height="48" fill="%2331748f"/%3E%3C/svg%3E';
	// Remove error handler to prevent infinite loop
	img.onerror = null;
}
