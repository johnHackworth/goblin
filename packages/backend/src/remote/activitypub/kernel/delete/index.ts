import type { CacheableRemoteUser } from "@/models/entities/user.js";
import { toSingle } from "@/prelude/array.js";
import { getApId, isTombstone, validPost, validActor } from "../../type.js";
import deleteNote from "./note.js";
import { deleteActor } from "./actor.js";
import type { IDelete, IObject } from "../../type.js";

/**
 * Handle delete activity
 */
export default async (
	actor: CacheableRemoteUser,
	activity: IDelete,
): Promise<string> => {
	if ("actor" in activity && actor.uri !== activity.actor) {
		throw new Error("invalid actor");
	}

	// Type of object to be deleted
	let formerType: string | undefined;

	if (typeof activity.object === "string") {
		// The type is unknown, but it has disappeared
		// anyway, so it does not remote resolve
		formerType = undefined;
	} else {
		const object = activity.object as IObject;
		if (isTombstone(object)) {
			formerType = toSingle(object.formerType);
		} else {
			formerType = toSingle(object.type);
		}
	}

	const uri = getApId(activity.object);

	// Even if type is unknown, if actor and object are the same,
	// it must be `Person`.
	if (!formerType && actor.uri === uri) {
		formerType = "Person";
	}

	// If not, fallback to `Note`.
	if (!formerType) {
		formerType = "Note";
	}

	if (validPost.includes(formerType)) {
		return await deleteNote(actor, uri);
	} else if (validActor.includes(formerType)) {
		return await deleteActor(actor, uri);
	} else {
		return `Unknown type ${formerType}`;
	}
};
