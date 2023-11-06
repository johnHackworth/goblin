import type { CacheableRemoteUser } from "@/models/entities/user.js";
import { Followings, Users } from "@/models/index.js";
import {
	resolvePerson,
	updatePerson,
} from "@/remote/activitypub/models/person.js";
import create from "@/services/following/create.js";
import deleteFollowing from "@/services/following/delete.js";

import type { IMove } from "../../type.js";
import { getApHrefNullable } from "../../type.js";

export default async (
	actor: CacheableRemoteUser,
	activity: IMove,
): Promise<string> => {
	// ※ There is a block target in activity.object, which should be a local user that exists.

	// fetch the new and old accounts
	const targetUri = getApHrefNullable(activity.target);
	if (!targetUri) return "move: target uri is null";
	let new_acc = await resolvePerson(targetUri);
	if (!actor.uri) return "move: actor uri is null";
	let old_acc = await resolvePerson(actor.uri);

	// update them if they're remote
	if (new_acc.uri) await updatePerson(new_acc.uri);
	if (old_acc.uri) await updatePerson(old_acc.uri);

	// retrieve updated users
	new_acc = await resolvePerson(targetUri);
	old_acc = await resolvePerson(actor.uri);

	// check if alsoKnownAs of the new account is valid
	let isValidMove = true;
	if (old_acc.uri) {
		if (!new_acc.alsoKnownAs?.includes(old_acc.uri)) {
			isValidMove = false;
		}
	} else if (!new_acc.alsoKnownAs?.includes(old_acc.id)) {
		isValidMove = false;
	}
	if (!isValidMove) {
		return "skip: accounts invalid";
	}

	// add target uri to movedToUri in order to indicate that the user has moved
	await Users.update(old_acc.id, { movedToUri: targetUri });

	// follow the new account and unfollow the old one
	const followings = await Followings.findBy({
		followeeId: old_acc.id,
	});
	followings.forEach(async (following) => {
		// If follower is local
		if (!following.followerHost) {
			try {
				const follower = await Users.findOneBy({ id: following.followerId });
				if (!follower) return;
				await create(follower, new_acc);
				await deleteFollowing(follower, old_acc);
			} catch {
				/* empty */
			}
		}
	});

	return "ok";
};
