import { IsNull } from "typeorm";
import { renderFollowRelay } from "@/remote/activitypub/renderer/follow-relay.js";
import {
	renderActivity,
	attachLdSignature,
} from "@/remote/activitypub/renderer/index.js";
import renderUndo from "@/remote/activitypub/renderer/undo.js";
import { deliver } from "@/queue/index.js";
import type { ILocalUser, User } from "@/models/entities/user.js";
import { Users, Relays } from "@/models/index.js";
import { genId } from "@/misc/gen-id.js";
import { Cache } from "@/misc/cache.js";
import type { Relay } from "@/models/entities/relay.js";
import { createSystemUser } from "./create-system-user.js";

const ACTOR_USERNAME = "relay.actor" as const;

const relaysCache = new Cache<Relay[]>("relay", 60 * 60);

export async function getRelayActor(): Promise<ILocalUser> {
	const user = await Users.findOneBy({
		host: IsNull(),
		username: ACTOR_USERNAME,
	});

	if (user) return user as ILocalUser;

	const created = await createSystemUser(ACTOR_USERNAME);
	return created as ILocalUser;
}

export async function addRelay(inbox: string) {
	const relay = await Relays.insert({
		id: genId(),
		inbox,
		status: "requesting",
	}).then((x) => Relays.findOneByOrFail(x.identifiers[0]));

	const relayActor = await getRelayActor();
	const follow = renderFollowRelay(relay, relayActor);
	const activity = renderActivity(follow);
	deliver(relayActor, activity, relay.inbox);

	return relay;
}

export async function removeRelay(inbox: string) {
	const relay = await Relays.findOneBy({
		inbox,
	});

	if (relay == null) {
		throw new Error("relay not found");
	}

	const relayActor = await getRelayActor();
	const follow = renderFollowRelay(relay, relayActor);
	const undo = renderUndo(follow, relayActor);
	const activity = renderActivity(undo);
	deliver(relayActor, activity, relay.inbox);

	await Relays.delete(relay.id);
	await updateRelaysCache();
}

export async function listRelay() {
	const relays = await Relays.find();
	return relays;
}

export async function getCachedRelays(): Promise<Relay[]> {
	return await relaysCache.fetch(null, () =>
		Relays.findBy({
			status: "accepted",
		}),
	);
}

export async function relayAccepted(id: string) {
	const result = await Relays.update(id, {
		status: "accepted",
	});

	await updateRelaysCache();

	return JSON.stringify(result);
}

async function updateRelaysCache() {
	const relays = await Relays.findBy({
		status: "accepted",
	});
	await relaysCache.set(null, relays);
}

export async function relayRejected(id: string) {
	const result = await Relays.update(id, {
		status: "rejected",
	});

	return JSON.stringify(result);
}

export async function deliverToRelays(
	user: { id: User["id"]; host: null },
	activity: any,
) {
	if (activity == null) return;

	const relays = await getCachedRelays();
	if (relays.length === 0) return;

	// TODO
	//const copy = structuredClone(activity);
	const copy = JSON.parse(JSON.stringify(activity));
	if (!copy.to) copy.to = ["https://www.w3.org/ns/activitystreams#Public"];

	const signed = await attachLdSignature(copy, user);

	for (const relay of relays) {
		deliver(user, signed, relay.inbox);
	}
}
