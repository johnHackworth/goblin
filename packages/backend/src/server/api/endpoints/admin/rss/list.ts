import define from "../../../define.js";
import {
	RssFeeds,
	Users,
	RssFeedItems,
	RssFeedFollowings,
} from "@/models/index.js";
import { ApiError } from "../../../error.js";

export const meta = {
	tags: ["admin", "rss"],

	requireCredential: true,
	requireAdmin: true,
} as const;

export const paramDef = {
	type: "object",
	properties: {
		limit: { type: "number", default: 50 },
		offset: { type: "number", default: 0 },
	},
	required: [],
} as const;

export default define(meta, paramDef, async (ps) => {
	const feeds = await RssFeeds.find({
		take: ps.limit,
		skip: ps.offset,
		order: { createdAt: "DESC" },
		relations: ["botUser"],
	});

	const total = await RssFeeds.count();

	const enrichedFeeds = await Promise.all(
		feeds.map(async (feed) => {
			const followCount = await RssFeedFollowings.count({
				where: { rssFeedId: feed.id },
			});
			const botUser = await Users.findOneBy({ id: feed.botUserId });
			return {
				...feed,
				botUser,
				followCount,
			};
		}),
	);

	return {
		total,
		feeds: enrichedFeeds,
	};
});
