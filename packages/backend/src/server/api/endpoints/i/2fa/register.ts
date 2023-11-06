import * as OTPAuth from "otpauth";
import * as QRCode from "qrcode";
import config from "@/config/index.js";
import { UserProfiles } from "@/models/index.js";
import define from "../../../define.js";
import { comparePassword } from "@/misc/password.js";

export const meta = {
	requireCredential: true,

	secure: true,
} as const;

export const paramDef = {
	type: "object",
	properties: {
		password: { type: "string" },
	},
	required: ["password"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	const profile = await UserProfiles.findOneByOrFail({ userId: user.id });

	// Compare password
	const same = await comparePassword(ps.password, profile.password!);

	if (!same) {
		throw new Error("incorrect password");
	}

	// Generate user's secret key
	const secret = new OTPAuth.Secret();

	await UserProfiles.update(user.id, {
		twoFactorTempSecret: secret.base32,
	});

	// Get the data URL of the authenticator URL
	const totp = new OTPAuth.TOTP({
		secret,
		digits: 6,
		label: user.username,
		issuer: config.host,
	});
	const url = totp.toString();
	const qr = await QRCode.toDataURL(url);

	return {
		qr,
		url,
		secret: secret.base32,
		label: user.username,
		issuer: config.host,
	};
});
