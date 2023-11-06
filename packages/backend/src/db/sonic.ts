import * as SonicChannel from "sonic-channel";
import { dbLogger } from "./logger.js";

import config from "@/config/index.js";

const logger = dbLogger.createSubLogger("sonic", "gray", false);

const handlers = (type: string): SonicChannel.Handlers => ({
	connected: () => {
		logger.succ(`Connected to Sonic ${type}`);
	},
	disconnected: (error) => {
		logger.warn(`Disconnected from Sonic ${type}, error: ${error}`);
	},
	error: (error) => {
		logger.warn(`Sonic ${type} error: ${error}`);
	},
	retrying: () => {
		logger.info(`Sonic ${type} retrying`);
	},
	timeout: () => {
		logger.warn(`Sonic ${type} timeout`);
	},
});

const hasConfig =
	config.sonic && (config.sonic.host || config.sonic.port || config.sonic.auth);

if (hasConfig) {
	logger.info("Connecting to Sonic");
}

const host = hasConfig ? config.sonic.host ?? "localhost" : "";
const port = hasConfig ? config.sonic.port ?? 1491 : 0;
const auth = hasConfig ? config.sonic.auth ?? "SecretPassword" : "";
const collection = hasConfig ? config.sonic.collection ?? "main" : "";
const bucket = hasConfig ? config.sonic.bucket ?? "default" : "";

export default hasConfig
	? {
			search: new SonicChannel.Search({ host, port, auth }).connect(
				handlers("search"),
			),
			ingest: new SonicChannel.Ingest({ host, port, auth }).connect(
				handlers("ingest"),
			),

			collection,
			bucket,
	  }
	: null;
