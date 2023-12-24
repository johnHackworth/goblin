export const removeMeta = ( content ) => {
  return content && content.split('<!-- tags -->')[0]
}

export const getTags = ( content ) => {
  const tags = content && content.split('<!-- tags -->')[1];
  return tags || [];
}

export const getNotEmbedFiles = ( note ) => {
  const hasEmbedImages = note.text? note.text.indexOf('<img') >= 0 : false;
  if( ! note.files || note.files.length < 1) {
    return [];
  }
  if(hasEmbedImages) {
    return note.files.filter( (file) => file.type.indexOf('image') < 0);
  }
  return note.files;
}