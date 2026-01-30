import define from "../../define.js";
import { ApiError } from "../../error.js";
import { Notes } from "@/models/index.js";
import { Note } from "@/models/entities/note.js";
import Resolver from "@/remote/activitypub/resolver.js";
import { createNote } from "@/remote/activitypub/models/note.js";
import { getApId } from "@/remote/activitypub/type.js";
import { MINUTE } from "@/const.js";

export const meta = {
	tags: ["notes"],

	requireCredential: true,

	limit: {
		duration: MINUTE,
		max: 10,
	},

	errors: {
		noSuchNote: {
			message: "No such note.",
			code: "NO_SUCH_NOTE",
			id: "24fcbfc6-2e37-42b6-8388-c29b3861a08d",
		},
		localNote: {
			message: "Note is not from a remote server.",
			code: "LOCAL_NOTE",
			id: "2d2e7d1c-7d0e-4f4c-9b3a-1c8c0e5d5e5e",
		},
	},

	res: {
		type: "object",
		optional: false,
		nullable: false,
		ref: "Note",
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
	// Get the note from local database
	const note = await Notes.findOneBy({ id: ps.noteId });

	if (note == null) {
		throw new ApiError(meta.errors.noSuchNote);
	}

	// Check if note is from a remote server
	if (note.userHost == null) {
		throw new ApiError(meta.errors.localNote);
	}

	// Check if note has a URI (required for ActivityPub fetching)
	if (!note.uri) {
		throw new ApiError(meta.errors.noSuchNote);
	}

	try {
		// Force fetch from remote server
		const resolver = new Resolver();
		resolver.setUser(user);
		const object = await resolver.resolve(note.uri);

		// Update the note in our database with fresh data from remote
		const updatedNote = await createNote(getApId(object), resolver, true);

		// Return the updated note
		return await Notes.pack(updatedNote || note, user, {
			detail: true,
		});
	} catch (error) {
		// If remote fetch fails, return the cached version
		console.error("Failed to refresh note from remote:", error);
		return await Notes.pack(note, user, {
			detail: true,
		});
	}
});
