import define from "../../define.js";
import { createExportUserListsJob } from "@/queue/index.js";
import { MINUTE } from "@/const.js";

export const meta = {
	secure: true,
	requireCredential: true,
	limit: {
		duration: MINUTE,
		max: 1,
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {},
	required: [],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	createExportUserListsJob(user);
});
