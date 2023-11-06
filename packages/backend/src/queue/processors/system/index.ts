import type Bull from "bull";
import { tickCharts } from "./tick-charts.js";
import { resyncCharts } from "./resync-charts.js";
import { cleanCharts } from "./clean-charts.js";
import { checkExpiredMutings } from "./check-expired-mutings.js";
import { clean } from "./clean.js";
import { setLocalEmojiSizes } from "./local-emoji-size.js";
import { verifyLinks } from "./verify-links.js";

const jobs = {
	tickCharts,
	resyncCharts,
	cleanCharts,
	checkExpiredMutings,
	clean,
	setLocalEmojiSizes,
	verifyLinks,
} as Record<
	string,
	| Bull.ProcessCallbackFunction<Record<string, unknown>>
	| Bull.ProcessPromiseFunction<Record<string, unknown>>
>;

export default function (dbQueue: Bull.Queue<Record<string, unknown>>) {
	for (const [k, v] of Object.entries(jobs)) {
		dbQueue.process(k, v);
	}
}
