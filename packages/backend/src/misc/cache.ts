import { redisClient } from "@/db/redis.js";
import { encode, decode } from "msgpackr";
import { ChainableCommander } from "ioredis";

export class Cache<T> {
	private ttl: number;
	private prefix: string;

	constructor(name: string, ttlSeconds: number) {
		this.ttl = ttlSeconds;
		this.prefix = `cache:${name}`;
	}

	private prefixedKey(key: string | null): string {
		return key ? `${this.prefix}:${key}` : this.prefix;
	}

	public async set(
		key: string | null,
		value: T,
		transaction?: ChainableCommander,
	): Promise<void> {
		const _key = this.prefixedKey(key);
		const _value = Buffer.from(encode(value));
		const commander = transaction ?? redisClient;
		await commander.set(_key, _value, "EX", this.ttl);
	}

	public async get(key: string | null, renew = false): Promise<T | undefined> {
		const _key = this.prefixedKey(key);
		const cached = await redisClient.getBuffer(_key);
		if (cached === null) return undefined;

		if (renew) await redisClient.expire(_key, this.ttl);

		return decode(cached) as T;
	}

	public async getAll(renew = false): Promise<Map<string, T>> {
		const keys = await redisClient.keys(`${this.prefix}*`);
		const map = new Map<string, T>();
		if (keys.length === 0) {
			return map;
		}
		const values = await redisClient.mgetBuffer(keys);

		for (const [i, key] of keys.entries()) {
			const val = values[i];
			if (val !== null) {
				map.set(key, decode(val) as T);
			}
		}

		if (renew) {
			const trans = redisClient.multi();
			for (const key of map.keys()) {
				trans.expire(key, this.ttl);
			}
			await trans.exec();
		}

		return map;
	}

	public async delete(...keys: (string | null)[]): Promise<void> {
		if (keys.length > 0) {
			const _keys = keys.map(this.prefixedKey);
			await redisClient.del(_keys);
		}
	}

	/**
	 * Returns if cached value exists. Otherwise, calls fetcher and caches.
	 * Overwrites cached value if invalidated by the optional validator.
	 */
	public async fetch(
		key: string | null,
		fetcher: () => Promise<T>,
		renew = false,
		validator?: (cachedValue: T) => boolean,
	): Promise<T> {
		const cachedValue = await this.get(key, renew);
		if (cachedValue !== undefined) {
			if (validator) {
				if (validator(cachedValue)) {
					// Cache HIT
					return cachedValue;
				}
			} else {
				// Cache HIT
				return cachedValue;
			}
		}

		// Cache MISS
		const value = await fetcher();
		await this.set(key, value);
		return value;
	}

	/**
	 * Returns if cached value exists. Otherwise, calls fetcher and caches if the fetcher returns a value.
	 * Overwrites cached value if invalidated by the optional validator.
	 */
	public async fetchMaybe(
		key: string | null,
		fetcher: () => Promise<T | undefined>,
		renew = false,
		validator?: (cachedValue: T) => boolean,
	): Promise<T | undefined> {
		const cachedValue = await this.get(key, renew);
		if (cachedValue !== undefined) {
			if (validator) {
				if (validator(cachedValue)) {
					// Cache HIT
					return cachedValue;
				}
			} else {
				// Cache HIT
				return cachedValue;
			}
		}

		// Cache MISS
		const value = await fetcher();
		if (value !== undefined) {
			await this.set(key, value);
		}
		return value;
	}
}
