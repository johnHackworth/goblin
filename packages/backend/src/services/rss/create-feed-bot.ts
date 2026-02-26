import { generateKeyPair } from "node:crypto";
import { Users, UserProfiles, RssFeeds, DriveFiles } from "@/models/index.js";
import { User } from "@/models/entities/user.js";
import { UserProfile } from "@/models/entities/user-profile.js";
import { UserKeypair } from "@/models/entities/user-keypair.js";
import { genId } from "@/misc/gen-id.js";
import { db } from "@/db/postgre.js";
import { usersChart } from "@/services/chart/index.js";
import generateUserToken from "@/server/api/common/generate-native-user-token.js";
import { getResponse } from "@/misc/fetch.js";
import { uploadFromUrl } from "@/services/drive/upload-from-url.js";

function sanitizeDomain(domain: string): string {
	return domain
		.replace(/^https?:\/\//, "")
		.replace(/^www\./, "")
		.replace(/\./g, "_")
		.replace(/[^a-zA-Z0-9_-]/g, "-")
		.substring(0, 50);
}

async function fetchFavicon(siteUrl: string): Promise<string | null> {
	try {
		const url = new URL(siteUrl);
		const baseUrl = `${url.protocol}//${url.host}`;

		const res = await getResponse({
			url: baseUrl,
			method: "GET",
			headers: {
				"User-Agent": "Goblin/1.0",
			},
		});

		if (!res.ok) return null;

		const html = await res.text();

		const faviconMatch =
			html.match(
				/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i,
			) ||
			html.match(
				/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i,
			);

		if (faviconMatch) {
			const faviconPath = faviconMatch[1];
			if (faviconPath.startsWith("http")) {
				return faviconPath;
			} else if (faviconPath.startsWith("//")) {
				return `${url.protocol}${faviconPath}`;
			} else {
				return `${baseUrl}${
					faviconPath.startsWith("/") ? "" : "/"
				}${faviconPath}`;
			}
		}

		return `${baseUrl}/favicon.ico`;
	} catch {
		return null;
	}
}

export async function createOrGetFeedBot(
	feedUrl: string,
	feedTitle: string,
	feedDescription?: string,
	siteUrl?: string,
): Promise<User> {
	const url = new URL(feedUrl);
	const domain = sanitizeDomain(url.hostname);
	const username = `${domain}-rss`;

	let bot = await Users.findOne({
		where: {
			username,
			host: "null" as any,
		},
	});

	if (bot) return bot;

	const keyPair = await new Promise<string[]>((res, rej) =>
		generateKeyPair(
			"rsa",
			{
				modulusLength: 4096,
				publicKeyEncoding: {
					type: "spki",
					format: "pem",
				},
				privateKeyEncoding: {
					type: "pkcs8",
					format: "pem",
					cipher: undefined,
					passphrase: undefined,
				},
			} as any,
			(err, publicKey, privateKey) =>
				err ? rej(err) : res([publicKey, privateKey]),
		),
	);

	const now = new Date();
	const userId = genId();

	const botUser = new User({
		id: userId,
		createdAt: now,
		updatedAt: now,
		username,
		usernameLower: username.toLowerCase(),
		host: null,
		name: feedTitle.substring(0, 50) || null,
		isBot: true,
		isCat: false,
		token: generateUserToken(),
		avatarId: null,
	});

	await db.transaction(async (transactionalEntityManager) => {
		await transactionalEntityManager.save(botUser);

		await transactionalEntityManager.save(
			new UserProfile({
				userId,
				url: feedUrl,
				description: `RSS Feed: ${feedTitle}\n\n${
					feedDescription || ""
				}\n\nSource: ${feedUrl}`,
				autoAcceptFollowed: true,
				password: "",
			}),
		);

		usersChart.update(botUser, true);

		await transactionalEntityManager.save(
			new UserKeypair({
				publicKey: keyPair[0],
				privateKey: keyPair[1],
				userId,
			}),
		);
	});

	const effectiveSiteUrl = siteUrl || feedUrl;
	const faviconUrl = await fetchFavicon(effectiveSiteUrl);
	if (faviconUrl) {
		try {
			const avatarFile = await uploadFromUrl({
				url: faviconUrl,
				user: { id: botUser.id, host: null },
			});
			botUser.avatarId = avatarFile.id;
			await Users.save(botUser);
		} catch (e) {
			console.error("Failed to upload favicon for RSS bot:", e);
		}
	}

	return botUser;
}

export async function getOrCreateRssFeed(
	url: string,
	feedTitle: string,
	feedDescription?: string,
	siteUrl?: string,
): Promise<{ feed: any; isNew: boolean }> {
	let feed = await RssFeeds.findOneBy({ url });

	if (feed) {
		return { feed, isNew: false };
	}

	const botUser = await createOrGetFeedBot(
		url,
		feedTitle,
		feedDescription,
		siteUrl,
	);

	const now = new Date();
	feed = await RssFeeds.save({
		id: genId(),
		url,
		title: feedTitle,
		description: feedDescription || null,
		siteUrl: siteUrl || null,
		botUserId: botUser.id,
		fetchInterval: 15,
		isActive: true,
		isPermanentlyDisabled: false,
		consecutiveErrorCount: 0,
		createdAt: now,
		updatedAt: now,
	});

	return { feed, isNew: true };
}
