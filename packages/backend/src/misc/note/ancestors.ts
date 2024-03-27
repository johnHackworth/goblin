import { Notes, Note, Users, User } from "@/models/index.js";
import Logger from "@/services/logger.js";

const logger = new Logger("ancestors");

export const getNoteWithAncestors = async (noteId) => {
	const note = await Notes.findOneBy({ id: noteId });

	if (note) {
		if (note.replyId) {
			const ancestor: Note = await getNoteWithAncestors(note.replyId);
			return { ...note, reply: ancestor };
		}
		return { ...note, user: await Users.pack(note.userId) };
	}

	return null;
};

export const getRootAncestor = async (note) => {
	logger.info("entering getRootAncestor");

	if (!note) {
		logger.info("no note");
		return null;
	} else if (!note.replyId) {
		logger.info("no reply");
		logger.info(note.id);
		logger.info(note.description);
		return note;
	} else {
		logger.info("recursion");
		logger.info(note.replyId);
		const ancestor = await Notes.findOneBy({ id: note.replyId });
		return getRootAncestor(ancestor);
	}
};
