import { createHash } from "node:crypto";
import { toSingle } from "@/prelude/array.js";

export function verifyDigest(
	body: string | undefined,
	digest: string | string[] | undefined,
): boolean {
	digest = toSingle(digest);
	if (
		body == null ||
		digest == null ||
		!digest.toLowerCase().startsWith("sha-256=")
	)
		return false;

	return (
		createHash("sha256").update(body).digest("base64") === digest.substring(8)
	);
}
