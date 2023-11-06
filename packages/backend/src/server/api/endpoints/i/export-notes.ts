import define from "../../define.js";
import { createExportNotesJob } from "@/queue/index.js";
import { DAY } from "@/const.js";

export const meta = {
	secure: true,
	requireCredential: true,
	limit: {
		duration: DAY,
		max: 1,
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {},
	required: [],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	createExportNotesJob(user);
});
