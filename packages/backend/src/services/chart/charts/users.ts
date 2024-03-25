import type { KVs } from "../core.js";
import Chart from "../core.js";
import { Users } from "@/models/index.js";
import { Not, IsNull } from "typeorm";
import type { User } from "@/models/entities/user.js";
import { name, schema } from "./entities/users.js";

/**
 * ユーザー数に関するチャート
 */

export default class UsersChart extends Chart<typeof schema> {
	constructor() {
		super(name, schema);
	}

	protected async tickMajor(): Promise<Partial<KVs<typeof schema>>> {
		const [localCount, remoteCount] = await Promise.all([
			Users.countBy({ host: IsNull(), tumblrUUID: IsNull() }),
			Users.countBy({ host: Not(IsNull()) }),
		]);

		return {
			"local.total": localCount,
			"remote.total": remoteCount,
		};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	public async update(
		user: { id: User["id"]; host: User["host"] },
		isAdditional: boolean,
	): Promise<void> {
		const prefix = Users.isLocalUser(user) ? "local" : "remote";

		await this.commit({
			[`${prefix}.total`]: isAdditional ? 1 : -1,
			[`${prefix}.inc`]: isAdditional ? 1 : 0,
			[`${prefix}.dec`]: isAdditional ? 0 : 1,
		});
	}
}
