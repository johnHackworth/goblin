import * as mfm from "mfm-js";

const animatedMfm = [
	"tada",
	"jelly",
	"twitch",
	"shake",
	"spin",
	"jump",
	"bounce",
	"rainbow",
	"fade",
];

export function extractMfmWithAnimation(nodes: mfm.MfmNode[]): string[] {
	const mfmNodes = mfm.extract(nodes, (node) => {
		return node.type === "fn" && animatedMfm.indexOf(node.props.name) > -1;
	});
	const mfms = mfmNodes.map((x) => x.props.fn);

	return mfms;
}
