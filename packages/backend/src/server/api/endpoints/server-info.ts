import * as os from "node:os";
import si from "systeminformation";
import define from "../define.js";
import meilisearch from "@/db/meilisearch.js";
import { fetchMeta } from "@/misc/fetch-meta.js";

export const meta = {
	requireCredential: false,
	requireCredentialPrivateMode: true,
	allowGet: true,
	cacheSec: 30,
	tags: ["meta"],
} as const;

export const paramDef = {
	type: "object",
	properties: {},
	required: [],
} as const;

export default define(meta, paramDef, async () => {
	const memStats = await si.mem();
	const fsStats = await si.fsSize();

	let fsIndex = 0;
	// Get the first index of fs sizes that are actualy used.
	for (const [i, stat] of fsStats.entries()) {
		if (stat.rw === true && stat.used > 0) {
			fsIndex = i;
			break;
		}
	}

	const instanceMeta = await fetchMeta();
	if (!instanceMeta.enableServerMachineStats) {
		return {
			machine: "Not specified",
			cpu: {
				model: "Not specified",
				cores: 0,
			},
			mem: {
				total: 0,
			},
			fs: {
				total: 0,
				used: 0,
			},
		};
	}
	return {
		machine: os.hostname(),
		cpu: {
			model: os.cpus()[0].model,
			cores: os.cpus().length,
		},
		mem: {
			total: memStats.total,
		},
		fs: {
			total: fsStats[fsIndex].size,
			used: fsStats[fsIndex].used,
		},
	};
});

async function meilisearchStatus() {
	if (meilisearch) {
		return meilisearch.serverStats();
	} else {
		return {
			health: "unconfigured",
			size: 0,
			indexed_count: 0,
		};
	}
}
