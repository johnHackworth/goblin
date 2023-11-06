import { Brackets } from "typeorm";
import { fetchMeta } from "@/misc/fetch-meta.js";
import { Instances } from "@/models/index.js";
import type { Instance } from "@/models/entities/instance.js";
import { DAY } from "@/const.js";
import { shouldBlockInstance } from "./should-block-instance.js";

// Threshold from last contact after which an instance will be considered
// "dead" and should no longer get activities delivered to it.
const deadThreshold = 7 * DAY;

/**
 * Returns the subset of hosts which should be skipped.
 *
 * @param hosts array of punycoded instance hosts
 * @returns array of punycoed instance hosts that should be skipped (subset of hosts parameter)
 */
export async function skippedInstances(
	hosts: Instance["host"][],
): Promise<Instance["host"][]> {
	// first check for blocked instances since that info may already be in memory
	const meta = await fetchMeta();
	const shouldSkip = await Promise.all(
		hosts.map((host) => shouldBlockInstance(host, meta)),
	);
	const skipped = hosts.filter((_, i) => shouldSkip[i]);

	// if possible return early and skip accessing the database
	if (skipped.length === hosts.length) return hosts;

	const deadTime = new Date(Date.now() - deadThreshold);

	return skipped.concat(
		await Instances.createQueryBuilder("instance")
			.where("instance.host in (:...hosts)", {
				// don't check hosts again that we already know are suspended
				// also avoids adding duplicates to the list
				hosts: hosts.filter((host) => !skipped.includes(host)),
			})
			.andWhere(
				new Brackets((qb) => {
					qb.where("instance.isSuspended");
				}),
			)
			.select("host")
			.getRawMany(),
	);
}

/**
 * Returns whether a specific host (punycoded) should be skipped.
 * Convenience wrapper around skippedInstances which should only be used if there is a single host to check.
 * If you have multiple hosts, consider using skippedInstances instead to do a bulk check.
 *
 * @param host punycoded instance host
 * @returns whether the given host should be skipped
 */
export async function shouldSkipInstance(
	host: Instance["host"],
): Promise<boolean> {
	const skipped = await skippedInstances([host]);
	return skipped.length > 0;
}
