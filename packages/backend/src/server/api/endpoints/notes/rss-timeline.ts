import { Notes, RssFeedFollowings, RssFeeds, Users } from "@/models/index.js";
import define from "../../define.js";
import { makePaginationQuery } from "../../common/make-pagination-query.js";
import { ApiError } from "../../error.js";

export const meta = {
	tags: ["notes"],

	requireCredential: true,

	res: {
		type: "array",
		optional: false,
		nullable: false,
		items: {
			type: "object",
			optional: false,
			nullable: false,
			ref: "Note",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: "string", format: "misskey:id" },
		untilId: { type: "string", format: "misskey:id" },
		sinceDate: { type: "integer" },
		untilDate: { type: "integer" },
	},
	required: [],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	const followings = await RssFeedFollowings.find({
		where: { userId: user.id },
		relations: ["rssFeed"],
	});

	const botUserIds = followings
		.map((f) => f.rssFeed?.botUserId)
		.filter((id): id is string => !!id);

	if (botUserIds.length === 0) {
		return [];
	}

	const query = makePaginationQuery(
		Notes.createQueryBuilder("note"),
		ps.sinceId,
		ps.untilId,
		ps.sinceDate,
		ps.untilDate,
	)
		.andWhere("note.userId IN (:...botUserIds)", { botUserIds })
		.innerJoinAndSelect("note.user", "user")
		.leftJoinAndSelect("user.avatar", "avatar")
		.leftJoinAndSelect("user.banner", "banner")
		.leftJoinAndSelect("note.reply", "reply")
		.leftJoinAndSelect("note.renote", "renote")
		.leftJoinAndSelect("reply.user", "replyUser")
		.leftJoinAndSelect("replyUser.avatar", "replyUserAvatar")
		.leftJoinAndSelect("replyUser.banner", "replyUserBanner")
		.leftJoinAndSelect("renote.user", "renoteUser")
		.leftJoinAndSelect("renoteUser.avatar", "renoteUserAvatar")
		.leftJoinAndSelect("renoteUser.banner", "renoteUserBanner")
		.orderBy("note.createdAt", "DESC")
		.addOrderBy("note.id", "DESC")
		.take(ps.limit);

	const notes = await query.getMany();
	const packedNotes = await Notes.packMany(notes, user, {
		detail: true,
	});

	return packedNotes;
});
