import type Koa from "koa";
import { Users, UserProfiles } from "@/models/index.js";
import { publishMainStream } from "@/services/stream.js";

export default async (ctx: Koa.Context) => {
	const body = ctx.request.body;

	const code = body["code"];

	const profile = await UserProfiles.findOneByOrFail({ emailVerifyCode: code });

	if (profile != null) {
		ctx.body = "Verify succeeded!";

		await UserProfiles.update(
			{ userId: profile.userId },
			{
				emailVerified: true,
				emailVerifyCode: null,
			},
		);

		publishMainStream(
			profile.userId,
			"meUpdated",
			await Users.pack(
				profile.userId,
				{ id: profile.userId },
				{
					detail: true,
					includeSecrets: true,
				},
			),
		);
	} else {
		ctx.throw(404);
	}
};
