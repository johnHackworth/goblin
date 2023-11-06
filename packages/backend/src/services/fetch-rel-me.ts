import { getHtml } from "@/misc/fetch.js";
import { JSDOM } from "jsdom";
import config from "@/config/index.js";

async function getRelMeLinks(url: string): Promise<string[]> {
	try {
		const html = await getHtml(url);
		const dom = new JSDOM(html);
		const relMeLinks = [
			...dom.window.document.querySelectorAll("a[rel='me']"),
			...dom.window.document.querySelectorAll("link[rel='me']"),
		].map((a) => (a as HTMLAnchorElement | HTMLLinkElement).href);
		return relMeLinks;
	} catch {
		return [];
	}
}

export async function verifyLink(
	link: string,
	username: string,
): Promise<boolean> {
	let verified = false;
	if (link.startsWith("http")) {
		const relMeLinks = await getRelMeLinks(link);
		verified = relMeLinks.some((href) =>
			new RegExp(
				`^https?:\/\/${config.host.replace(
					/[.*+\-?^${}()|[\]\\]/g,
					"\\$&",
				)}\/@${username.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&")}$`,
			).test(href),
		);
	}
	return verified;
}
