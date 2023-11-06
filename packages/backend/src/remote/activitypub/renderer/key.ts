import config from "@/config/index.js";
import type { ILocalUser } from "@/models/entities/user.js";
import type { UserKeypair } from "@/models/entities/user-keypair.js";
import { createPublicKey } from "node:crypto";

export default (user: ILocalUser, key: UserKeypair, postfix?: string) => ({
	id: `${config.url}/users/${user.id}${postfix || "/publickey"}`,
	type: "Key",
	owner: `${config.url}/users/${user.id}`,
	publicKeyPem: createPublicKey(key.publicKey).export({
		type: "spki",
		format: "pem",
	}),
});
