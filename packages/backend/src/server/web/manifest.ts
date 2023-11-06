import type Koa from "koa";
import { fetchMeta } from "@/misc/fetch-meta.js";
import config from "@/config/index.js";
import manifest from "./manifest.json" assert { type: "json" };

export const manifestHandler = async (ctx: Koa.Context) => {
	// TODO
	//const res = structuredClone(manifest);
	const res = JSON.parse(JSON.stringify(manifest));

	const instance = await fetchMeta(true);

	res.short_name = instance.name || "Firefish";
	res.name = instance.name || "Firefish";
	if (instance.themeColor) res.theme_color = instance.themeColor;
	for (const icon of res.icons) {
		icon.src = `${icon.src}?v=${config.version.replace(/[^0-9]/g, '')}`;
	}
	for (const screenshot of res.screenshots) {
		screenshot.src = `${screenshot.src}?v=${config.version.replace(/[^0-9]/g, '')}`;
	}
	ctx.set("Cache-Control", "max-age=300");
	ctx.body = res;
};
