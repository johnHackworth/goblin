import { publishMainStream } from "@/services/stream.js";
import define from "../../../define.js";
import { Users, UserSecurityKeys } from "@/models/index.js";
import { ApiError } from "../../../error.js";

export const meta = {
	requireCredential: true,

	secure: true,

	errors: {
		noSuchKey: {
			message: "No such key.",
			code: "NO_SUCH_KEY",
			id: "f9c5467f-d492-4d3c-9a8g-a70dacc86512",
		},

		accessDenied: {
			message: "You do not have edit privilege of the channel.",
			code: "ACCESS_DENIED",
			id: "1fb7cb09-d46a-4fff-b8df-057708cce513",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		name: { type: "string", minLength: 1, maxLength: 30 },
		credentialId: { type: "string" },
	},
	required: ["name", "credentialId"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	const key = await UserSecurityKeys.findOneBy({
		id: ps.credentialId,
	});

	if (key == null) {
		throw new ApiError(meta.errors.noSuchKey);
	}

	if (key.userId !== user.id) {
		throw new ApiError(meta.errors.accessDenied);
	}

	await UserSecurityKeys.update(key.id, {
		name: ps.name,
	});

	const iObj = await Users.pack(user.id, user, {
		detail: true,
		includeSecrets: true,
	});

	publishMainStream(user.id, "meUpdated", iObj);
});
