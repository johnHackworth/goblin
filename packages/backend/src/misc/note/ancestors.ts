import { Notes, Note, Users, User } from "@/models/index.js";
import Logger from "@/services/logger.js";

const logger = new Logger("ancestors");

export const getNoteWithAncestors = async (noteId, me) => {
  const note = await Notes.findOneBy({ id: noteId });

  if(note) {
    return await Notes.pack( note, me, { details: true, detailRecursion: 20 } );
  }

  return null;
}

export const getRootAncestor = async (note) => {
  if(!note) {
    return null;
  } else if(! note.replyId ) {
    return note;
  } else {
    const ancestor = await Notes.findOneBy({ id: note.replyId });
    return getRootAncestor(ancestor);
  }
}