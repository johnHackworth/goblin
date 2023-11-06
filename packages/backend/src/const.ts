import config from "@/config/index.js";
import {
	DB_MAX_NOTE_TEXT_LENGTH,
	DB_MAX_IMAGE_COMMENT_LENGTH,
} from "@/misc/hard-limits.js";

export const MAX_NOTE_TEXT_LENGTH = Math.min(
	config.maxNoteLength ?? 3000,
	DB_MAX_NOTE_TEXT_LENGTH,
);
export const MAX_CAPTION_TEXT_LENGTH = Math.min(
	config.maxCaptionLength ?? 1500,
	DB_MAX_IMAGE_COMMENT_LENGTH,
);

export const SECOND = 1000;
export const SEC = 1000; // why do we need this duplicate here?
export const MINUTE = 60 * SEC;
export const MIN = 60 * SEC; // why do we need this duplicate here?
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

export const USER_ONLINE_THRESHOLD = 10 * MINUTE;
export const USER_ACTIVE_THRESHOLD = 3 * DAY;

// List of file types allowed to be viewed directly in the browser
// Anything not included here will be responded as application/octet-stream
// SVG is not allowed because it generates XSS <- we need to fix this and later allow it to be viewed directly
export const FILE_TYPE_BROWSERSAFE = [
	// Images
	"image/png",
	"image/gif", // TODO: deprecated, but still used by old notes, new gifs should be converted to webp in the future
	"image/jpeg",
	"image/webp", // TODO: make this the default image format
	"image/apng",
	"image/bmp",
	"image/tiff",
	"image/x-icon",
	"image/avif", // not as good supported now, but its good to introduce initial support for the future

	// OggS
	"audio/opus",
	"video/ogg",
	"audio/ogg",
	"application/ogg",

	// ISO/IEC base media file format
	"video/quicktime",
	"video/mp4", // TODO: we need to check for av1 later
	"video/vnd.avi", // also av1
	"audio/mp4",
	"video/x-m4v",
	"audio/x-m4a",
	"video/3gpp",
	"video/3gpp2",
	"video/3gp2",
	"audio/3gpp",
	"audio/3gpp2",
	"audio/3gp2",

	"video/mpeg",
	"audio/mpeg",

	"video/webm",
	"audio/webm",

	"audio/aac",
	"audio/x-flac",
	"audio/flac",
	"audio/vnd.wave",
];
/*
https://github.com/sindresorhus/file-type/blob/main/supported.js
https://github.com/sindresorhus/file-type/blob/main/core.js
https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Containers
*/
