import define from "../../define.js";
import { Channels, ChannelFollowings } from "@/models/index.js";

export const meta = {
	tags: ["channels", "account"],

	requireCredential: true,

	kind: "read:channels",

	res: {
		type: "array",
		optional: false,
		nullable: false,
		items: {
			type: "object",
			optional: false,
			nullable: false,
			ref: "Channel",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		sinceId: { type: "string", format: "misskey:id" },
		untilId: { type: "string", format: "misskey:id" },
		limit: { type: "integer", minimum: 1, maximum: 100, default: 5 },
	},
	required: [],
} as const;

export default define(meta, paramDef, async (ps, me) => {
	const query = ChannelFollowings.createQueryBuilder("following").andWhere({
		followerId: me.id,
	});
	if (ps.sinceId) {
		query.andWhere('following."followeeId" > :sinceId', {
			sinceId: ps.sinceId,
		});
	}
	if (ps.untilId) {
		query.andWhere('following."followeeId" < :untilId', {
			untilId: ps.untilId,
		});
	}
	if (ps.sinceId && !ps.untilId) {
		query.orderBy('following."followeeId"', "ASC");
	} else {
		query.orderBy('following."followeeId"', "DESC");
	}

	const followings = await query.take(ps.limit).getMany();

	return await Promise.all(
		followings.map((x) => Channels.pack(x.followeeId, me)),
	);
});
