import { apiGet } from "@/os";

const getNoteAncestors = async ( noteId ) => {
  return await apiGet("note/ancestors", {
    noteId: noteId
  });
}

export const populateFullReply = async ( note ) => {
  if(note.replyId) {
    if(note.reply) {
      const fullReply = await populateFullReply(note.reply)
      return { ...note, reply: fullReply }
    } else {
      return { ...note, reply: await getNoteAncestors(note.replyId) }
    }
  }
  if(note.renoteId) {
    if(note.renote) {
      const fullReply = await populateFullReply(note.renote)
      return { ...note, renote: fullReply }
    } else {
      return { ...note, renote: await getNoteAncestors(note.renoteId) }
    }
  }
  return note;
}

export const getParentNote = ( note ) => {
  if (note.reblogtrail && note.reblogtrail.length ) {
    return getParentNote(note.reblogtrail[0]);
  }
  if ( note.reply ) {
    return getParentNote( note.reply)
  } else if(note.renote) {
    return getParentNote( note.renote);
  }
  return note;
}

export const getAncestorsAsTrail =  ( note ) => {
  let currentNote = note;
  let trail: any[] = [];

  while(currentNote.replyId) {
    trail.push( currentNote );
    currentNote = currentNote.reply;
  }
  trail.push(currentNote);
  return trail.reverse();
}