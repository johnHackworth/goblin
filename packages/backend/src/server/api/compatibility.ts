import type { IEndpoint } from "./endpoints";

import * as cp___instance_info from "./endpoints/compatibility/instance-info.js";
import * as cp___custom_emojis from "./endpoints/compatibility/custom-emojis.js";
import * as ep___instance_peers from "./endpoints/compatibility/peers.js";

const cps = [
	["v1/instance", cp___instance_info],
	["v1/custom_emojis", cp___custom_emojis],
	["v1/instance/peers", ep___instance_peers],
];

const compatibility: IEndpoint[] = cps.map(([name, cp]) => {
	return {
		name: name,
		exec: cp.default,
		meta: cp.meta || {},
		params: cp.paramDef,
	} as IEndpoint;
});

export default compatibility;
