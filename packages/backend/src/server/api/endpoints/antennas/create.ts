import define from "../../define.js";
import { genId } from "@/misc/gen-id.js";
import { Antennas, UserLists, UserGroupJoinings } from "@/models/index.js";
import { ApiError } from "../../error.js";
import { publishInternalEvent } from "@/services/stream.js";

export const meta = {
	tags: ["antennas"],

	requireCredential: true,

	kind: "write:account",

	errors: {
		noSuchUserList: {
			message: "No such user list.",
			code: "NO_SUCH_USER_LIST",
			id: "95063e93-a283-4b8b-9aa5-bcdb8df69a7f",
		},

		noSuchUserGroup: {
			message: "No such user group.",
			code: "NO_SUCH_USER_GROUP",
			id: "aa3c0b9a-8cae-47c0-92ac-202ce5906682",
		},

		tooManyAntennas: {
			message: "Too many antennas.",
			code: "TOO_MANY_ANTENNAS",
			id: "c3a5a51e-04d4-11ee-be56-0242ac120002",
		},
		noKeywords: {
			message: "No keywords.",
			code: "NO_KEYWORDS",
			id: "aa975b74-1ddb-11ee-be56-0242ac120002",
		},
	},

	res: {
		type: "object",
		optional: false,
		nullable: false,
		ref: "Antenna",
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		name: { type: "string", minLength: 1, maxLength: 100 },
		src: {
			type: "string",
			enum: ["home", "all", "users", "list", "group", "instances"],
		},
		userListId: { type: "string", format: "misskey:id", nullable: true },
		userGroupId: { type: "string", format: "misskey:id", nullable: true },
		keywords: {
			type: "array",
			items: {
				type: "array",
				items: {
					type: "string",
				},
			},
		},
		excludeKeywords: {
			type: "array",
			items: {
				type: "array",
				items: {
					type: "string",
				},
			},
		},
		users: {
			type: "array",
			items: {
				type: "string",
			},
		},
		instances: {
			type: "array",
			items: {
				type: "string",
			},
		},
		caseSensitive: { type: "boolean" },
		withReplies: { type: "boolean" },
		withFile: { type: "boolean" },
		notify: { type: "boolean" },
	},
	required: [
		"name",
		"src",
		"keywords",
		"excludeKeywords",
		"users",
		"instances",
		"caseSensitive",
		"withReplies",
		"withFile",
		"notify",
	],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	if (user.movedToUri != null) throw new ApiError(meta.errors.noSuchUserGroup);
	if (ps.keywords.length === 0) throw new ApiError(meta.errors.noKeywords);
	let userList;
	let userGroupJoining;

	const antennas = await Antennas.findBy({
		userId: user.id,
	});
	if (antennas.length > 5 && !user.isAdmin) {
		throw new ApiError(meta.errors.tooManyAntennas);
	}

	if (ps.src === "list" && ps.userListId) {
		userList = await UserLists.findOneBy({
			id: ps.userListId,
			userId: user.id,
		});

		if (userList == null) {
			throw new ApiError(meta.errors.noSuchUserList);
		}
	} else if (ps.src === "group" && ps.userGroupId) {
		userGroupJoining = await UserGroupJoinings.findOneBy({
			userGroupId: ps.userGroupId,
			userId: user.id,
		});

		if (userGroupJoining == null) {
			throw new ApiError(meta.errors.noSuchUserGroup);
		}
	}

	const antenna = await Antennas.insert({
		id: genId(),
		createdAt: new Date(),
		userId: user.id,
		name: ps.name,
		src: ps.src,
		userListId: userList ? userList.id : null,
		userGroupJoiningId: userGroupJoining ? userGroupJoining.id : null,
		keywords: ps.keywords,
		excludeKeywords: ps.excludeKeywords,
		users: ps.users,
		instances: ps.instances,
		caseSensitive: ps.caseSensitive,
		withReplies: ps.withReplies,
		withFile: ps.withFile,
		notify: ps.notify,
	}).then((x) => Antennas.findOneByOrFail(x.identifiers[0]));

	publishInternalEvent("antennaCreated", antenna);

	return await Antennas.pack(antenna);
});
