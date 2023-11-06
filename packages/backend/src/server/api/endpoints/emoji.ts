import { IsNull } from "typeorm";
import { Emojis } from "@/models/index.js";
import define from "../define.js";

export const meta = {
	tags: ["meta"],

	requireCredential: false,
	allowGet: true,
	cacheSec: 3600,

	res: {
		type: "object",
		optional: false,
		nullable: false,
		ref: "Emoji",
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		name: {
			type: "string",
		},
	},
	required: ["name"],
} as const;

export default define(meta, paramDef, async (ps, me) => {
	const emoji = await Emojis.findOneOrFail({
		where: {
			name: ps.name,
			host: IsNull(),
		},
	});

	return Emojis.pack(emoji);
});
