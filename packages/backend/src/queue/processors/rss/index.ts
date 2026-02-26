import type Bull from "bull";
import { queueLogger } from "../../logger.js";
import {
	fetchAndProcessFeed,
	getActiveFeeds,
} from "@/services/rss/fetch-feed.js";

const logger = queueLogger.createSubLogger("rss");

export async function processRssFetch(
	job: Bull.Job<Record<string, unknown>>,
): Promise<void> {
	const feedId = job.data.feedId as string;
	logger.info(`Fetching RSS feed: ${feedId}`);
	await fetchAndProcessFeed(feedId);
}

export async function fetchAllRssFeeds(): Promise<void> {
	logger.info("Fetching all RSS feeds...");

	const feeds = await getActiveFeeds();

	for (const feed of feeds) {
		await fetchAndProcessFeed(feed.id);
	}

	logger.info(`Processed ${feeds.length} RSS feeds`);
}
