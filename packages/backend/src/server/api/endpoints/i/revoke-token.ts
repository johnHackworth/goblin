import define from "../../define.js";
import { AccessTokens } from "@/models/index.js";
import { publishUserEvent } from "@/services/stream.js";

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

export const paramDef = {
	type: "object",
	properties: {
		tokenId: { type: "string", format: "misskey:id" },
	},
	required: ["tokenId"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	const exist = await AccessTokens.exist({ where: { id: ps.tokenId } });

	if (exist) {
		await AccessTokens.delete({
			id: ps.tokenId,
			userId: user.id,
		});

		// Terminate streaming
		publishUserEvent(user.id, "terminate");
	}
});
