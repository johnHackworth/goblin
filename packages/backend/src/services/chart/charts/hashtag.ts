import type { KVs } from "../core.js";
import Chart from "../core.js";
import type { User } from "@/models/entities/user.js";
import { Users } from "@/models/index.js";
import { name, schema } from "./entities/hashtag.js";

/**
 * ハッシュタグに関するチャート
 */

export default class HashtagChart extends Chart<typeof schema> {
	constructor() {
		super(name, schema, true);
	}

	protected async tickMajor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	public async update(
		hashtag: string,
		user: { id: User["id"]; host: User["host"] },
	): Promise<void> {
		await this.commit(
			{
				"local.users": Users.isLocalUser(user) ? [user.id] : [],
				"remote.users": Users.isLocalUser(user) ? [] : [user.id],
			},
			hashtag,
		);
	}
}
