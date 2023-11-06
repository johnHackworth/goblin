import { UserKeypairs } from "@/models/index.js";
import type { User } from "@/models/entities/user.js";
import type { UserKeypair } from "@/models/entities/user-keypair.js";
import { Cache } from "./cache.js";

const cache = new Cache<UserKeypair>("keypairStore", 60 * 30);

export async function getUserKeypair(userId: User["id"]): Promise<UserKeypair> {
	return await cache.fetch(
		userId,
		() => UserKeypairs.findOneByOrFail({ userId: userId }),
		true,
	);
}
