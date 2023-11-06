import define from "../../define.js";
import { Brackets } from "typeorm";
import { Endpoint } from "@/server/api/endpoint-base.js";
import { makePaginationQuery } from "@/server/api/common/make-pagination-query.js";
import { Channels } from "@/models/index.js";
import { DI } from "@/di-symbols.js";
import { sqlLikeEscape } from "@/misc/sql-like-escape.js";

export const meta = {
	tags: ["channels"],

	requireCredential: false,

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
		query: { type: "string" },
		type: {
			type: "string",
			enum: ["nameAndDescription", "nameOnly"],
			default: "nameAndDescription",
		},
		sinceId: { type: "string", format: "misskey:id" },
		untilId: { type: "string", format: "misskey:id" },
		limit: { type: "integer", minimum: 1, maximum: 100, default: 5 },
	},
	required: ["query"],
} as const;

export default define(meta, paramDef, async (ps, me) => {
	const query = makePaginationQuery(
		Channels.createQueryBuilder("channel"),
		ps.sinceId,
		ps.untilId,
	);

	if (ps.type === "nameAndDescription") {
		query.andWhere(
			new Brackets((qb) => {
				qb.where("channel.name ILIKE :q", {
					q: `%${sqlLikeEscape(ps.query)}%`,
				}).orWhere("channel.description ILIKE :q", {
					q: `%${sqlLikeEscape(ps.query)}%`,
				});
			}),
		);
	} else {
		query.andWhere("channel.name ILIKE :q", {
			q: `%${sqlLikeEscape(ps.query)}%`,
		});
	}

	const channels = await query.take(ps.limit).getMany();

	return await Promise.all(channels.map((x) => Channels.pack(x, me)));
});
