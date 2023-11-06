import type { IBlock } from "../../type.js";
import block from "@/services/blocking/create.js";
import type { CacheableRemoteUser } from "@/models/entities/user.js";
import DbResolver from "../../db-resolver.js";
import { Users } from "@/models/index.js";

export default async (
	actor: CacheableRemoteUser,
	activity: IBlock,
): Promise<string> => {
	// ※ There is a block target in activity.object, which should be a local user that exists.

	const dbResolver = new DbResolver();
	const blockee = await dbResolver.getUserFromApId(activity.object);

	if (blockee == null) {
		return "skip: blockee not found";
	}

	if (blockee.host != null) {
		return "skip: The user you are trying to block is not a local user";
	}

	await block(
		await Users.findOneByOrFail({ id: actor.id }),
		await Users.findOneByOrFail({ id: blockee.id }),
	);
	return "ok";
};
