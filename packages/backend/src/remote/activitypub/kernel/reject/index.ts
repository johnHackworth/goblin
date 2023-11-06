import Resolver from "../../resolver.js";
import type { CacheableRemoteUser } from "@/models/entities/user.js";
import rejectFollow from "./follow.js";
import type { IReject } from "../../type.js";
import { isFollow, getApType } from "../../type.js";
import { apLogger } from "../../logger.js";

const logger = apLogger;

export default async (
	actor: CacheableRemoteUser,
	activity: IReject,
): Promise<string> => {
	const uri = activity.id || activity;

	logger.info(`Reject: ${uri}`);

	const resolver = new Resolver();

	const object = await resolver.resolve(activity.object).catch((e) => {
		logger.error(`Resolution failed: ${e}`);
		throw e;
	});

	if (isFollow(object)) return await rejectFollow(actor, object);

	return `skip: Unknown Reject type: ${getApType(object)}`;
};
