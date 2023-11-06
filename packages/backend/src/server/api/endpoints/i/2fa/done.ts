import { publishMainStream } from "@/services/stream.js";
import * as OTPAuth from "otpauth";
import define from "../../../define.js";
import { Users, UserProfiles } from "@/models/index.js";

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

export const paramDef = {
	type: "object",
	properties: {
		token: { type: "string" },
	},
	required: ["token"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	const token = ps.token.replace(/\s/g, "");

	const profile = await UserProfiles.findOneByOrFail({ userId: user.id });

	if (profile.twoFactorTempSecret == null) {
		throw new Error("二段階認証の設定が開始されていません");
	}

	const delta = OTPAuth.TOTP.validate({
		secret: OTPAuth.Secret.fromBase32(profile.twoFactorTempSecret),
		digits: 6,
		token,
		window: 1,
	});

	if (delta === null) {
		throw new Error("not verified");
	}

	await UserProfiles.update(user.id, {
		twoFactorSecret: profile.twoFactorTempSecret,
		twoFactorEnabled: true,
	});

	const iObj = await Users.pack(user.id, user, {
		detail: true,
		includeSecrets: true,
	});

	publishMainStream(user.id, "meUpdated", iObj);
});
