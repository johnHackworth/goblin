import { In } from "typeorm";
import { Notes } from "@/models/index.js";
import { Note } from "@/models/entities/note.js";
import config from "@/config/index.js";
import es from "@/db/elasticsearch.js";
import sonic from "@/db/sonic.js";
import meilisearch, { MeilisearchNote } from "@/db/meilisearch.js";
import define from "../../define.js";
import { makePaginationQuery } from "../../common/make-pagination-query.js";
import { generateVisibilityQuery } from "../../common/generate-visibility-query.js";
import { generateMutedUserQuery } from "../../common/generate-muted-user-query.js";
import { generateBlockedUserQuery } from "../../common/generate-block-query.js";
import { sqlLikeEscape } from "@/misc/sql-like-escape.js";

export const meta = {
	tags: ["notes"],

	requireCredential: false,
	requireCredentialPrivateMode: true,

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

	errors: {},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		query: { type: "string" },
		sinceId: { type: "string", format: "misskey:id" },
		untilId: { type: "string", format: "misskey:id" },
		limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
		offset: { type: "integer", default: 0 },
		host: {
			type: "string",
			nullable: true,
			description: "The local host is represented with `null`.",
		},
		userId: {
			type: "string",
			format: "misskey:id",
			nullable: true,
			default: null,
		},
		channelId: {
			type: "string",
			format: "misskey:id",
			nullable: true,
			default: null,
		},
	},
	required: ["query"],
} as const;

export default define(meta, paramDef, async (ps, me) => {
	if (es == null && sonic == null && meilisearch == null) {
		const query = makePaginationQuery(
			Notes.createQueryBuilder("note"),
			ps.sinceId,
			ps.untilId,
		);

		if (ps.userId) {
			query.andWhere("note.userId = :userId", { userId: ps.userId });
		} else if (ps.channelId) {
			query.andWhere("note.channelId = :channelId", {
				channelId: ps.channelId,
			});
		}

		query
			.andWhere("note.text ILIKE :q", { q: `%${sqlLikeEscape(ps.query)}%` })
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
			.leftJoinAndSelect("renoteUser.banner", "renoteUserBanner");

		generateVisibilityQuery(query, me);
		if (me) generateMutedUserQuery(query, me);
		if (me) generateBlockedUserQuery(query, me);

		const notes: Note[] = await query.take(ps.limit).getMany();

		return await Notes.packMany(notes, me);
	} else if (sonic) {
		let start = 0;
		const chunkSize = 100;

		// Use sonic to fetch and step through all search results that could match the requirements
		const ids = [];
		while (true) {
			const results = await sonic.search.query(
				sonic.collection,
				sonic.bucket,
				ps.query,
				{
					limit: chunkSize,
					offset: start,
				},
			);

			start += chunkSize;

			if (results.length === 0) {
				break;
			}

			const res = results
				.map((k) => JSON.parse(k))
				.filter((key) => {
					if (ps.userId && key.userId !== ps.userId) {
						return false;
					}
					if (ps.channelId && key.channelId !== ps.channelId) {
						return false;
					}
					if (ps.sinceId && key.id <= ps.sinceId) {
						return false;
					}
					if (ps.untilId && key.id >= ps.untilId) {
						return false;
					}
					return true;
				})
				.map((key) => key.id);

			ids.push(...res);
		}

		// Sort all the results by note id DESC (newest first)
		ids.sort((a, b) => b - a);

		// Fetch the notes from the database until we have enough to satisfy the limit
		start = 0;
		const found = [];
		while (found.length < ps.limit && start < ids.length) {
			const chunk = ids.slice(start, start + chunkSize);
			const notes: Note[] = await Notes.find({
				where: {
					id: In(chunk),
				},
				order: {
					id: "DESC",
				},
			});

			// The notes are checked for visibility and muted/blocked users when packed
			found.push(...(await Notes.packMany(notes, me)));
			start += chunkSize;
		}

		// If we have more results than the limit, trim them
		if (found.length > ps.limit) {
			found.length = ps.limit;
		}

		return found;
	} else if (meilisearch) {
		let start = 0;
		const chunkSize = 100;

		// Use meilisearch to fetch and step through all search results that could match the requirements
		const ids = [];
		while (true) {
			const results = await meilisearch.search(ps.query, chunkSize, start, me);

			start += chunkSize;

			if (results.hits.length === 0) {
				break;
			}

			const res = results.hits
				.filter((key: MeilisearchNote) => {
					if (ps.userId && key.userId !== ps.userId) {
						return false;
					}
					if (ps.channelId && key.channelId !== ps.channelId) {
						return false;
					}
					if (ps.sinceId && key.id <= ps.sinceId) {
						return false;
					}
					if (ps.untilId && key.id >= ps.untilId) {
						return false;
					}
					return true;
				})
				.map((key) => key.id);

			ids.push(...res);
		}

		// Sort all the results by note id DESC (newest first)
		ids.sort((a, b) => b - a);

		// Fetch the notes from the database until we have enough to satisfy the limit
		start = 0;
		const found = [];
		while (found.length < ps.limit && start < ids.length) {
			const chunk = ids.slice(start, start + chunkSize);
			const notes: Note[] = await Notes.find({
				where: {
					id: In(chunk),
				},
				order: {
					id: "DESC",
				},
			});

			// The notes are checked for visibility and muted/blocked users when packed
			found.push(...(await Notes.packMany(notes, me)));
			start += chunkSize;
		}

		// If we have more results than the limit, trim them
		if (found.length > ps.limit) {
			found.length = ps.limit;
		}

		return found;
	} else {
		const userQuery =
			ps.userId != null
				? [
						{
							term: {
								userId: ps.userId,
							},
						},
				  ]
				: [];

		const hostQuery =
			ps.userId == null
				? ps.host === null
					? [
							{
								bool: {
									must_not: {
										exists: {
											field: "userHost",
										},
									},
								},
							},
					  ]
					: ps.host !== undefined
					? [
							{
								term: {
									userHost: ps.host,
								},
							},
					  ]
					: []
				: [];

		const result = await es.search({
			index: config.elasticsearch.index || "misskey_note",
			body: {
				size: ps.limit,
				from: ps.offset,
				query: {
					bool: {
						must: [
							{
								simple_query_string: {
									fields: ["text"],
									query: ps.query.toLowerCase(),
									default_operator: "and",
								},
							},
							...hostQuery,
							...userQuery,
						],
					},
				},
				sort: [
					{
						_doc: "desc",
					},
				],
			},
		});

		const hits = result.body.hits.hits.map((hit: any) => hit._id);

		if (hits.length === 0) return [];

		// Fetch found notes
		const notes = await Notes.find({
			where: {
				id: In(hits),
			},
			order: {
				id: -1,
			},
		});

		return await Notes.packMany(notes, me);
	}
});
