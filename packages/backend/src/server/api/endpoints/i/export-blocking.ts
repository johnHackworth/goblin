import define from "../../define.js";
import { createExportBlockingJob } from "@/queue/index.js";
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
	properties: {},
	required: [],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	createExportBlockingJob(user);
});
