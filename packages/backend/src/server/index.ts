/**
 * Core Server
 */

import cluster from "node:cluster";
import * as fs from "node:fs";
import * as http from "node:http";
import Koa from "koa";
import Router from "@koa/router";
import cors from "@koa/cors";
import mount from "koa-mount";
import koaLogger from "koa-logger";
import * as slow from "koa-slow";

import { IsNull } from "typeorm";
import config from "@/config/index.js";
import Logger from "@/services/logger.js";
import { UserProfiles, Users } from "@/models/index.js";
import { fetchMeta } from "@/misc/fetch-meta.js";
import { genIdenticon } from "@/misc/gen-identicon.js";
import { createTemp } from "@/misc/create-temp.js";
import { publishMainStream } from "@/services/stream.js";
import * as Acct from "@/misc/acct.js";
import { envOption } from "@/env.js";
import megalodon, { MegalodonInterface } from "megalodon";
import activityPub from "./activitypub.js";
import nodeinfo from "./nodeinfo.js";
import wellKnown from "./well-known.js";
import apiServer from "./api/index.js";
import fileServer from "./file/index.js";
import proxyServer from "./proxy/index.js";
import webServer from "./web/index.js";
import { initializeStreamingServer } from "./api/streaming.js";
import { koaBody } from "koa-body";
import removeTrailingSlash from "koa-remove-trailing-slashes";
import { v4 as uuid } from "uuid";

export const serverLogger = new Logger("server", "gray", false);

// Init app
const app = new Koa();
app.proxy = true;

app.use(removeTrailingSlash());

app.use(
	cors({
		origin: "*",
	}),
);

if (!["production", "test"].includes(process.env.NODE_ENV || "")) {
	// Logger
	app.use(
		koaLogger((str) => {
			serverLogger.info(str);
		}),
	);

	// Delay
	if (envOption.slow) {
		app.use(
			slow({
				delay: 3000,
			}),
		);
	}
}

// HSTS
// 6months (15552000sec)
if (config.url.startsWith("https") && !config.disableHsts) {
	app.use(async (ctx, next) => {
		ctx.set("strict-transport-security", "max-age=15552000; preload");
		await next();
	});
}

app.use(mount("/api", apiServer));
app.use(mount("/files", fileServer));
app.use(mount("/proxy", proxyServer));

// Init router
const router = new Router();
const mastoRouter = new Router();

mastoRouter.use(
	koaBody({
		urlencoded: true,
		multipart: true,
	}),
);

mastoRouter.use(async (ctx, next) => {
	if (ctx.request.query) {
		if (!ctx.request.body || Object.keys(ctx.request.body).length === 0) {
			ctx.request.body = ctx.request.query;
		} else {
			ctx.request.body = { ...ctx.request.body, ...ctx.request.query };
		}
	}
	await next();
});

// Routing
router.use(activityPub.routes());
router.use(nodeinfo.routes());
router.use(wellKnown.routes());

router.get("/avatar/@:acct", async (ctx) => {
	const { username, host } = Acct.parse(ctx.params.acct);
	const user = await Users.findOne({
		where: {
			usernameLower: username.toLowerCase(),
			host: host == null || host === config.host ? IsNull() : host,
			isSuspended: false,
		},
		relations: ["avatar"],
	});

	if (user) {
		ctx.redirect(Users.getAvatarUrlSync(user));
	} else {
		ctx.redirect("/static-assets/user-unknown.png");
	}
});

router.get("/identicon/:x", async (ctx) => {
	const meta = await fetchMeta();
	if (meta.enableIdenticonGeneration) {
		const [temp, cleanup] = await createTemp();
		await genIdenticon(ctx.params.x, fs.createWriteStream(temp));
		ctx.set("Content-Type", "image/png");
		ctx.body = fs.createReadStream(temp).on("close", () => cleanup());
	} else {
		ctx.redirect("/static-assets/avatar.png");
	}
});

mastoRouter.get("/oauth/authorize", async (ctx) => {
	const { client_id, state, redirect_uri } = ctx.request.query;
	console.log(ctx.request.req);
	let param = "mastodon=true";
	if (state) param += `&state=${state}`;
	if (redirect_uri) param += `&redirect_uri=${redirect_uri}`;
	const client = client_id ? client_id : "";
	ctx.redirect(
		`${Buffer.from(client.toString(), "base64").toString()}?${param}`,
	);
});

mastoRouter.post("/oauth/token", async (ctx) => {
	const body: any = ctx.request.body || ctx.request.query;
	console.log("token-request", body);
	console.log("token-query", ctx.request.query);
	if (body.grant_type === "client_credentials") {
		const ret = {
			access_token: uuid(),
			token_type: "Bearer",
			scope: "read",
			created_at: Math.floor(new Date().getTime() / 1000),
		};
		ctx.body = ret;
		return;
	}
	let client_id: any = body.client_id;
	const BASE_URL = `${ctx.request.protocol}://${ctx.request.hostname}`;
	const generator = (megalodon as any).default;
	const client = generator(BASE_URL, null) as MegalodonInterface;
	let m = null;
	let token = null;
	if (body.code) {
		//m = body.code.match(/^([a-zA-Z0-9]{8})([a-zA-Z0-9]{4})([a-zA-Z0-9]{4})([a-zA-Z0-9]{4})([a-zA-Z0-9]{12})/);
		//if (!m.length) {
		//	ctx.body = { error: "Invalid code" };
		//	return;
		//}
		//token = `${m[1]}-${m[2]}-${m[3]}-${m[4]}-${m[5]}`
		console.log(body.code, token);
		token = body.code;
	}
	if (client_id instanceof Array) {
		client_id = client_id.toString();
	} else if (!client_id) {
		client_id = null;
	}
	try {
		const atData = await client.fetchAccessToken(
			client_id,
			body.client_secret,
			token ? token : "",
		);
		const ret = {
			access_token: atData.accessToken,
			token_type: "Bearer",
			scope: body.scope || "read write follow push",
			created_at: Math.floor(new Date().getTime() / 1000),
		};
		console.log("token-response", ret);
		ctx.body = ret;
	} catch (err: any) {
		console.error(err);
		ctx.status = 401;
		ctx.body = err.response.data;
	}
});

// Register router
app.use(mastoRouter.routes());
app.use(router.routes());

app.use(mount(webServer));

function createServer() {
	return http.createServer(app.callback());
}

// For testing
export const startServer = () => {
	const server = createServer();

	initializeStreamingServer(server);

	server.listen(config.port);

	return server;
};

export default () =>
	new Promise((resolve) => {
		const server = createServer();

		initializeStreamingServer(server);

		server.on("error", (e) => {
			switch ((e as any).code) {
				case "EACCES":
					serverLogger.error(
						`You do not have permission to listen on port ${config.port}.`,
					);
					break;
				case "EADDRINUSE":
					serverLogger.error(
						`Port ${config.port} is already in use by another process.`,
					);
					break;
				default:
					serverLogger.error(e);
					break;
			}

			if (cluster.isWorker) {
				process.send!("listenFailed");
			} else {
				// disableClustering
				process.exit(1);
			}
		});

		// @ts-ignore
		server.listen(config.port, resolve);
	});
