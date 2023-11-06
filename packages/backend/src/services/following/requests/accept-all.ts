import accept from "./accept.js";
import type { User } from "@/models/entities/user.js";
import { FollowRequests, Users } from "@/models/index.js";

/**
 * Approve all follow requests for the specified user
 * @param user User.
 */
export default async function (user: {
	id: User["id"];
	host: User["host"];
	uri: User["host"];
	inbox: User["inbox"];
	sharedInbox: User["sharedInbox"];
}) {
	const requests = await FollowRequests.findBy({
		followeeId: user.id,
	});

	for (const request of requests) {
		const follower = await Users.findOneByOrFail({ id: request.followerId });
		accept(user, follower);
	}
}
