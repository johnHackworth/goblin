import create from "@/services/note/create.js";
import { RssFeeds, RssFeedItems, DriveFiles } from "@/models/index.js";
import type { RssFeed } from "@/models/entities/rss-feed.js";
import type { User } from "@/models/entities/user.js";
import type { Note } from "@/models/entities/note.js";
import { genId } from "@/misc/gen-id.js";
import { extractMediaUrls, type RssItem } from "./parser.js";
import { uploadFromUrl } from "@/services/drive/upload-from-url.js";

export async function createNoteFromRssItem(
	feed: RssFeed,
	item: RssItem,
	botUser: User,
): Promise<Note | null> {
	if (!item.link) {
		return null;
	}

	const text = formatRssItemAsNote(item);

	const files = await downloadAndAttachMedia(item, botUser);

	const note = await create(
		botUser,
		{
			createdAt: item.pubDate || new Date(),
			text,
			files,
			url: item.link,
		},
		true,
		true,
	);

	await RssFeedItems.save({
		id: genId(),
		rssFeedId: feed.id,
		url: item.link,
		noteId: note.id,
		publishedAt: item.pubDate || new Date(),
		createdAt: new Date(),
	});

	return note;
}

function formatRssItemAsNote(item: RssItem): string {
	let text = item.title || "Untitled";

	if (item.content || item.description) {
		const content = item.content || item.description || "";
		text += "\n\n" + content;
	}

	if (item.link) {
		text += "\n\n" + item.link;
	}

	return text;
}

async function downloadAndAttachMedia(
	item: RssItem,
	user: User,
): Promise<any[]> {
	const mediaUrls = extractMediaUrls(item);

	if (mediaUrls.length === 0) {
		return [];
	}

	const files: any[] = [];

	for (const url of mediaUrls.slice(0, 4)) {
		try {
			const file = await uploadFromUrl({
				url,
				user,
			});
			files.push(file);
		} catch (error) {
			// Skip failed media downloads
		}
	}

	return files;
}
