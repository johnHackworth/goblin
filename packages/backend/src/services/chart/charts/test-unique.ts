import type { KVs } from "../core.js";
import Chart from "../core.js";
import { name, schema } from "./entities/test-unique.js";

/**
 * For testing
 */

export default class TestUniqueChart extends Chart<typeof schema> {
	constructor() {
		super(name, schema);
	}

	protected async tickMajor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	public async uniqueIncrement(key: string): Promise<void> {
		await this.commit({
			foo: [key],
		});
	}
}
