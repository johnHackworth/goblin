import { apiGet } from "@/os";
import { deepClone } from "@/scripts/clone";

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
  return note;
}


export const getParentNote = ( note ) => {
  if ( note.reply ) {
    return getParentNote( note.reply)
  } else if(note.renote) {
    return getParentNote( note.renote);
  }
  return note;
}

export const getAncestorsAsTrail = ( note ) => {
  let currentNote = note;
  let trail: any[] = [];
  while(currentNote.reply) {
    trail.push( { ...currentNote,  reply: null, replyId: null} );
    currentNote = currentNote.reply;
  }
  trail.push(currentNote);
  return trail.reverse();
}