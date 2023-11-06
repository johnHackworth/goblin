import define from "../../define.js";
import { createExportFollowingJob } from "@/queue/index.js";
import { HOUR } from "@/const.js";

export const meta = {
	secure: true,
	requireCredential: true,
	limit: {
		duration: HOUR,
		max: 1,
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		excludeMuting: { type: "boolean", default: false },
		excludeInactive: { type: "boolean", default: false },
	},
	required: [],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	createExportFollowingJob(user, ps.excludeMuting, ps.excludeInactive);
});
