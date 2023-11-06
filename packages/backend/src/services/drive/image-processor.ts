import sharp from "sharp";

export type IImage = {
	data: Buffer;
	ext: string | null;
	type: string;
};

/**
 * Convert to WebP
 *   with resize, remove metadata, resolve orientation, stop animation
 */
export async function convertToWebp(
	path: string,
	width: number,
	height: number,
	quality = 85,
): Promise<IImage> {
	return convertSharpToWebp(await sharp(path), width, height, quality);
}

export async function convertSharpToWebp(
	sharp: sharp.Sharp,
	width: number,
	height: number,
	quality = 85,
): Promise<IImage> {
	const data = await sharp
		.resize(width, height, {
			fit: "inside",
			withoutEnlargement: true,
		})
		.rotate()
		.webp({
			quality,
		})
		.toBuffer();

	return {
		data,
		ext: "webp",
		type: "image/webp",
	};
}
