import { RenoteMutings } from "@/models/index.js";
import define from "../../define.js";
import { makePaginationQuery } from "../../common/make-pagination-query.js";

export const meta = {
	tags: ["account"],

	requireCredential: true,

	kind: "read:mutes",

	res: {
		type: "array",
		optional: false,
		nullable: false,
		items: {
			type: "object",
			optional: false,
			nullable: false,
			ref: "RenoteMuting",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		limit: { type: "integer", minimum: 1, maximum: 100, default: 30 },
		sinceId: { type: "string", format: "misskey:id" },
		untilId: { type: "string", format: "misskey:id" },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const query = makePaginationQuery(
		RenoteMutings.createQueryBuilder("muting"),
		ps.sinceId,
		ps.untilId,
	).andWhere("muting.muterId = :meId", { meId: me.id });

	const mutings = await query.take(ps.limit).getMany();

	return await RenoteMutings.packMany(mutings, me);
});
