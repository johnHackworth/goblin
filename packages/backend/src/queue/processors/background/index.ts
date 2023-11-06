import type Bull from "bull";
import indexAllNotes from "./index-all-notes.js";

const jobs = {
	indexAllNotes,
} as Record<string, Bull.ProcessCallbackFunction<Record<string, unknown>>>;

export default function (q: Bull.Queue) {
	for (const [k, v] of Object.entries(jobs)) {
		q.process(k, 16, v);
	}
}
