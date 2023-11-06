// If you change DB_* values, you must also change the DB schema.

/**
 * Maximum note text length that can be stored in DB.
 * Surrogate pairs count as one
 *
 * NOTE: this can hypothetically be pushed further
 * (up to 250000000), but will likely cause truncations
 * and incompatibilities with other servers,
 * as well as potential performance issues.
 */
export const DB_MAX_NOTE_TEXT_LENGTH = 100000;

/**
 * Maximum image description length that can be stored in DB.
 * Surrogate pairs count as one
 */
export const DB_MAX_IMAGE_COMMENT_LENGTH = 8192;
