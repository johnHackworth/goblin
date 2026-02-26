import define from "../../define.js";
import { genId } from "@/misc/gen-id.js";
import { RssFeeds, RssFeedFollowings, Users } from "@/models/index.js";
import { ApiError } from "../../error.js";
import { parseFeed } from "@/services/rss/parser.js";
import { getOrCreateRssFeed } from "@/services/rss/create-feed-bot.js";
import { fetchAndProcessFeed } from "@/services/rss/fetch-feed.js";
import { Followings } from "@/models/index.js";

export const meta = {
	tags: ["rss"],

	requireCredential: true,

	errors: {
		invalidUrl: {
			message: "Invalid URL.",
			code: "INVALID_URL",
			id: "rss-invalid-url",
		},
		fetchFailed: {
			message: "Failed to fetch RSS feed.",
			code: "FETCH_FAILED",
			id: "rss-fetch-failed",
		},
		instanceLimitReached: {
			message: "Instance has reached maximum RSS feed limit.",
			code: "INSTANCE_LIMIT_REACHED",
			id: "rss-instance-limit",
		},
	},

	res: {
		type: "object",
		optional: false,
		nullable: false,
		properties: {
			id: { type: "string" },
			url: { type: "string" },
			title: { type: "string" },
			description: { type: "string", nullable: true },
			siteUrl: { type: "string", nullable: true },
			botUser: { type: "object" },
			isActive: { type: "boolean" },
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		url: { type: "string" },
		autoFollow: { type: "boolean", default: true },
	},
	required: ["url"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	try {
		new URL(ps.url);
	} catch {
		throw new ApiError(meta.errors.invalidUrl);
	}

	const existingFeed = await RssFeeds.findOneBy({ url: ps.url });
	if (existingFeed) {
		const existingFollowing = await RssFeedFollowings.findOneBy({
			userId: user.id,
			rssFeedId: existingFeed.id,
		});

		if (!existingFollowing && ps.autoFollow) {
			await RssFeedFollowings.insert({
				id: genId(),
				userId: user.id,
				rssFeedId: existingFeed.id,
				createdAt: new Date(),
			});

			await Followings.insert({
				id: genId(),
				createdAt: new Date(),
				followerId: user.id,
				followeeId: existingFeed.botUserId,
			});
		}

		const botUser = await Users.findOneBy({ id: existingFeed.botUserId });
		return {
			id: existingFeed.id,
			url: existingFeed.url,
			title: existingFeed.title,
			description: existingFeed.description,
			siteUrl: existingFeed.siteUrl,
			botUser,
			isActive: existingFeed.isActive,
		};
	}

	const result = await parseFeed(ps.url);
	if (!result.success || !result.feed) {
		throw new ApiError({
			message: result.error || "Failed to fetch RSS feed",
			code: "FETCH_FAILED",
			id: "rss-fetch-failed",
		});
	}

	const { feed, isNew } = await getOrCreateRssFeed(
		ps.url,
		result.feed.title,
		result.feed.description || undefined,
		result.feed.link || undefined,
	);

	if (ps.autoFollow) {
		await RssFeedFollowings.insert({
			id: genId(),
			userId: user.id,
			rssFeedId: feed.id,
			createdAt: new Date(),
		});

		await Followings.insert({
			id: genId(),
			createdAt: new Date(),
			followerId: user.id,
			followeeId: feed.botUserId,
		});

		fetchAndProcessFeed(feed.id);
	}

	const botUser = await Users.findOneBy({ id: feed.botUserId });

	return {
		id: feed.id,
		url: feed.url,
		title: feed.title,
		description: feed.description,
		siteUrl: feed.siteUrl,
		botUser,
		isActive: feed.isActive,
	};
});
