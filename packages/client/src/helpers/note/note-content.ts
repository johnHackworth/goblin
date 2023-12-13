export const removeMeta = ( content ) => {
  return content && content.split('<!-- tags -->')[0]
}

export const getTags = ( content ) => {
  const tags = content && content.split('<!-- tags -->')[1];
  return tags || [];
}

export const getNotEmbedFiles = ( note ) => {
  return note.files ? note.files.filter( (file) => !note.text || note.text.indexOf(file.url) <0 ) : [];
}