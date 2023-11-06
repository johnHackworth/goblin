import config from "@/config/index.js";
import {
	nativeCreateId,
	nativeInitIdGenerator,
} from "native-utils/built/index.js";

const length = Math.min(Math.max(config.cuid?.length ?? 16, 16), 24);
const fingerprint = config.cuid?.fingerprint ?? "";
nativeInitIdGenerator(length, fingerprint);

/**
 * The generated ID results in the form of `[8 chars timestamp] + [cuid2]`.
 * The minimum and maximum lengths are 16 and 24, respectively.
 * With the length of 16, namely 8 for cuid2, roughly 1427399 IDs are needed
 * in the same millisecond to reach 50% chance of collision.
 *
 * Ref: https://github.com/paralleldrive/cuid2#parameterized-length
 */
export function genId(date?: Date): string {
	return nativeCreateId((date ?? new Date()).getTime());
}
