const filters = {
	onlyText(content) {
		let regex = /(<([^>]+)>)/gi;
		return content.replace(regex, "");
	},
};
export default filters;
