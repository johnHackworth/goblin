import define from "../../define.js";
import { genId } from "@/misc/gen-id.js";
import { RssFeedFollowings, RssFeeds, Followings } from "@/models/index.js";
import { ApiError } from "../../error.js";

export const meta = {
	tags: ["rss"],

	requireCredential: true,

	errors: {
		noSuchFeed: {
			message: "No such RSS feed.",
			code: "NO_SUCH_FEED",
			id: "rss-no-such-feed",
		},
		notFollowing: {
			message: "Not following this RSS feed.",
			code: "NOT_FOLLOWING",
			id: "rss-not-following",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		feedId: { type: "string", format: "misskey:id" },
	},
	required: ["feedId"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	const feed = await RssFeeds.findOneBy({ id: ps.feedId });
	if (!feed) {
		throw new ApiError(meta.errors.noSuchFeed);
	}

	const following = await RssFeedFollowings.findOneBy({
		userId: user.id,
		rssFeedId: feed.id,
	});

	if (!following) {
		throw new ApiError(meta.errors.notFollowing);
	}

	await RssFeedFollowings.delete(following.id);

	const followingRelationship = await Followings.findOne({
		where: {
			followerId: user.id,
			followeeId: feed.botUserId,
		},
	});

	if (followingRelationship) {
		await Followings.delete(followingRelationship.id);
	}

	return {
		id: feed.id,
	};
});
