/**
 * Strip HTML tags from text to get plain text content
 * This is used to extract plain text for MFM parsing while keeping the original HTML for storage
 */
export function stripHtml(html: string | null | undefined): string {
	if (!html) return "";
	// Remove HTML tags but keep the text content
	// Replace tags with spaces to avoid joining words, then normalize whitespace
	return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
