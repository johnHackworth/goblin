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

export const shouldShowInReblogs = (note) => {
  return !!note.cw || !!note.text || !!note.poll || (note.files && note.files.length > 0);
}

export const getUserAndHostFromUrl = (url) => {
  const match = url.match(/https?:\/\/([^/]+)\/@([^/]+)/);
  if (match) {
    return {
      full: '@' + match[2] + '@' + match[1],
      host: match[1],
      username: match[2]
    }
  }
  return null;
}