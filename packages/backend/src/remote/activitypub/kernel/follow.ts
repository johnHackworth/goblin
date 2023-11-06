import type { CacheableRemoteUser } from "@/models/entities/user.js";
import follow from "@/services/following/create.js";
import type { IFollow } from "../type.js";
import DbResolver from "../db-resolver.js";

export default async (
	actor: CacheableRemoteUser,
	activity: IFollow,
): Promise<string> => {
	const dbResolver = new DbResolver();
	const followee = await dbResolver.getUserFromApId(activity.object);

	if (followee == null) {
		return "skip: followee not found";
	}

	if (followee.host != null) {
		return "skip: user you are trying to follow is not a local user";
	}

	await follow(actor, followee, activity.id);
	return "ok";
};
