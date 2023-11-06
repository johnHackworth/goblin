import type { Instance } from "@/models/entities/instance.js";
import { Instances } from "@/models/index.js";
import { genId } from "@/misc/gen-id.js";
import { toPuny } from "@/misc/convert-host.js";
import { Cache } from "@/misc/cache.js";

const cache = new Cache<Instance>("registerOrFetchInstanceDoc", 60 * 60);

export async function registerOrFetchInstanceDoc(
	host: string,
): Promise<Instance> {
	const _host = toPuny(host);

	const cached = await cache.get(_host);
	if (cached) return cached;

	const index = await Instances.findOneBy({ host: _host });

	if (index == null) {
		const i = await Instances.insert({
			id: genId(),
			host: _host,
			caughtAt: new Date(),
			lastCommunicatedAt: new Date(),
		}).then((x) => Instances.findOneByOrFail(x.identifiers[0]));

		await cache.set(_host, i);
		return i;
	} else {
		await cache.set(_host, index);
		return index;
	}
}
