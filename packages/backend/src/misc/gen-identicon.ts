/**
 * Identicon generator
 * https://en.wikipedia.org/wiki/Identicon
 */

import type { WriteStream } from "node:fs";
import * as p from "pureimage";
import gen from "random-seed";

const size = 128; // px
const n = 5; // resolution
const margin = size / 4;
const colors = [
	["#eb6f92", "#b4637a"],
	["#f6c177", "#ea9d34"],
	["#ebbcba", "#d7827e"],
	["#9ccfd8", "#56949f"],
	["#c4a7e7", "#907aa9"],
	["#eb6f92", "#f6c177"],
	["#eb6f92", "#ebbcba"],
	["#eb6f92", "#31748f"],
	["#eb6f92", "#9ccfd8"],
	["#eb6f92", "#c4a7e7"],
	["#f6c177", "#eb6f92"],
	["#f6c177", "#ebbcba"],
	["#f6c177", "#31748f"],
	["#f6c177", "#9ccfd8"],
	["#f6c177", "#c4a7e7"],
	["#ebbcba", "#eb6f92"],
	["#ebbcba", "#f6c177"],
	["#ebbcba", "#31748f"],
	["#ebbcba", "#9ccfd8"],
	["#ebbcba", "#c4a7e7"],
	["#31748f", "#eb6f92"],
	["#31748f", "#f6c177"],
	["#31748f", "#ebbcba"],
	["#31748f", "#9ccfd8"],
	["#31748f", "#c4a7e7"],
	["#9ccfd8", "#eb6f92"],
	["#9ccfd8", "#f6c177"],
	["#9ccfd8", "#ebbcba"],
	["#9ccfd8", "#31748f"],
	["#9ccfd8", "#c4a7e7"],
	["#c4a7e7", "#eb6f92"],
	["#c4a7e7", "#f6c177"],
	["#c4a7e7", "#ebbcba"],
	["#c4a7e7", "#31748f"],
	["#c4a7e7", "#9ccfd8"],
];

const actualSize = size - margin * 2;
const cellSize = actualSize / n;
const sideN = Math.floor(n / 2);

/**
 * Generate buffer of an identicon by seed
 */
export function genIdenticon(seed: string, stream: WriteStream): Promise<void> {
	const rand = gen.create(seed);
	const canvas = p.make(size, size, undefined);
	const ctx = canvas.getContext("2d");

	const bgColors = colors[rand(colors.length)];

	const bg = ctx.createLinearGradient(0, 0, size, size);
	bg.addColorStop(0, bgColors[0]);
	bg.addColorStop(1, bgColors[1]);

	ctx.fillStyle = bg;
	ctx.beginPath();
	ctx.fillRect(0, 0, size, size);

	ctx.fillStyle = "#ffffff";

	// side bitmap (filled by false)
	const side: boolean[][] = new Array(sideN);
	for (let i = 0; i < side.length; i++) {
		side[i] = new Array(n).fill(false);
	}

	// 1*n (filled by false)
	const center: boolean[] = new Array(n).fill(false);

	for (let x = 0; x < side.length; x++) {
		for (let y = 0; y < side[x].length; y++) {
			side[x][y] = rand(3) === 0;
		}
	}

	for (let i = 0; i < center.length; i++) {
		center[i] = rand(3) === 0;
	}

	// Draw
	for (let x = 0; x < n; x++) {
		for (let y = 0; y < n; y++) {
			const isXCenter = x === (n - 1) / 2;
			if (isXCenter && !center[y]) continue;

			const isLeftSide = x < (n - 1) / 2;
			if (isLeftSide && !side[x][y]) continue;

			const isRightSide = x > (n - 1) / 2;
			if (isRightSide && !side[sideN - (x - sideN)][y]) continue;

			const actualX = margin + cellSize * x;
			const actualY = margin + cellSize * y;
			ctx.beginPath();
			ctx.fillRect(actualX, actualY, cellSize, cellSize);
		}
	}

	return p.encodePNGToStream(canvas, stream);
}
