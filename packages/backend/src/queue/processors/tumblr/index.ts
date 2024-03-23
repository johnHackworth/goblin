import type Bull from "bull";
import { fetchTumblrFeeds } from "./fetch.js";

const jobs = {
	fetchTumblrFeeds,
} as Record<
	string,
	| Bull.ProcessCallbackFunction<Record<string, unknown>>
	| Bull.ProcessPromiseFunction<Record<string, unknown>>
>;

export default function (q: Bull.Queue<Record<string, unknown>>) {
	for (const [k, v] of Object.entries(jobs)) {
		q.process(k, v);
	}
}
