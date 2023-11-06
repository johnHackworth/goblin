import type Resolver from "../../resolver.js";
import post from "@/services/note/create.js";
import type { CacheableRemoteUser } from "@/models/entities/user.js";
import type { IAnnounce } from "../../type.js";
import { getApId } from "../../type.js";
import { fetchNote, resolveNote } from "../../models/note.js";
import { apLogger } from "../../logger.js";
import { extractDbHost } from "@/misc/convert-host.js";
import { getApLock } from "@/misc/app-lock.js";
import { parseAudience } from "../../audience.js";
import { StatusError } from "@/misc/fetch.js";
import { Notes } from "@/models/index.js";
import { shouldBlockInstance } from "@/misc/should-block-instance.js";

const logger = apLogger;

/**
 * Handle announcement activities
 */
export default async function (
	resolver: Resolver,
	actor: CacheableRemoteUser,
	activity: IAnnounce,
	targetUri: string,
): Promise<void> {
	const uri = getApId(activity);

	if (actor.isSuspended) {
		return;
	}

	// Interrupt if you block the announcement destination
	if (await shouldBlockInstance(extractDbHost(uri))) return;

	const unlock = await getApLock(uri);

	try {
		// Check if something with the same URI is already registered
		const exist = await fetchNote(uri);
		if (exist) {
			return;
		}

		// Resolve Announce target
		let renote;
		try {
			renote = await resolveNote(targetUri);
		} catch (e) {
			// Skip if target is 4xx
			if (e instanceof StatusError) {
				if (e.isClientError) {
					logger.warn(`Ignored announce target ${targetUri} - ${e.statusCode}`);
					return;
				}

				logger.warn(
					`Error in announce target ${targetUri} - ${e.statusCode || e}`,
				);
			}
			throw e;
		}

		if (!(await Notes.isVisibleForMe(renote, actor.id)))
			return "skip: invalid actor for this activity";

		logger.info(`Creating the (Re)Note: ${uri}`);

		const activityAudience = await parseAudience(
			actor,
			activity.to,
			activity.cc,
		);

		await post(actor, {
			createdAt: activity.published ? new Date(activity.published) : null,
			renote,
			visibility: activityAudience.visibility,
			visibleUsers: activityAudience.visibleUsers,
			uri,
		});
	} finally {
		unlock();
	}
}
