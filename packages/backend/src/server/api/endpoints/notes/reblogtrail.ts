import { Notes } from "@/models/index.js";
import define from "../../define.js";
import { getNote } from "../../common/getters.js";
import { ApiError } from "../../error.js";
import { generateVisibilityQuery } from "../../common/generate-visibility-query.js";
import { generateMutedUserQuery } from "../../common/generate-muted-user-query.js";
import { makePaginationQuery } from "../../common/make-pagination-query.js";
import { generateBlockedUserQuery } from "../../common/generate-block-query.js";

export const meta = {
	tags: ["notes"],

	requireCredential: false,
	requireCredentialPrivateMode: false,

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

	errors: {
		noSuchNote: {
			message: "No such note.",
			code: "NO_SUCH_NOTE",
			id: "12908022-2e21-46cd-ba6a-3edaf6093f46",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		noteId: { type: "string", format: "misskey:id" },
	},
	required: ["noteId"],
} as const;

const getNoteAncestors = async (noteId, user, trail) => {
	const ancestor = await getNote(noteId, user);
	if (ancestor) {
		trail.push(ancestor);
		if (ancestor.reblogtrail && ancestor.reblogtrail.length > 0) {
			return trail.concat(ancestor.reblogtrail);
		}
		if (ancestor.replyId) {
			return getNoteAncestors(ancestor.replyId, user, trail);
		}
		if (ancestor.renoteId) {
			return getNoteAncestors(ancestor.replyId, user, trail);
		}
	}

	return trail;
};

export default define(meta, paramDef, async (ps, user) => {
	const note = await getNote(ps.noteId, user).catch((err) => {
		if (err.id === "9725d0ce-ba28-4dde-95a7-2cbb2c15de24")
			throw new ApiError(meta.errors.noSuchNote);
		throw err;
	});

	if (note.replyId) {
		return getNoteAncestors(note.replyId, user, []);
	}
	if (note.renoteId) {
		return getNoteAncestors(note.renoteId, user, []);
	}
	return note.reblogtrail;
});
