import { Instances } from "@/models/index.js";
import define from "../../define.js";

export const meta = {
	tags: ["meta"],
	requireCredential: false,
	requireCredentialPrivateMode: true,
	allowGet: true,
	cacheSec: 60,
} as const;

export const paramDef = {
	type: "object",
} as const;

export default define(meta, paramDef, async (ps) => {
	const instances = await Instances.find({
		select: ["host"],
		where: {
			isSuspended: false,
		},
	});

	return instances.map((instance) => instance.host);
});
