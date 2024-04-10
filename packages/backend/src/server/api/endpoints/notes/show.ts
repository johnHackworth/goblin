import { Notes } from "@/models/index.js";
import define from "../../define.js";
import { resolveUser } from "@/remote/resolve-user.js";
import { getNote, getNoteBySlug } from "../../common/getters.js";
import { ApiError } from "../../error.js";
import { apiLogger } from "../../logger.js";

export const meta = {
	tags: ["notes"],
	allowGet: true,

	requireCredential: false,
	requireCredentialPrivateMode: true,

	res: {
		type: "object",
		optional: false,
		nullable: false,
		ref: "Note",
	},

	errors: {
		noSuchNote: {
			message: "No such note.",
			code: "NO_SUCH_NOTE",
			id: "24fcbfc6-2e37-42b6-8388-c29b3861a08d",
			httpStatusCode: 404,
		},
	},
} as const;

export const paramDef = {
	type: "object",
	anyOf: [
		{
			properties: {
				noteId: { type: "string", format: "misskey:id" },
			},
			required: ["noteId"],
		},
		{
			properties: {
				slug: { type: "string" },
				username: { type: "string" },
				host: { type: "string" },
			},
			required: ["slug", "username"],
		},
	],
} as const;



export default define(meta, paramDef, async (ps, user) => {
	let note = null;
	if(ps.noteId) {
		note = await getNote(ps.noteId, user).catch((err) => {
			if (err.id === "9725d0ce-ba28-4dde-95a7-2cbb2c15de24")
				throw new ApiError(meta.errors.noSuchNote);
			throw err;
		});
	} else if (ps.slug) {
		const noteUser = await resolveUser(ps.username, ps.host !== 'null' ? ps.host : null).catch((err) => {
			throw err;
		});
		note = await getNoteBySlug(ps.slug, noteUser.id, user).catch((err) => {
			if (err.id === "9725d0ce-ba28-4dde-95a7-2cbb2c15de24")
				throw new ApiError(meta.errors.noSuchNote);
			throw err;
		});
	}
	if(note) {
		return await Notes.pack(note, user, {
			// FIXME: packing with detail may throw an error if the reply or renote is not visible (#8774)
			detail: true,
		}).catch((err) => {
			if (err.id === "9725d0ce-ba28-4dde-95a7-2cbb2c15de24")
				throw new ApiError(meta.errors.noSuchNote);
			throw err;
		});
	} else {
		throw new ApiError(meta.errors.noSuchNote);
	}
});
