const filters = {
  onlyText( content ) {
    let regex = /(<([^>]+)>)/ig;
    return content.replace(regex, "");
  }
}
export default filters;