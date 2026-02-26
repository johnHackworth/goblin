import { In } from "typeorm";
import { RssFeeds, Users, RssFeedItems } from "@/models/index.js";
import type { RssFeed } from "@/models/entities/rss-feed.js";
import { parseFeed, type RssItem } from "./parser.js";
import { createNoteFromRssItem } from "./create-note-from-item.js";
import Logger from "../logger.js";

const logger = new Logger("rss-fetch");

const MAX_CONSECUTIVE_ERRORS = 5;
const TEMP_DISABLE_DURATION = 24 * 60 * 60 * 1000;

export async function fetchAndProcessFeed(feedId: string): Promise<void> {
	const feed = await RssFeeds.findOneBy({ id: feedId });
	if (!feed || !feed.isActive || feed.isPermanentlyDisabled) {
		return;
	}

	if (feed.disabledUntil && new Date() < feed.disabledUntil) {
		logger.debug(
			`Feed ${feedId} is temporarily disabled until ${feed.disabledUntil}`,
		);
		return;
	}

	try {
		const result = await parseFeed(feed.url);
		if (!result.success || !result.feed) {
			throw new Error(result.error || "Failed to parse feed");
		}

		const botUser = await Users.findOneBy({ id: feed.botUserId });
		if (!botUser) {
			throw new Error("Bot user not found");
		}

		const newItems = result.feed.items.filter((item: RssItem) => {
			if (!item.link) return true;
			if (!feed.lastItemPublishedAt) return true;
			if (!item.pubDate) return true;
			return item.pubDate > feed.lastItemPublishedAt;
		});

		const urls = newItems.map((i) => i.link).filter(Boolean);
		if (urls.length > 0) {
			const existingItems = await RssFeedItems.find({
				where: {
					rssFeedId: feed.id,
					url: In(urls as string[]),
				},
			});
			const existingUrlSet = new Set(existingItems.map((i) => i.url));

			const itemsToCreate = newItems.filter(
				(i) => !i.link || !existingUrlSet.has(i.link),
			);

			itemsToCreate.sort((a, b) => {
				const aTime = a.pubDate?.getTime() || 0;
				const bTime = b.pubDate?.getTime() || 0;
				return aTime - bTime;
			});

			for (const item of itemsToCreate) {
				await createNoteFromRssItem(feed, item, botUser);
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}

			const lastItem = itemsToCreate[itemsToCreate.length - 1];
			await RssFeeds.update(feed.id, {
				lastFetchedAt: new Date(),
				lastItemPublishedAt: lastItem?.pubDate || feed.lastItemPublishedAt,
				consecutiveErrorCount: 0,
				lastError: null,
				disabledUntil: null,
				updatedAt: new Date(),
			});
		} else {
			await RssFeeds.update(feed.id, {
				lastFetchedAt: new Date(),
				consecutiveErrorCount: 0,
				lastError: null,
				updatedAt: new Date(),
			});
		}

		logger.info(`Successfully processed feed ${feedId}: ${result.feed.title}`);
	} catch (error) {
		const newErrorCount = feed.consecutiveErrorCount + 1;
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";

		if (newErrorCount >= MAX_CONSECUTIVE_ERRORS) {
			if (feed.disabledUntil) {
				await RssFeeds.update(feed.id, {
					isPermanentlyDisabled: true,
					isActive: false,
					consecutiveErrorCount: newErrorCount,
					lastError: errorMessage,
					updatedAt: new Date(),
				});
				logger.error(
					`Feed ${feedId} permanently disabled after repeated failures`,
				);
			} else {
				await RssFeeds.update(feed.id, {
					isActive: false,
					consecutiveErrorCount: newErrorCount,
					lastError: errorMessage,
					disabledUntil: new Date(Date.now() + TEMP_DISABLE_DURATION),
					updatedAt: new Date(),
				});
				logger.warn(`Feed ${feedId} temporarily disabled for 1 day`);
			}
		} else {
			await RssFeeds.update(feed.id, {
				consecutiveErrorCount: newErrorCount,
				lastError: errorMessage,
				updatedAt: new Date(),
			});
		}

		logger.error(`Failed to fetch RSS feed ${feedId}: ${errorMessage}`);
	}
}

export async function getActiveFeeds(): Promise<RssFeed[]> {
	return await RssFeeds.find({
		where: {
			isActive: true,
			isPermanentlyDisabled: false,
		},
	});
}
