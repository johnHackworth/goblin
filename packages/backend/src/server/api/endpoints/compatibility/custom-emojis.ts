import { Emojis } from "@/models/index.js";
import type { Emoji } from "@/models/entities/emoji.js";
import { IsNull, In } from "typeorm";
import { FILE_TYPE_BROWSERSAFE } from "@/const.js";
import define from "../../define.js";

export const meta = {
	requireCredential: false,
	requireCredentialPrivateMode: true,
	allowGet: true,

	tags: ["meta"],
} as const;

export const paramDef = {
	type: "object",
	properties: {},
	required: [],
} as const;

export default define(meta, paramDef, async () => {
	const now = Date.now();
	const emojis: Emoji[] = await Emojis.find({
		where: { host: IsNull(), type: In(FILE_TYPE_BROWSERSAFE) },
		select: ["name", "originalUrl", "publicUrl", "category"],
	});

	const emojiList = emojis.map((emoji) => ({
		shortcode: emoji.name,
		url: emoji.originalUrl,
		static_url: emoji.publicUrl,
		visible_in_picker: true,
		category: emoji.category,
	}));

	return emojiList;
});
