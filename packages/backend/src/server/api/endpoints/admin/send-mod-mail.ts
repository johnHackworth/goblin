import * as sanitizeHtml from "sanitize-html";
import define from "../../define.js";
import { Users, UserProfiles } from "@/models/index.js";
import { ApiError } from "../../error.js";
import { sendEmail } from "@/services/send-email.js";
import { createNotification } from "@/services/create-notification.js";

export const meta = {
	tags: ["users"],

	requireCredential: true,
	requireModerator: true,

	description: "Send a moderation notice.",

	errors: {
		noSuchUser: {
			message: "No such user.",
			code: "NO_SUCH_USER",
			id: "1acefcb5-0959-43fd-9685-b48305736cb5",
		},
		noEmail: {
			message: "No email for user.",
			code: "NO_EMAIL",
			id: "ac9d2d22-ef73-11ed-a05b-0242ac120003",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		userId: { type: "string", format: "misskey:id" },
		comment: { type: "string", minLength: 1, maxLength: 2048 },
	},
	required: ["userId", "comment"],
} as const;

export default define(meta, paramDef, async (ps) => {
	const [user, profile] = await Promise.all([
		Users.findOneBy({ id: ps.userId }),
		UserProfiles.findOneBy({ userId: ps.userId }),
	]);

	if (user == null || profile == null) {
		throw new ApiError(meta.errors.noSuchUser);
	}

	createNotification(user.id, "app", {
		customBody: ps.comment,
		customHeader: "Moderation Notice",
		customIcon: "/static-assets/badges/info.png",
	});

	setImmediate(async () => {
		const email = profile.email;
		if (email == null) {
			throw new ApiError(meta.errors.noEmail);
		}

		sendEmail(
			email,
			"Moderation notice",
			sanitizeHtml(ps.comment),
			sanitizeHtml(ps.comment),
		);
	});
});
