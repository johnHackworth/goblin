import define from "../../../define.js";
import { Users, UserProfiles, UserSecurityKeys } from "@/models/index.js";
import { publishMainStream } from "@/services/stream.js";
import { ApiError } from "../../../error.js";

export const meta = {
	requireCredential: true,

	secure: true,

	errors: {
		noKey: {
			message: "No security key.",
			code: "NO_SECURITY_KEY",
			id: "f9c54d7f-d4c2-4d3c-9a8g-a70daac86512",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		value: { type: "boolean" },
	},
	required: ["value"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	if (ps.value === true) {
		// セキュリティキーがなければパスワードレスを有効にはできない
		const keyCount = await UserSecurityKeys.count({
			where: {
				userId: user.id,
			},
			select: {
				id: true,
				name: true,
				lastUsed: true,
			},
		});

		if (keyCount === 0) {
			await UserProfiles.update(user.id, {
				usePasswordLessLogin: false,
			});

			throw new ApiError(meta.errors.noKey);
		}
	}

	await UserProfiles.update(user.id, {
		usePasswordLessLogin: ps.value,
	});

	const iObj = await Users.pack(user.id, user, {
		detail: true,
		includeSecrets: true,
	});

	publishMainStream(user.id, "meUpdated", iObj);
});
