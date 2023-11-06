import deleteNote from "@/services/note/delete.js";
import { Notes, Users } from "@/models/index.js";
import define from "../../define.js";
import { getNote } from "../../common/getters.js";
import { ApiError } from "../../error.js";
import { SECOND, HOUR } from "@/const.js";

export const meta = {
	tags: ["notes"],

	requireCredential: true,

	kind: "write:notes",

	limit: {
		duration: HOUR,
		max: 300,
		minInterval: SECOND,
	},

	errors: {
		noSuchNote: {
			message: "No such note.",
			code: "NO_SUCH_NOTE",
			id: "efd4a259-2442-496b-8dd7-b255aa1a160f",
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

export default define(meta, paramDef, async (ps, user) => {
	const note = await getNote(ps.noteId, user).catch((err) => {
		if (err.id === "9725d0ce-ba28-4dde-95a7-2cbb2c15de24")
			throw new ApiError(meta.errors.noSuchNote);
		throw err;
	});

	const renotes = await Notes.findBy({
		userId: user.id,
		renoteId: note.id,
	});

	for (const note of renotes) {
		deleteNote(await Users.findOneByOrFail({ id: user.id }), note);
	}
});
