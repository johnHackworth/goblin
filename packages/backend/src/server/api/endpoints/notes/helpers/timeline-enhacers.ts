import { getNoteWithAncestors, getSignature } from "@/misc/note/ancestors.js"
import { apiLogger } from "../../../logger.js";

export const fillAncestors = async ( notes, user ) => {
  let dictionary = notes.map( (note) => getSignature(note) );

  for(let i = 0; i < notes.length; i++) {
    if( ! shouldCrop( getSignature(notes[i]), dictionary) ) {
      if( notes[i].reply && notes[i].reply.replyId && !notes[i].reply.reply ) {
        notes[i].reply.reply = await getNoteWithAncestors(notes[i].reply.replyId, user);
      } else if( notes[i].renote && notes[i].renote.replyId && !notes[i].renote.reply ) {
        notes[i].renote.reply = await getNoteWithAncestors(notes[i].renote.replyId, user);
      }
      dictionary = notes.map( (note) => getSignature(note) );
    }
  }
  return notes;
}

const shouldCrop = ( signature, dictionary) => {
  return !! dictionary.find( ( n ) => {
    return (n.indexOf( signature ) >= 0 && ! n.endsWith( signature) );
  } );
}

export const cropRepeats = ( notes ) => {
  const dictionary = notes.map( (note) => getSignature(note) );
  const validNotes = []
  for(let i = 0; i < notes.length; i++) {
    if(! shouldCrop( getSignature(notes[i]), dictionary) ) {
      validNotes.push(notes[i]);
    }
  }
  return validNotes;
}