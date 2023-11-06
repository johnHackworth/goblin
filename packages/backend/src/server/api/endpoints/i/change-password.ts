import define from "../../define.js";
import { UserProfiles } from "@/models/index.js";
import { hashPassword, comparePassword } from "@/misc/password.js";

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

export const paramDef = {
	type: "object",
	properties: {
		currentPassword: { type: "string" },
		newPassword: { type: "string", minLength: 1 },
	},
	required: ["currentPassword", "newPassword"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	const profile = await UserProfiles.findOneByOrFail({ userId: user.id });

	// Compare password
	const same = await comparePassword(ps.currentPassword, profile.password!);

	if (!same) {
		throw new Error("incorrect password");
	}

	// Generate hash of password
	const hash = await hashPassword(ps.newPassword);

	await UserProfiles.update(user.id, {
		password: hash,
	});
});
