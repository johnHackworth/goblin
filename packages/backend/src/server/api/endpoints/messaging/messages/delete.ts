import define from "../../../define.js";
import { ApiError } from "../../../error.js";
import { MessagingMessages } from "@/models/index.js";
import { deleteMessage } from "@/services/messages/delete.js";
import { SECOND, HOUR } from "@/const.js";

export const meta = {
	tags: ["messaging"],

	requireCredential: true,

	kind: "write:messaging",

	limit: {
		duration: HOUR,
		max: 300,
		minInterval: SECOND,
	},

	errors: {
		noSuchMessage: {
			message: "No such message.",
			code: "NO_SUCH_MESSAGE",
			id: "54b5b326-7925-42cf-8019-130fda8b56af",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		messageId: { type: "string", format: "misskey:id" },
	},
	required: ["messageId"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	const message = await MessagingMessages.findOneBy({
		id: ps.messageId,
		userId: user.id,
	});

	if (message == null) {
		throw new ApiError(meta.errors.noSuchMessage);
	}

	await deleteMessage(message);
});
