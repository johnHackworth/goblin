import { getBlurHashAverageColor } from "fast-blurhash";

function rgbToHex(rgb: number[]): string {
	return `#${rgb
		.map((x) => {
			const hex = x.toString(16);
			return hex.length === 1 ? `0${hex}` : hex;
		})
		.join("")}`;
}

export function extractAvgColorFromBlurhash(hash: string) {
	return typeof hash === "string"
		? rgbToHex(getBlurHashAverageColor(hash))
		: undefined;
}
