/**
 * Web Client Server
 */

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import Koa from "koa";
import Router from "@koa/router";
import send from "koa-send";
import favicon from "koa-favicon";
import views from "koa-views";
import sharp from "sharp";
import { createBullBoard } from "@bull-board/api";
import { BullAdapter } from "@bull-board/api/bullAdapter.js";
import { KoaAdapter } from "@bull-board/koa";

import { In, IsNull } from "typeorm";
import { fetchMeta, metaToPugArgs } from "@/misc/fetch-meta.js";
import config from "@/config/index.js";
import {
	Users,
	Notes,
	UserProfiles,
	Pages,
	Channels,
	Clips,
	GalleryPosts,
} from "@/models/index.js";
import * as Acct from "@/misc/acct.js";
import { getNoteSummary } from "@/misc/get-note-summary.js";
import { queues } from "@/queue/queues.js";
import { genOpenapiSpec } from "../api/openapi/gen-spec.js";
import { urlPreviewHandler } from "./url-preview.js";
import { manifestHandler } from "./manifest.js";
import packFeed from "./feed.js";
import { MINUTE, DAY } from "@/const.js";

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

const staticAssets = `${_dirname}/../../../assets/`;
const clientAssets = `${_dirname}/../../../../client/assets/`;
const assets = `${_dirname}/../../../../../built/_client_dist_/`;
const swAssets = `${_dirname}/../../../../../built/_sw_dist_/`;

// Init app
const app = new Koa();

//#region Bull Dashboard
const bullBoardPath = "/queue";

// Authenticate
app.use(async (ctx, next) => {
	if (ctx.path === bullBoardPath || ctx.path.startsWith(`${bullBoardPath}/`)) {
		const token = ctx.cookies.get("token");
		if (token == null) {
			ctx.status = 401;
			return;
		}
		const user = await Users.findOneBy({ token });
		if (user == null || !(user.isAdmin || user.isModerator)) {
			ctx.status = 403;
			return;
		}
	}
	await next();
});

const serverAdapter = new KoaAdapter();

createBullBoard({
	queues: queues.map((q) => new BullAdapter(q)),
	serverAdapter,
});

serverAdapter.setBasePath(bullBoardPath);
app.use(serverAdapter.registerPlugin());
//#endregion

// Init renderer
app.use(
	views(`${_dirname}/views`, {
		extension: "pug",
		options: {
			version: config.version,
			getClientEntry: () =>
				process.env.NODE_ENV === "production"
					? config.clientEntry
					: JSON.parse(
							readFileSync(
								`${_dirname}/../../../../../built/_client_dist_/manifest.json`,
								"utf-8",
							),
					  )["src/init.ts"],
			config,
		},
	}),
);

// Serve favicon
app.use(favicon(`${_dirname}/../../../assets/favicon.ico`));

// Common request handler
app.use(async (ctx, next) => {
	// IFrameの中に入れられないようにする
	ctx.set("X-Frame-Options", "DENY");
	await next();
});

// Init router
const router = new Router();

//#region static assets

router.get("/static-assets/(.*)", async (ctx) => {
	await send(ctx as any, ctx.path.replace("/static-assets/", ""), {
		root: staticAssets,
		maxage: 7 * DAY,
	});
});

router.get("/client-assets/(.*)", async (ctx) => {
	await send(ctx as any, ctx.path.replace("/client-assets/", ""), {
		root: clientAssets,
		maxage: 7 * DAY,
	});
});

router.get("/assets/(.*)", async (ctx) => {
	await send(ctx as any, ctx.path.replace("/assets/", ""), {
		root: assets,
		maxage: 7 * DAY,
	});
});

// Apple touch icon
router.get("/apple-touch-icon.png", async (ctx) => {
	await send(ctx as any, "/apple-touch-icon.png", {
		root: staticAssets,
	});
});

router.get("/twemoji/(.*)", async (ctx) => {
	const path = ctx.path.replace("/twemoji/", "");

	if (!path.match(/^[0-9a-f-]+\.svg$/)) {
		ctx.status = 404;
		return;
	}

	ctx.set(
		"Content-Security-Policy",
		"default-src 'none'; style-src 'unsafe-inline'",
	);

	await send(ctx as any, path, {
		root: `${_dirname}/../../../node_modules/@discordapp/twemoji/dist/svg/`,
		maxage: 30 * DAY,
	});
});

router.get("/twemoji-badge/(.*)", async (ctx) => {
	const path = ctx.path.replace("/twemoji-badge/", "");

	if (!path.match(/^[0-9a-f-]+\.png$/)) {
		ctx.status = 404;
		return;
	}

	const mask = await sharp(
		`${_dirname}/../../../node_modules/@discordapp/twemoji/dist/svg/${path.replace(
			".png",
			"",
		)}.svg`,
		{ density: 1000 },
	)
		.resize(488, 488)
		.greyscale()
		.normalise()
		.linear(1.75, -(128 * 1.75) + 128) // 1.75x contrast
		.flatten({ background: "#000" })
		.extend({
			top: 12,
			bottom: 12,
			left: 12,
			right: 12,
			background: "#000",
		})
		.toColorspace("b-w")
		.png()
		.toBuffer();

	const buffer = await sharp({
		create: {
			width: 512,
			height: 512,
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		},
	})
		.pipelineColorspace("b-w")
		.boolean(mask, "eor")
		.resize(96, 96)
		.png()
		.toBuffer();

	ctx.set(
		"Content-Security-Policy",
		"default-src 'none'; style-src 'unsafe-inline'",
	);
	ctx.set("Cache-Control", "max-age=2592000");
	ctx.set("Content-Type", "image/png");
	ctx.body = buffer;
});

// ServiceWorker
router.get("/sw.js", async (ctx) => {
	await send(ctx as any, "/sw.js", {
		root: swAssets,
		maxage: 10 * MINUTE,
	});
});

// Manifest
router.get("/manifest.json", manifestHandler);

router.get("/robots.txt", async (ctx) => {
	await send(ctx as any, "/robots.txt", {
		root: staticAssets,
	});
});

//#endregion

// Docs
router.get("/api-doc", async (ctx) => {
	await send(ctx as any, "/redoc.html", {
		root: staticAssets,
	});
});

// URL preview endpoint
router.get("/url", urlPreviewHandler);

router.get("/api.json", async (ctx) => {
	ctx.body = genOpenapiSpec();
});

const getFeed = async (
	acct: string,
	threadDepth: string,
	historyCount: string,
	noteInTitle: string,
	noRenotes: string,
	noReplies: string,
) => {
	const meta = await fetchMeta();
	if (meta.privateMode) {
		return;
	}
	const { username, host } = Acct.parse(acct);
	const user = await Users.findOneBy({
		usernameLower: username.toLowerCase(),
		host: host ?? IsNull(),
		isSuspended: false,
		isLocked: false,
	});
	if (!user) {
		return;
	}
	let thread = parseInt(threadDepth, 10);
	if (isNaN(thread) || thread < 0 || thread > 30) {
		thread = 3;
	}
	let history = parseInt(historyCount, 10);
	//cant be 0 here or it will get all posts
	if (isNaN(history) || history <= 0 || history > 30) {
		history = 20;
	}
	return (
		user &&
		(await packFeed(
			user,
			thread,
			history,
			!isNaN(noteInTitle),
			isNaN(noRenotes),
			isNaN(noReplies),
		))
	);
};

// As the /@user[.json|.rss|.atom]/sub endpoint is complicated, we will use a regex to switch between them.
const reUser = new RegExp(
	"^/@(?<user>[^/]+?)(?:.(?<feed>json|rss|atom)(?:\\?[^/]*)?)?(?:/(?<sub>[^/]+))?$",
);
router.get(reUser, async (ctx, next) => {
	const groups = reUser.exec(ctx.originalUrl)?.groups;
	if (!groups) {
		await next();
		return;
	}

	ctx.params = groups;

	//console.log(ctx, ctx.params, ctx.query);
	if (groups.feed) {
		if (groups.sub) {
			await next();
			return;
		}

		switch (groups.feed) {
			case "json":
				await jsonFeed(ctx, next);
				break;
			case "rss":
				await rssFeed(ctx, next);
				break;
			case "atom":
				await atomFeed(ctx, next);
				break;
		}
		return;
	}

	await userPage(ctx, next);
});

// Atom
const atomFeed: Router.Middleware = async (ctx) => {
	const feed = await getFeed(
		ctx.params.user,
		ctx.query.thread,
		ctx.query.history,
		ctx.query.noteintitle,
		ctx.query.norenotes,
		ctx.query.noreplies,
	);

	if (feed) {
		ctx.set("Content-Type", "application/atom+xml; charset=utf-8");
		ctx.body = feed.atom1();
	} else {
		ctx.status = 404;
	}
};

// RSS
const rssFeed: Router.Middleware = async (ctx) => {
	const feed = await getFeed(
		ctx.params.user,
		ctx.query.thread,
		ctx.query.history,
		ctx.query.noteintitle,
		ctx.query.norenotes,
		ctx.query.noreplies,
	);

	if (feed) {
		ctx.set("Content-Type", "application/rss+xml; charset=utf-8");
		ctx.body = feed.rss2();
	} else {
		ctx.status = 404;
	}
};

// JSON
const jsonFeed: Router.Middleware = async (ctx) => {
	const feed = await getFeed(
		ctx.params.user,
		ctx.query.thread,
		ctx.query.history,
		ctx.query.noteintitle,
		ctx.query.norenotes,
		ctx.query.noreplies,
	);

	if (feed) {
		ctx.set("Content-Type", "application/json; charset=utf-8");
		ctx.body = feed.json1();
	} else {
		ctx.status = 404;
	}
};

//#region SSR (for crawlers)
// User
const userPage: Router.Middleware = async (ctx, next) => {
	const userParam = ctx.params.user;
	const subParam = ctx.params.sub;
	const { username, host } = Acct.parse(userParam);

	const user = await Users.findOneBy({
		usernameLower: username.toLowerCase(),
		host: host ?? IsNull(),
		isSuspended: false,
	});

	if (user === null) {
		await next();
		return;
	}

	const profile = await UserProfiles.findOneByOrFail({ userId: user.id });
	const meta = await fetchMeta();
	const me = profile.fields
		? profile.fields
				.filter((filed) => filed.value?.match(/^https?:/))
				.map((field) => field.value)
		: [];

	const userDetail = {
		...metaToPugArgs(meta),
		user,
		profile,
		me,
		avatarUrl: await Users.getAvatarUrl(user),
		sub: subParam,
	};

	await ctx.render("user", userDetail);
	ctx.set("Cache-Control", "public, max-age=15");
};

router.get("/users/:user", async (ctx) => {
	const user = await Users.findOneBy({
		id: ctx.params.user,
		host: IsNull(),
		isSuspended: false,
	});

	if (user == null) {
		ctx.status = 404;
		return;
	}

	ctx.redirect(`/@${user.username}${user.host == null ? "" : `@${user.host}`}`);
});

// Note
router.get("/notes/:note", async (ctx, next) => {
	const note = await Notes.findOneBy({
		id: ctx.params.note,
		visibility: In(["public", "home"]),
	});

	try {
		if (note) {
			const _note = await Notes.pack(note);

			const profile = await UserProfiles.findOneByOrFail({
				userId: note.userId,
			});
			const meta = await fetchMeta();
			await ctx.render("note", {
				...metaToPugArgs(meta),
				note: _note,
				profile,
				avatarUrl: await Users.getAvatarUrl(
					await Users.findOneByOrFail({ id: note.userId }),
				),
				// TODO: Let locale changeable by instance setting
				summary: getNoteSummary(_note),
			});

			ctx.set("Cache-Control", "public, max-age=15");
			ctx.set(
				"Content-Security-Policy",
				"default-src 'self' 'unsafe-inline'; img-src *; frame-ancestors *",
			);

			return;
		}
	} catch {}

	await next();
});

router.get("/posts/:note", async (ctx, next) => {
	const note = await Notes.findOneBy({
		id: ctx.params.note,
		visibility: In(["public", "home"]),
	});

	if (note) {
		const _note = await Notes.pack(note);
		const profile = await UserProfiles.findOneByOrFail({ userId: note.userId });
		const meta = await fetchMeta();
		await ctx.render("note", {
			...metaToPugArgs(meta),
			note: _note,
			profile,
			avatarUrl: await Users.getAvatarUrl(
				await Users.findOneByOrFail({ id: note.userId }),
			),
			// TODO: Let locale changeable by instance setting
			summary: getNoteSummary(_note),
		});

		ctx.set("Cache-Control", "public, max-age=15");

		return;
	}

	await next();
});

// Page
router.get("/@:user/pages/:page", async (ctx, next) => {
	const { username, host } = Acct.parse(ctx.params.user);
	const user = await Users.findOneBy({
		usernameLower: username.toLowerCase(),
		host: host ?? IsNull(),
	});

	if (user == null) return;

	const page = await Pages.findOneBy({
		name: ctx.params.page,
		userId: user.id,
	});

	if (page) {
		const _page = await Pages.pack(page);
		const profile = await UserProfiles.findOneByOrFail({ userId: page.userId });
		const meta = await fetchMeta();
		await ctx.render("page", {
			...metaToPugArgs(meta),
			page: _page,
			profile,
			avatarUrl: await Users.getAvatarUrl(
				await Users.findOneByOrFail({ id: page.userId }),
			),
		});

		if (["public"].includes(page.visibility)) {
			ctx.set("Cache-Control", "public, max-age=15");
		} else {
			ctx.set("Cache-Control", "private, max-age=0, must-revalidate");
		}

		return;
	}

	await next();
});

// Clip
// TODO: handling of private clips
router.get("/clips/:clip", async (ctx, next) => {
	const clip = await Clips.findOneBy({
		id: ctx.params.clip,
	});

	if (clip) {
		const _clip = await Clips.pack(clip);
		const profile = await UserProfiles.findOneByOrFail({ userId: clip.userId });
		const meta = await fetchMeta();
		await ctx.render("clip", {
			...metaToPugArgs(meta),
			clip: _clip,
			profile,
			avatarUrl: await Users.getAvatarUrl(
				await Users.findOneByOrFail({ id: clip.userId }),
			),
		});

		ctx.set("Cache-Control", "public, max-age=15");

		return;
	}

	await next();
});

// Gallery post
router.get("/gallery/:post", async (ctx, next) => {
	const post = await GalleryPosts.findOneBy({ id: ctx.params.post });

	if (post) {
		const _post = await GalleryPosts.pack(post);
		const profile = await UserProfiles.findOneByOrFail({ userId: post.userId });
		const meta = await fetchMeta();
		await ctx.render("gallery-post", {
			...metaToPugArgs(meta),
			post: _post,
			profile,
			avatarUrl: await Users.getAvatarUrl(
				await Users.findOneByOrFail({ id: post.userId }),
			),
		});

		ctx.set("Cache-Control", "public, max-age=15");

		return;
	}

	await next();
});

// Channel
router.get("/channels/:channel", async (ctx, next) => {
	const channel = await Channels.findOneBy({
		id: ctx.params.channel,
	});

	if (channel) {
		const _channel = await Channels.pack(channel);
		const meta = await fetchMeta();
		await ctx.render("channel", {
			...metaToPugArgs(meta),
			channel: _channel,
		});

		ctx.set("Cache-Control", "public, max-age=15");

		return;
	}

	await next();
});
//#endregion

router.get("/bios", async (ctx) => {
	await ctx.render("bios", {
		version: config.version,
	});
});

router.get("/cli", async (ctx) => {
	await ctx.render("cli", {
		version: config.version,
	});
});

const override = (source: string, target: string, depth = 0) =>
	[
		undefined,
		...target.split("/").filter((x) => x),
		...source
			.split("/")
			.filter((x) => x)
			.splice(depth),
	].join("/");

router.get("/flush", async (ctx) => {
	await ctx.render("flush");
});

// If a non-WebSocket request comes in to streaming and base html is returned with cache, the path will be cached by Proxy, etc. and it will be wrong.
router.get("/streaming", async (ctx) => {
	ctx.status = 503;
	ctx.set("Cache-Control", "private, max-age=0");
});
router.get("/api/v1/streaming", async (ctx) => {
	ctx.status = 503;
	ctx.set("Cache-Control", "private, max-age=0");
});

// Render base html for all requests
router.get("(.*)", async (ctx) => {
	const meta = await fetchMeta();

	await ctx.render("base", {
		...metaToPugArgs(meta),
	});
	ctx.set("Cache-Control", "public, max-age=3");
});

// Register router
app.use(router.routes());

export default app;
