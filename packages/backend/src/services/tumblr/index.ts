import { generateKeyPair } from "node:crypto";
import { Not, IsNull, MoreThan } from "typeorm";
import { parse } from "node-html-parser";
import Parser from "rss-parser";
import { getResponse } from "@/misc/fetch.js";
import { UserKeypair } from "@/models/entities/user-keypair.js";

import tumblr from "tumblr.js";
import config from "@/config/index.js";
import { UserProfiles, Users, Notes } from "@/models/index.js";
import { User } from "@/models/entities/user.js";
import { DriveFiles } from "@/models/index.js";
import { genId } from "@/misc/gen-id.js";

import generateUserToken from "@/server/api/common/generate-native-user-token.js";

import { db } from "@/db/postgre.js";
import { usersChart } from "@/services/chart/index.js";
import { UserProfile } from "@/models/entities/user-profile.js";
import { uploadFromUrl } from "@/services/drive/upload-from-url.js";
import { apiLogger } from "@/server/api/logger.js";
import create from "@/services/note/create.js";
import { sanitize } from "@/misc/html/index.js";
import * as cheerio from "cheerio";

const rssParser = new Parser();

const getInfoUrl = (blogname: string) => {
	return `https://api.tumblr.com/v2/blog/${blogname}/info?api_key=${config.tumblr.key}`;
};

const getTumblrClient = ( profile ) => {
	const { accessToken, accessTokenSecret } = profile.integrations.tumblr;
	return tumblr.createClient({
		consumer_key: config.tumblr.key,
		consumer_secret: config.tumblr.secret,
		token: accessToken,
		token_secret: accessTokenSecret,
	});
}

const getTumblrPostParams = ( note ) => {
	return {
		type: "text",
		state: "published",
		tags: note.tags ? note.tags.join(",") : "",
		format: "html",
		native_inline_images: true,
		body: note.text,
	};
}

const getTumblrPostData = async ( client, tumblrBlog, externalId ) => {
	const tumblrPostInfo = await client.blogPosts(
		tumblrBlog,
		{ id: externalId }
	);

	if( tumblrPostInfo.posts &&
			tumblrPostInfo.posts.length === 1 &&
			tumblrPostInfo.posts[0]
	) {
		return tumblrPostInfo.posts[0];
	}
	return null;
}


const createPostRequest = async (tumblrBlog, params, client, isReblog = false, attempts = 3) => {
	const postingMethod = isReblog? "reblogPost" : "createLegacyPost";
	try {
		const createdPost = await client[postingMethod](
			tumblrBlog,
			params
		);
		apiLogger.warn('Tumblr post created: ' + JSON.stringify(createdPost));
		return createdPost;
	} catch (ev) {
		apiLogger.error("tumblr api call error: " + ev );
		if( attempts ) {
			setTimeout( () => {
				createPostRequest (tumblrBlog, params, client, isReblog, attempts - 1 )
			}, 10000 );
		}
	}
}

export async function postToTumblr(user, note, tumblrBlog) {
	const profile = await UserProfiles.findOneByOrFail({ userId: user.id });
	if (profile.integrations.tumblr) {
		if (note.renoteId ) {
			const rebloggedPost = await Notes.findOneBy( { id: note.renoteId })
			if( rebloggedPost &&rebloggedPost.externalId) {
				const client = getTumblrClient( profile );
				let params = getTumblrPostParams( rebloggedPost );
				const noteOp = await Users.findOneBy({ id: rebloggedPost.userId });
	   		if( noteOp && noteOp.tumblrUUID ) {
					const tumblrPostInfo = await getTumblrPostData( client, noteOp.tumblrUUID, rebloggedPost.externalId );
					if( tumblrPostInfo ) {
						params.id = tumblrPostInfo.id;
						params.reblog_key = tumblrPostInfo.reblog_key;
						const createdPost = await createPostRequest(tumblrBlog, params, client, true, 3 );
						return createdPost;
					}
				}
			}
		} else if (!note.reblogtrail || !note.reblogtrail.length) {
			const client = getTumblrClient( profile );
			const params = getTumblrPostParams( note );
			const createdPost = await createPostRequest(tumblrBlog, params, client, false, 3 );
			return createdPost;
		}
	}

	return null;
}

export async function likePostOnTumblr(user, note, tumblrBlog) {
	const profile = await UserProfiles.findOneByOrFail({ userId: user.id });
	if (profile.integrations.tumblr) {
		if (note.externalId) {
			const { accessToken, accessTokenSecret } = profile.integrations.tumblr;
			const client = tumblr.createClient({
				consumer_key: config.tumblr.key,
				consumer_secret: config.tumblr.secret,
				token: accessToken,
				token_secret: accessTokenSecret,
			});

			const tumblrPostInfo = await getTumblrPostData( client, tumblrBlog, note.externalId );

			if( tumblrPostInfo ) {
				const { id, reblog_key } = tumblrPostInfo;
				await client.likePost( id, reblog_key );
			}
		}
	}

	return null;
}

export async function getTumblrProfile(tumblrBlog: string) {
	const blogInfoResponse = await fetch(getInfoUrl(tumblrBlog));
	const blogInfo = await blogInfoResponse.json();
	return blogInfo.response.blog;
}

export async function transformToReblogs(post: string) {
	const $ = cheerio.load('<div class="postRoot">' + post + "</div>");

	const linksToReblogs = $("p:has(+ blockquote) a").get().reverse();
	const reblogTrail = linksToReblogs.map((link) => {
		const container = $(link).parent();
		const url = $(link).attr("href");
		const reblog = container.next();
		const source = $(link).text();

		$(reblog).find(".tumblr_blog").parent().next().remove();
		$(reblog).find(".tumblr_blog").parent().remove();

		let content = $.html(reblog.contents());

		$(container).remove();
		$(reblog).remove();
		return {
			link: url,
			blog: source,
			content: content,
		};
	});

	return {
		reblogTrail: reblogTrail,
		postContent: $.html($(".postRoot")),
		original: post,
	};
}

const formatReblogItem = (reblog) => {
	return (
		'<div class="reblogTrailItem">' +
		'<div class="reblogHeader">' +
		'<img class="imageReblogTumblr" src="/avatar/@' +
		reblog.blog +
		'_at_tumblr_com" />' +
		'<a href="' +
		reblog.link +
		'">@' +
		reblog.blog +
		" (@tumblr.com)</a>" +
		"</div>" +
		'<div class="reblogContent">' +
		sanitize(reblog.content) +
		"</div>" +
		"</div>"
	);
};

export async function getTumblrPosts(tumblrBlog: string, offset: number) {
	const feedUrl =
		"https://" + tumblrBlog + ".tumblr.com/rss?cache-buster=" + Date.now();
	const res = await fetch(feedUrl, {
		method: "GET",
		headers: Object.assign({
			"User-Agent": config.userAgent,
			Accept: "application/rss+xml, */*",
		}),
	});
	const text = await res.text();
	const posts = await rssParser.parseString(text);
	return posts ? posts.items : []; //.response.posts.reverse();
}

export async function getUsersToFetch() {
	const usersToFetch = await Users.find({
		where: {
			tumblrUUID: Not(IsNull()),
			followersCount: MoreThan(0),
		},
		order: {
			feedUpdatedAt: "ASC",
		},
		take: 5,
	});

	return usersToFetch;
}

export async function updateTumblrUser(tumblrUsername: string) {
	apiLogger.warn("updating tumblr user " + tumblrUsername);
	let blogInfo;
	let user = await Users.findOneBy({
		username: tumblrUsername + "_at_tumblr_com",
	});
	if (!user) {
		return null;
	}

	if (
		!user.updatedAt ||
		Date.now() - new Date(user.updatedAt) > 10 * 60 * 1000
	) {
		blogInfo = await getTumblrProfile(tumblrUsername);
		if (!blogInfo) {
			await Users.update(user.id, { feedUpdatedAt: new Date() });
			return null;
		}

		let userNeedsUpdate = false;
		const newUsername = blogInfo.name + "_at_tumblr_com";
		if (newUsername != user.username) {
			user.username = newUsername;
			user.usernameLower = newUsername.toLowerCase();
			userNeedsUpdate = true;
		}

		if (user.avatarId) {
			const avatarFile = await DriveFiles.findOneBy({ id: user.avatarId });
			if (avatarFile && avatarFile.src != blogInfo.avatar[0].url) {
				const newAvatarFile = await uploadFromUrl({
					url: blogInfo.avatar[0].url,
					user: user,
				});
				user.avatarId = newAvatarFile.id;
			}
			userNeedsUpdate = true;
		}

		if (user.bannerId) {
			const bannerFile = await DriveFiles.findOneBy({ id: user.bannerId });
			if (bannerFile && bannerFile.src != blogInfo.theme.header_image) {
				const newBannerFile = await uploadFromUrl({
					url: blogInfo.theme.header_image,
					user: user,
				});
				user.bannerId = newBannerFile.id;
			}
			userNeedsUpdate = true;
		}

		if (userNeedsUpdate) {
			await db.transaction(async (transactionalEntityManager) => {
				user = await transactionalEntityManager.save(user);
			});
		}

		const profile = await UserProfiles.findOneByOrFail({ userId: user.id });
		if (profile) {
			let needProfileUpdate = false;
			if (profile.description != blogInfo.description) {
				profile.description = sanitize(blogInfo.description);
				needProfileUpdate = true;
			}

			if (profile.url != "https://" + blogInfo.name + ".tumblr.com") {
				profile.url = "https://" + blogInfo.name + ".tumblr.com";
				needProfileUpdate = true;
			}

			if (needProfileUpdate) {
				await db.transaction(async (transactionalEntityManager) => {
					await transactionalEntityManager.save(profile);
				});
			}
		}
	}
	return { user: user, blogInfo: blogInfo };
}

export async function createNewTumblrUser(username: string) {
	const blogInfo = await getTumblrProfile(username);
	if (!blogInfo) {
		return null;
	}

	let user = await Users.findOneBy({
		tumblrUUID: blogInfo.uuid,
	});
	if (user) {
		return await updateTumblrUser(user.username);
	}

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

	let account: User | null = null;
	const newUsername = blogInfo.name + "_at_tumblr_com";
	user = new User({
		id: genId(),
		tumblrUUID: blogInfo.uuid,
		createdAt: new Date(),
		username: newUsername,
		usernameLower: newUsername.toLowerCase(),
		host: null,
		token: generateUserToken(),
		isAdmin: false,
		isBot: true,
	});

	await db.transaction(async (transactionalEntityManager) => {
		account = await transactionalEntityManager.save(user);
		if (account) {
			await transactionalEntityManager.save(
				new UserProfile({
					userId: account.id,
					url: "https://" + newUsername,
					autoAcceptFollowed: true,
					password: "",
					description: sanitize(blogInfo.description),
				}),
			);

			usersChart.update(account, true);

			await transactionalEntityManager.save(
				new UserKeypair({
					publicKey: keyPair[0],
					privateKey: keyPair[1],
					userId: account.id,
				}),
			);
		}
	});
	return { user: user, account: account, blogInfo: blogInfo };
}

export async function fetchTumblrFeed(user: User) {
	apiLogger.warn(
		"fetching tumblr user " + user.username + " with UUID " + user.tumblrUUID,
	);
	if (user.tumblrUUID) {
		const responses = {
			user: user.username,
			new: [],
		};
		const blogInfo = await getTumblrProfile(user.tumblrUUID);
		if (!blogInfo) {
			await Users.update(user.id, { feedUpdatedAt: new Date() });
			apiLogger.warn("remote tumblr user not found");
			return;
		}
		let posts = await getTumblrPosts(blogInfo.name, 0);
		posts = posts.reverse();
		const lastUserUpdate = user.updatedAt;
		const transforms = [];

		for (const post of posts) {
			const postDate = new Date(post.isoDate);
			if (!lastUserUpdate || !user.feedUpdatedAt || postDate > lastUserUpdate) {
				responses.new.push(post);
				let title = "";

				/*
				 * This peels out the reblog trail from post titles.
				 *
				 * "goblin: kobold: the hellcloud" -> "the hellcloud"
				 * "goblin social: the hellcloud" -> "goblin social: the hellcloud"
				 * "the hellcloud…" -> "the hellcloud"
				 *
				 * "Some people, when confronted with a problem, think 'I know, I'll use
				 * regular expressions.' Now they have two problems." - Jamie Zawinski
				 */
				const sanitizedTitle =
					sanitize(post?.title)
						?.match(/^([\w-]+: ?)*(.*)/)?.[2]
						.replace("&hellip;", "")
						.replace("…", "") || "";
				const defangedContent =
					sanitize(post.content)
						.replace(/(<([^>]+)>)/gi, "")
						.replace(/^([\w-]+:)+/, "") || "";

				if (sanitizedTitle && !defangedContent.includes(sanitizedTitle)) {
					title = `<div class="tumblrTitle">${sanitizedTitle}</div>`;
				}

				let { reblogTrail, postContent } = await transformToReblogs(
					post.content,
				);
				transforms.push(await transformToReblogs(post.content));

				const reblogTrailBlock = reblogTrail.length
					? `<div class="reblogTrail">${reblogTrail
							.map(formatReblogItem)
							.join("<hr/>")}</div>`
					: "";

				const externalId = post.link? post.link.split('/').pop().slice(0,31) : null;

				const note = await create(
					user,
					{
						createdAt: new Date(),
						text: `<div class="tumblrPost">${reblogTrailBlock}${title}${postContent}</div>`,
						apHashtags: post.categories,
						url: post.link,
						externalId: externalId
					},
					false,
					true
				);
			}
		}

		await Users.update(user.id, { feedUpdatedAt: new Date() });

		return transforms; // response;
	}
	return null;
}
