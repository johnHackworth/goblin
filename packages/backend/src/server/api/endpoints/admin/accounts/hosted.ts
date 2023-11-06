import config from "@/config/index.js";
import { Meta } from "@/models/entities/meta.js";
import { insertModerationLog } from "@/services/insert-moderation-log.js";
import { db } from "@/db/postgre.js";
import define from "../../../define.js";

export const meta = {
	tags: ["admin"],

	requireCredential: true,
	requireAdmin: true,
} as const;

export const paramDef = {
	type: "object",
	properties: {},
	required: [],
} as const;

export default define(meta, paramDef, async (ps, me) => {
	const hostedConfig = config.isManagedHosting;
	const hosted = hostedConfig != null && hostedConfig === true;
	if (hosted) {
		const set = {} as Partial<Meta>;
		if (config.deepl.managed != null && config.deepl.managed === true) {
			if (typeof config.deepl.authKey === "boolean") {
				set.deeplAuthKey = config.deepl.authKey;
			}
			if (typeof config.deepl.isPro === "boolean") {
				set.deeplIsPro = config.deepl.isPro;
			}
		}
		if (
			config.libreTranslate.managed != null &&
			config.libreTranslate.managed === true
		) {
			if (typeof config.libreTranslate.apiUrl === "string") {
				set.libreTranslateApiUrl = config.libreTranslate.apiUrl;
			}
			if (typeof config.libreTranslate.apiKey === "string") {
				set.libreTranslateApiKey = config.libreTranslate.apiKey;
			}
		}
		if (config.email.managed != null && config.email.managed === true) {
			set.enableEmail = true;
			if (typeof config.email.address === "string") {
				set.email = config.email.address;
			}
			if (typeof config.email.host === "string") {
				set.smtpHost = config.email.host;
			}
			if (typeof config.email.port === "number") {
				set.smtpPort = config.email.port;
			}
			if (typeof config.email.user === "string") {
				set.smtpUser = config.email.user;
			}
			if (typeof config.email.pass === "string") {
				set.smtpPass = config.email.pass;
			}
			if (typeof config.email.useImplicitSslTls === "boolean") {
				set.smtpSecure = config.email.useImplicitSslTls;
			}
		}
		if (
			config.objectStorage.managed != null &&
			config.objectStorage.managed === true
		) {
			set.useObjectStorage = true;
			if (typeof config.objectStorage.baseUrl === "string") {
				set.objectStorageBaseUrl = config.objectStorage.baseUrl;
			}
			if (typeof config.objectStorage.bucket === "string") {
				set.objectStorageBucket = config.objectStorage.bucket;
			}
			if (typeof config.objectStorage.prefix === "string") {
				set.objectStoragePrefix = config.objectStorage.prefix;
			}
			if (typeof config.objectStorage.endpoint === "string") {
				set.objectStorageEndpoint = config.objectStorage.endpoint;
			}
			if (typeof config.objectStorage.region === "string") {
				set.objectStorageRegion = config.objectStorage.region;
			}
			if (typeof config.objectStorage.accessKey === "string") {
				set.objectStorageAccessKey = config.objectStorage.accessKey;
			}
			if (typeof config.objectStorage.secretKey === "string") {
				set.objectStorageSecretKey = config.objectStorage.secretKey;
			}
			if (typeof config.objectStorage.useSsl === "boolean") {
				set.objectStorageUseSSL = config.objectStorage.useSsl;
			}
			if (typeof config.objectStorage.connnectOverProxy === "boolean") {
				set.objectStorageUseProxy = config.objectStorage.connnectOverProxy;
			}
			if (typeof config.objectStorage.setPublicReadOnUpload === "boolean") {
				set.objectStorageSetPublicRead =
					config.objectStorage.setPublicReadOnUpload;
			}
			if (typeof config.objectStorage.s3ForcePathStyle === "boolean") {
				set.objectStorageS3ForcePathStyle =
					config.objectStorage.s3ForcePathStyle;
			}
		}
		if (config.summalyProxyUrl !== undefined) {
			set.summalyProxy = config.summalyProxyUrl;
		}
		await db.transaction(async (transactionalEntityManager) => {
			const metas = await transactionalEntityManager.find(Meta, {
				order: {
					id: "DESC",
				},
			});

			const meta = metas[0];

			if (meta) {
				await transactionalEntityManager.update(Meta, meta.id, set);
			} else {
				await transactionalEntityManager.save(Meta, set);
			}
		});
		insertModerationLog(me, "updateMeta");
	}
	return hosted;
});
