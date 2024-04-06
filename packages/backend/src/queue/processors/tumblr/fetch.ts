import type Bull from "bull";

import { queueLogger } from "../../logger.js";
import { getUsersToFetch, fetchTumblrFeed } from "@/services/tumblr/index.js";

import config from "@/config/index.js";

const logger = queueLogger.createSubLogger("tumblr feed");

export async function fetchTumblrFeeds(
	job: Bull.Job<Record<string, unknown>>,
	done: any,
): Promise<void> {
	logger.info("Fetching tumblr feeds...");

	const usersToFetch = await getUsersToFetch();
	if (usersToFetch) {
		for (let i = 0; i < usersToFetch.length; i++) {}
	}

	let usersToFech = await getUsersToFetch();

	for (const user of usersToFech) {
		await fetchTumblrFeed(user);
	}

	done();
}
