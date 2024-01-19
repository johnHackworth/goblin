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
  return note;
}


export const getParentNote = ( note ) => {
  return note.renote ?
    getParentNote( note.renote ) :
    note.reply ?
    getParentNote( note.reply ) :
    note;
}
