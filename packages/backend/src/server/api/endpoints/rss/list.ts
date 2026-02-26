import define from "../../define.js";
import { RssFeedFollowings, RssFeeds, Users, DriveFiles } from "@/models/index.js";
import { ApiError } from "../../error.js";

export const meta = {
	tags: ["rss"],

	requireCredential: true,
} as const;

export const paramDef = {
	type: "object",
	properties: {},
	required: [],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	const followings = await RssFeedFollowings.find({
		where: { userId: user.id },
		relations: ["rssFeed", "rssFeed.botUser"],
	});

	const feeds = await Promise.all(followings.map(async (following) => {
		const feed = following.rssFeed;
		if (!feed) return null;
		const botUser = feed.botUser;
		
		const packedBotUser = botUser ? await Users.pack(botUser, user, { detail: true }) : null;
		
		return {
			id: feed.id,
			url: feed.url,
			title: feed.title,
			description: feed.description,
			siteUrl: feed.siteUrl,
			botUser: packedBotUser,
			isActive: feed.isActive,
			lastFetchedAt: feed.lastFetchedAt,
			createdAt: following.createdAt,
		};
	}));

	return feeds.filter((f): f is NonNullable<typeof f> => f !== null);
});
