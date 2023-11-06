import define from "../define.js";
import { redisClient } from "@/db/redis.js";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

export const meta = {
	tags: ["meta"],
	description: "Get Firefish patrons",

	requireCredential: false,
	requireCredentialPrivateMode: false,
} as const;

export const paramDef = {
	type: "object",
	properties: {
		forceUpdate: { type: "boolean", default: false },
	},
	required: [],
} as const;

export default define(meta, paramDef, async (ps) => {
	let patrons;
	const cachedPatrons = await redisClient.get("patrons");
	if (!ps.forceUpdate && cachedPatrons) {
		patrons = JSON.parse(cachedPatrons);
	} else {
		AbortSignal.timeout ??= function timeout(ms) {
			const ctrl = new AbortController();
			setTimeout(() => ctrl.abort(), ms);
			return ctrl.signal;
		};

		patrons = await fetch(
			"https://git.joinfirefish.org/firefish/firefish/-/raw/develop/patrons.json",
			{ signal: AbortSignal.timeout(2000) },
		)
			.then((response) => response.json())
			.catch(() => {
				const staticPatrons = JSON.parse(
					fs.readFileSync(
						`${_dirname}/../../../../../../patrons.json`,
						"utf-8",
					),
				);
				patrons = cachedPatrons ? JSON.parse(cachedPatrons) : staticPatrons;
			});
		await redisClient.set("patrons", JSON.stringify(patrons), "EX", 3600);
	}
	return {
		patrons: patrons["patrons"],
		sponsors: patrons["sponsors"],
	};
});
