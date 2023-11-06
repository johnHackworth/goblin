import { createSystemUser } from "./create-system-user.js";
import type { ILocalUser } from "@/models/entities/user.js";
import { Users } from "@/models/index.js";
import { Cache } from "@/misc/cache.js";
import { IsNull } from "typeorm";

const ACTOR_USERNAME = "instance.actor" as const;

const cache = new Cache<ILocalUser>("instanceActor", 60 * 30);

export async function getInstanceActor(): Promise<ILocalUser> {
	const cached = await cache.get(null, true);
	if (cached) return cached;

	const user = (await Users.findOneBy({
		host: IsNull(),
		username: ACTOR_USERNAME,
	})) as ILocalUser | undefined;

	if (user) {
		await cache.set(null, user);
		return user;
	} else {
		const created = (await createSystemUser(ACTOR_USERNAME)) as ILocalUser;
		await cache.set(null, created);
		return created;
	}
}
