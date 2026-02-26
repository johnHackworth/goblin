import Parser from "rss-parser";
import { getResponse } from "@/misc/fetch.js";

const parser = new Parser({
	customFields: {
		item: [
			["media:content", "mediaContent"],
			["content:encoded", "contentEncoded"],
			["media:thumbnail", "mediaThumbnail"],
		],
	},
});

const COMMON_FEED_PATHS = [
	"/feed",
	"/rss",
	"/rss.xml",
	"/feed.xml",
	"/atom.xml",
	"/index.xml",
	"/blog/feed",
	"/blog/rss",
	"/feed/rss",
	"/feed/atom",
	"/rss/feed",
];

function isLikelyFeedUrl(url: string): boolean {
	const urlObj = new URL(url);
	const path = urlObj.pathname.toLowerCase();
	const extension = path.split(".").pop()?.toLowerCase();

	return (
		extension === "xml" ||
		extension === "rss" ||
		extension === "atom" ||
		path.includes("/feed") ||
		path.includes("/rss")
	);
}

async function tryParseFeed(url: string): Promise<ParseResult> {
	try {
		const res = await getResponse({
			url,
			method: "GET",
			headers: {
				Accept: "application/rss+xml, application/xml, text/xml, */*",
				"User-Agent": "Goblin/1.0 RSS Reader",
			},
		});

		if (!res.ok) {
			return {
				success: false,
				error: `HTTP ${res.status}: ${res.statusText}`,
			};
		}

		const text = await res.text();
		const feed = await parser.parseString(text);

		return {
			success: true,
			feed: {
				title: feed.title || "Untitled Feed",
				description: feed.description || null,
				link: feed.link || null,
				items: feed.items.map((item) => ({
					title: item.title || null,
					link: item.link || null,
					guid: item.guid || item.link || null,
					pubDate: item.pubDate ? new Date(item.pubDate) : null,
					content: item.contentEncoded || item.content || null,
					description:
						(item as any).contentSnippet ||
						(item as any).summary ||
						(item as any).description ||
						null,
					mediaContent: (item as any).mediaContent || null,
					mediaThumbnail: (item as any).mediaThumbnail || null,
				})),
			},
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

export interface RssItem {
	title: string | null;
	link: string | null;
	guid: string | null;
	pubDate: Date | null;
	content: string | null;
	description: string | null;
	mediaContent: Array<{ $: { url: string }; type?: string }> | null;
	mediaThumbnail: Array<{ $: { url: string } }> | null;
}

export interface RssFeedData {
	title: string;
	description: string | null;
	link: string | null;
	items: RssItem[];
}

export interface ParseResult {
	success: boolean;
	feed?: RssFeedData;
	error?: string;
}

export async function parseFeed(url: string): Promise<ParseResult> {
	let result = await tryParseFeed(url);

	if (!result.success && !isLikelyFeedUrl(url)) {
		const urlObj = new URL(url);
		const baseUrl = `${urlObj.protocol}//${
			urlObj.host
		}${urlObj.pathname.replace(/\/$/, "")}`;

		for (const feedPath of COMMON_FEED_PATHS) {
			const feedUrl = `${baseUrl}${feedPath}`;
			result = await tryParseFeed(feedUrl);
			if (result.success) {
				return result;
			}
		}
	}

	return result;
}

export function extractMediaUrls(item: RssItem): string[] {
	const urls: string[] = [];

	if (item.mediaContent && Array.isArray(item.mediaContent)) {
		for (const media of item.mediaContent) {
			if (media.$?.url) {
				const type = media.type?.toLowerCase() || "";
				if (type.startsWith("image") || !type) {
					urls.push(media.$.url);
				}
			}
		}
	}

	if (item.mediaThumbnail && Array.isArray(item.mediaThumbnail)) {
		for (const thumb of item.mediaThumbnail) {
			if (thumb.$?.url) {
				urls.push(thumb.$.url);
			}
		}
	}

	return urls;
}
