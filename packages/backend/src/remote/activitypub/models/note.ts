import promiseLimit from "promise-limit";
import * as mfm from "mfm-js";
import config from "@/config/index.js";
import Resolver from "../resolver.js";
import post from "@/services/note/create.js";
import { extractMentionedUsers } from "@/services/note/create.js";
import { resolvePerson } from "./person.js";
import { resolveImage } from "./image.js";
import type {
	ILocalUser,
	CacheableRemoteUser,
} from "@/models/entities/user.js";
import { htmlToMfm } from "../misc/html-to-mfm.js";
import { extractApHashtags } from "./tag.js";
import { unique, toArray, toSingle } from "@/prelude/array.js";
import { extractPollFromQuestion } from "./question.js";
import vote from "@/services/note/polls/vote.js";
import { apLogger } from "../logger.js";
import { DriveFile } from "@/models/entities/drive-file.js";
import { extractDbHost, toPuny } from "@/misc/convert-host.js";
import {
	Emojis,
	Polls,
	MessagingMessages,
	Notes,
	NoteEdits,
	DriveFiles,
} from "@/models/index.js";
import type { IMentionedRemoteUsers, Note } from "@/models/entities/note.js";
import type { IObject, IPost } from "../type.js";
import {
	getOneApId,
	getApId,
	getOneApHrefNullable,
	validPost,
	isEmoji,
	getApType,
} from "../type.js";
import type { Emoji } from "@/models/entities/emoji.js";
import { genId } from "@/misc/gen-id.js";
import { getApLock } from "@/misc/app-lock.js";
import { createMessage } from "@/services/messages/create.js";
import { parseAudience } from "../audience.js";
import { extractApMentions } from "./mention.js";
import DbResolver from "../db-resolver.js";
import { StatusError } from "@/misc/fetch.js";
import { shouldBlockInstance } from "@/misc/should-block-instance.js";
import { publishNoteStream } from "@/services/stream.js";
import { extractHashtags } from "@/misc/extract-hashtags.js";
import { UserProfiles } from "@/models/index.js";
import { In } from "typeorm";
import { DB_MAX_IMAGE_COMMENT_LENGTH } from "@/misc/hard-limits.js";
import { truncate } from "@/misc/truncate.js";
import { type Size, getEmojiSize } from "@/misc/emoji-meta.js";
import { fetchMeta } from "@/misc/fetch-meta.js";

const logger = apLogger;

export function validateNote(object: any, uri: string) {
	const expectHost = extractDbHost(uri);

	if (object == null) {
		return new Error("invalid Note: object is null");
	}

	if (!validPost.includes(getApType(object))) {
		return new Error(`invalid Note: invalid object type ${getApType(object)}`);
	}

	if (object.id && extractDbHost(object.id) !== expectHost) {
		return new Error(
			`invalid Note: id has different host. expected: ${expectHost}, actual: ${extractDbHost(
				object.id,
			)}`,
		);
	}

	if (
		object.attributedTo &&
		extractDbHost(getOneApId(object.attributedTo)) !== expectHost
	) {
		return new Error(
			`invalid Note: attributedTo has different host. expected: ${expectHost}, actual: ${extractDbHost(
				object.attributedTo,
			)}`,
		);
	}

	return null;
}

/**
 * Fetch Notes.
 *
 * If the target Note is registered in Firefish, it will be returned.
 */
export async function fetchNote(
	object: string | IObject,
): Promise<Note | null> {
	const dbResolver = new DbResolver();
	return await dbResolver.getNoteFromApId(object);
}

/**
 * Create a Note.
 */
export async function createNote(
	value: string | IObject,
	resolver?: Resolver,
	silent = false,
): Promise<Note | null> {
	if (resolver == null) resolver = new Resolver();

	const object: any = await resolver.resolve(value);

	const entryUri = getApId(value);
	const err = validateNote(object, entryUri);
	if (err) {
		logger.error(`${err.message}`, {
			resolver: {
				history: resolver.getHistory(),
			},
			value: value,
			object: object,
		});
		throw new Error("invalid note");
	}

	const note: IPost = object;

	if (note.id && !note.id.startsWith("https://")) {
		throw new Error(`unexpected schema of note.id: ${note.id}`);
	}

	const url = getOneApHrefNullable(note.url);

	if (url && !url.startsWith("https://")) {
		throw new Error(`unexpected schema of note url: ${url}`);
	}

	logger.debug(`Note fetched: ${JSON.stringify(note, null, 2)}`);
	logger.info(`Creating the Note: ${note.id}`);

	// Skip if note is made before 2007 (1yr before Fedi was created)
	// OR skip if note is made 3 days in advance
	if (note.published) {
		const DateChecker = new Date(note.published);
		const FutureCheck = new Date();
		FutureCheck.setDate(FutureCheck.getDate() + 3); // Allow some wiggle room for misconfigured hosts
		if (DateChecker.getFullYear() < 2007) {
			logger.warn(
				"Note somehow made before Activitypub was created; discarding",
			);
			return null;
		}
		if (DateChecker > FutureCheck) {
			logger.warn("Note somehow made after today; discarding");
			return null;
		}
	}

	// Fetch author
	const actor = (await resolvePerson(
		getOneApId(note.attributedTo),
		resolver,
	)) as CacheableRemoteUser;

	// Skip if author is suspended.
	if (actor.isSuspended) {
		logger.debug(
			`User ${actor.usernameLower}@${actor.host} suspended; discarding.`,
		);
		return null;
	}

	const noteAudience = await parseAudience(actor, note.to, note.cc);
	let visibility = noteAudience.visibility;
	const visibleUsers = noteAudience.visibleUsers;

	// If Audience (to, cc) was not specified
	if (visibility === "specified" && visibleUsers.length === 0) {
		if (typeof value === "string") {
			// If the input is a string, GET occurs in resolver
			// Public if you can GET anonymously from here
			visibility = "public";
		}
	}

	let isTalk = note._misskey_talk && visibility === "specified";

	const apMentions = await extractApMentions(note.tag);
	const apHashtags = await extractApHashtags(note.tag);

	// Attachments
	// TODO: attachmentは必ずしもImageではない
	// TODO: attachmentは必ずしも配列ではない
	// Noteがsensitiveなら添付もsensitiveにする
	const limit = promiseLimit(2);

	note.attachment = Array.isArray(note.attachment)
		? note.attachment
		: note.attachment
		? [note.attachment]
		: [];
	const files = note.attachment.map(
		(attach) => (attach.sensitive = note.sensitive),
	)
		? (
				await Promise.all(
					note.attachment.map(
						(x) => limit(() => resolveImage(actor, x)) as Promise<DriveFile>,
					),
				)
		  ).filter((image) => image != null)
		: [];

	// Reply
	const reply: Note | null = note.inReplyTo
		? await resolveNote(note.inReplyTo, resolver)
				.then((x) => {
					if (x == null) {
						logger.warn("Specified inReplyTo, but nout found");
						throw new Error("inReplyTo not found");
					} else {
						return x;
					}
				})
				.catch(async (e) => {
					// トークだったらinReplyToのエラーは無視
					const uri = getApId(note.inReplyTo);
					if (uri.startsWith(`${config.url}/`)) {
						const id = uri.split("/").pop();
						const talk = await MessagingMessages.findOneBy({ id });
						if (talk) {
							isTalk = true;
							return null;
						}
					}

					logger.warn(
						`Error in inReplyTo ${note.inReplyTo} - ${e.statusCode || e}`,
					);
					throw e;
				})
		: null;

	// Quote
	let quote: Note | undefined | null;

	if (note._misskey_quote || note.quoteUrl || note.quoteUri) {
		const tryResolveNote = async (
			uri: string,
		): Promise<
			| {
					status: "ok";
					res: Note | null;
			  }
			| {
					status: "permerror" | "temperror";
			  }
		> => {
			if (typeof uri !== "string" || !uri.match(/^https?:/))
				return { status: "permerror" };
			try {
				const res = await resolveNote(uri);
				if (res) {
					return {
						status: "ok",
						res,
					};
				} else {
					return {
						status: "permerror",
					};
				}
			} catch (e) {
				return {
					status:
						e instanceof StatusError && e.isClientError
							? "permerror"
							: "temperror",
				};
			}
		};

		const uris = unique(
			[note._misskey_quote, note.quoteUrl, note.quoteUri].filter(
				(x): x is string => typeof x === "string",
			),
		);
		const results = await Promise.all(uris.map((uri) => tryResolveNote(uri)));

		quote = results
			.filter((x): x is { status: "ok"; res: Note | null } => x.status === "ok")
			.map((x) => x.res)
			.find((x) => x);
		if (!quote) {
			if (results.some((x) => x.status === "temperror")) {
				throw new Error("quote resolve failed");
			}
		}
	}

	const cw = note.summary === "" ? null : note.summary;

	// Text parsing
	let text: string | null = null;
	if (typeof note._goblin_content !== "undefined") {
		text = note._goblin_content;
	} else if (
		note.source?.mediaType === "text/x.misskeymarkdown" &&
		typeof note.source?.content === "string"
	) {
		text = note.source.content;
	} else if (typeof note._misskey_content !== "undefined") {
		text = note._misskey_content;
	} else if (typeof note.content === "string") {
		text = note.content; // htmlToMfm(note.content, note.tag);
	}

	// vote
	if (reply?.hasPoll) {
		const poll = await Polls.findOneByOrFail({ noteId: reply.id });

		const tryCreateVote = async (
			name: string,
			index: number,
		): Promise<null> => {
			if (poll.expiresAt && Date.now() > new Date(poll.expiresAt).getTime()) {
				logger.warn(
					`vote to expired poll from AP: actor=${actor.username}@${actor.host}, note=${note.id}, choice=${name}`,
				);
			} else if (index >= 0) {
				logger.info(
					`vote from AP: actor=${actor.username}@${actor.host}, note=${note.id}, choice=${name}`,
				);
				await vote(actor, reply, index);
			}
			return null;
		};

		if (note.name) {
			return await tryCreateVote(
				note.name,
				poll.choices.findIndex((x) => x === note.name),
			);
		}
	}

	const emojis = await extractEmojis(note.tag || [], actor.host).catch((e) => {
		logger.info(`extractEmojis: ${e}`);
		return [] as Emoji[];
	});

	const apEmojis = emojis.map((emoji) => emoji.name);

	const poll = await extractPollFromQuestion(note, resolver).catch(
		() => undefined,
	);

	if (isTalk) {
		for (const recipient of visibleUsers) {
			await createMessage(
				actor,
				recipient,
				undefined,
				text || undefined,
				files && files.length > 0 ? files[0] : null,
				object.id,
			);
			return null;
		}
	}

	logger.debug(`Note trail: ${JSON.stringify(note.reblogtrail, null, 2)}`);
	if(note.reblogtrail && note.reblogtrail[0]) {
		for(var i = 0; i < note.reblogtrail.length; i++) {

	logger.debug('1');
			const trailRoot = note.reblogtrail[i];


	    logger.debug(`Note trail: ${JSON.stringify(trailRoot, null, 2)}`);
			if(trailRoot.user && trailRoot.user.host) {

			  logger.debug('2');
				const url = 'https://' + trailRoot.user.host  + '/@' + trailRoot.user.username + '/notes/' + trailRoot.id;
				note.reblogtrail[i].uri = url;
				note.reblogtrail[i].url = url;
				const rootNote = await Notes.findOne({
					where: [
						{
							uri: url,
						},
						{
							url:url,
						},
					],
				});
				logger.debug('3');

				logger.debug(`Note trail: ${JSON.stringify(rootNote, null, 2)}`);
				if(rootNote) {
					logger.debug('4');
					note.reblogtrail[i].id = rootNote.id;
				} else {
					logger.debug('5');
					const newRootNote = await createNote(url, resolver, true);
					note.reblogtrail[i] = newRootNote;
				}
			}
		}
	}

	return await post(
		actor,
		{
			createdAt: note.published ? new Date(note.published) : null,
			files,
			reply,
			renote: quote,
			name: note.name,
			cw,
			text,
			localOnly: false,
			visibility,
			visibleUsers,
			apMentions,
			apHashtags,
			apEmojis,
			poll,
			uri: note.id,
			url: url,
			reblogtrail: note.reblogtrail,
		},
		silent,
	);
}

/**
 * Resolve Note.
 *
 * If the target Note is registered in Firefish, return it, otherwise
 * Fetch from remote server, register with Firefish and return it.
 */
export async function resolveNote(
	value: string | IObject,
	resolver?: Resolver,
): Promise<Note | null> {
	const uri = typeof value === "string" ? value : value.id;
	if (uri == null) throw new Error("missing uri");

	// Abort if origin host is blocked
	if (await shouldBlockInstance(extractDbHost(uri)))
		throw new StatusError(
			"host blocked",
			451,
			`host ${extractDbHost(uri)} is blocked`,
		);

	const unlock = await getApLock(uri);

	try {
		//#region Returns if already registered with this server
		const exist = await fetchNote(uri);

		if (exist) {
			return exist;
		}
		//#endregion

		if (uri.startsWith(config.url)) {
			throw new StatusError(
				"cannot resolve local note",
				400,
				"cannot resolve local note",
			);
		}

		// Fetch from remote server and register
		// If the attached `Note` Object is specified here instead of the uri, the note will be generated without going through the server fetch.
		// Since the attached Note Object may be disguised, always specify the uri and fetch it from the server.
		return await createNote(uri, resolver, true);
	} finally {
		unlock();
	}
}

export async function extractEmojis(
	tags: IObject | IObject[],
	host: string,
): Promise<Emoji[]> {
	host = toPuny(host);

	if (!tags) return [];

	const eomjiTags = toArray(tags).filter(isEmoji);

	return await Promise.all(
		eomjiTags.map(async (tag) => {
			const name = tag.name!.replace(/^:/, "").replace(/:$/, "");
			tag.icon = toSingle(tag.icon);

			const exists = await Emojis.findOneBy({
				host,
				name,
			});

			if (exists) {
				if (
					(tag.updated != null && exists.updatedAt == null) ||
					(tag.id != null && exists.uri == null) ||
					(tag.updated != null &&
						exists.updatedAt != null &&
						new Date(tag.updated) > exists.updatedAt) ||
					tag.icon!.url !== exists.originalUrl ||
					!(exists.width && exists.height)
				) {
					let size: Size = { width: 0, height: 0 };
					try {
						size = await getEmojiSize(tag.icon!.url);
					} catch {
						/* skip if any error happens */
					}
					await Emojis.update(
						{
							host,
							name,
						},
						{
							uri: tag.id,
							originalUrl: tag.icon!.url,
							publicUrl: tag.icon!.url,
							updatedAt: new Date(),
							width: size.width || null,
							height: size.height || null,
						},
					);

					return (await Emojis.findOneBy({
						host,
						name,
					})) as Emoji;
				}

				return exists;
			}

			logger.info(`register emoji host=${host}, name=${name}`);

			let size: Size = { width: 0, height: 0 };
			try {
				size = await getEmojiSize(tag.icon!.url);
			} catch {
				/* skip if any error happens */
			}
			return await Emojis.insert({
				id: genId(),
				host,
				name,
				uri: tag.id,
				originalUrl: tag.icon!.url,
				publicUrl: tag.icon!.url,
				updatedAt: new Date(),
				aliases: [],
				width: size.width || null,
				height: size.height || null,
			} as Partial<Emoji>).then((x) =>
				Emojis.findOneByOrFail(x.identifiers[0]),
			);
		}),
	);
}

type TagDetail = {
	type: string;
	name: string;
};

function notEmpty(partial: Partial<any>) {
	return Object.keys(partial).length > 0;
}

export async function updateNote(value: string | IObject, resolver?: Resolver) {
	const uri = typeof value === "string" ? value : value.id;
	if (!uri) throw new Error("Missing note uri");

	// Skip if URI points to this server
	if (uri.startsWith(`${config.url}/`)) throw new Error("uri points local");

	// A new resolver is created if not specified
	if (resolver == null) resolver = new Resolver();

	// Resolve the updated Note object
	const post = (await resolver.resolve(value)) as IPost;

	const actor = (await resolvePerson(
		getOneApId(post.attributedTo),
		resolver,
	)) as CacheableRemoteUser;

	// Already registered with this server?
	const note = await Notes.findOneBy({ uri });
	if (note == null) {
		return await createNote(post, resolver);
	}

	// Whether to tell clients the note has been updated and requires refresh.
	let publishing = false;

	// Text parsing
	let text: string | null = null;

	if (typeof post._goblin_content !== "undefined") {
		text = post._goblin_content;
	} else if (
		post.source?.mediaType === "text/x.misskeymarkdown" &&
		typeof post.source?.content === "string"
	) {
		text = post.source.content;
	} else if (typeof post._misskey_content !== "undefined") {
		text = post._misskey_content;
	} else if (typeof post.content === "string") {
		text = htmlToMfm(post.content, post.tag);
	}

	const cw = post.sensitive && post.summary;

	// File parsing
	const fileList = post.attachment
		? Array.isArray(post.attachment)
			? post.attachment
			: [post.attachment]
		: [];
	const files = fileList.map((f) => (f.sensitive = post.sensitive));

	// Fetch files
	const limit = promiseLimit(2);

	const driveFiles = (
		await Promise.all(
			fileList.map(
				(x) =>
					limit(async () => {
						const file = await resolveImage(actor, x);
						const update: Partial<DriveFile> = {};

						const altText = truncate(x.name, DB_MAX_IMAGE_COMMENT_LENGTH);
						if (file.comment !== altText) {
							update.comment = altText;
						}

						// Don't unmark previously marked sensitive files,
						// but if edited post contains sensitive marker, update it.
						if (post.sensitive && !file.isSensitive) {
							update.isSensitive = post.sensitive;
						}

						if (notEmpty(update)) {
							await DriveFiles.update(file.id, update);
							publishing = true;
						}

						return file;
					}) as Promise<DriveFile>,
			),
		)
	).filter((file) => file != null);
	const fileIds = driveFiles.map((file) => file.id);
	const fileTypes = driveFiles.map((file) => file.type);

	const apEmojis = (
		await extractEmojis(post.tag || [], actor.host).catch((e) => [])
	).map((emoji) => emoji.name);
	const apMentions = await extractApMentions(post.tag);
	const apHashtags = await extractApHashtags(post.tag);

	const poll = await extractPollFromQuestion(post, resolver).catch(
		() => undefined,
	);

	const choices = poll?.choices.flatMap((choice) => mfm.parse(choice)) ?? [];

	const tokens = mfm
		.parse(text || "")
		.concat(mfm.parse(cw || ""))
		.concat(choices);

	const hashTags: string[] = apHashtags || extractHashtags(tokens);

	const mentionUsers =
		apMentions || (await extractMentionedUsers(actor, tokens));

	const mentionUserIds = mentionUsers.map((user) => user.id);
	const remoteUsers = mentionUsers.filter((user) => user.host != null);
	const remoteUserIds = remoteUsers.map((user) => user.id);
	const remoteProfiles = await UserProfiles.findBy({
		userId: In(remoteUserIds),
	});
	const mentionedRemoteUsers = remoteUsers.map((user) => {
		const profile = remoteProfiles.find(
			(profile) => profile.userId === user.id,
		);
		return {
			username: user.username,
			host: user.host ?? null,
			uri: user.uri,
			url: profile ? profile.url : undefined,
		} as IMentionedRemoteUsers[0];
	});

	const update = {} as Partial<Note>;
	if (text && text !== note.text) {
		update.text = text;
	}
	if (cw !== note.cw) {
		update.cw = cw ? cw : null;
	}
	if (fileIds.sort().join(",") !== note.fileIds.sort().join(",")) {
		update.fileIds = fileIds;
		update.attachedFileTypes = fileTypes;
	}

	if (hashTags.sort().join(",") !== note.tags.sort().join(",")) {
		update.tags = hashTags;
	}

	if (mentionUserIds.sort().join(",") !== note.mentions.sort().join(",")) {
		update.mentions = mentionUserIds;
		update.mentionedRemoteUsers = JSON.stringify(mentionedRemoteUsers);
	}

	if (apEmojis.sort().join(",") !== note.emojis.sort().join(",")) {
		update.emojis = apEmojis;
	}

	if (note.hasPoll !== !!poll) {
		update.hasPoll = !!poll;
	}

	if (poll) {
		const dbPoll = await Polls.findOneBy({ noteId: note.id });
		if (dbPoll == null) {
			await Polls.insert({
				noteId: note.id,
				choices: poll?.choices,
				multiple: poll?.multiple,
				votes: poll?.votes,
				expiresAt: poll?.expiresAt,
				noteVisibility: note.visibility === "hidden" ? "home" : note.visibility,
				userId: actor.id,
				userHost: actor.host,
			});
			updating = true;
		} else if (
			dbPoll.multiple !== poll.multiple ||
			dbPoll.expiresAt !== poll.expiresAt ||
			dbPoll.noteVisibility !== note.visibility ||
			JSON.stringify(dbPoll.choices) !== JSON.stringify(poll.choices)
		) {
			await Polls.update(
				{ noteId: note.id },
				{
					choices: poll?.choices,
					multiple: poll?.multiple,
					votes: poll?.votes,
					expiresAt: poll?.expiresAt,
					noteVisibility:
						note.visibility === "hidden" ? "home" : note.visibility,
				},
			);
			updating = true;
		} else {
			for (let i = 0; i < poll.choices.length; i++) {
				if (dbPoll.votes[i] !== poll.votes?.[i]) {
					await Polls.update({ noteId: note.id }, { votes: poll?.votes });
					publishing = true;
					break;
				}
			}
		}
	}

	// Update Note
	if (notEmpty(update)) {
		update.updatedAt = new Date();

		// Save updated note to the database
		await Notes.update({ uri }, update);

		// Save an edit history for the previous note
		await NoteEdits.insert({
			id: genId(),
			noteId: note.id,
			text: note.text,
			cw: note.cw,
			fileIds: note.fileIds,
			updatedAt: update.updatedAt,
		});

		publishing = true;
	}

	if (publishing) {
		// Publish update event for the updated note details
		publishNoteStream(note.id, "updated", {
			updatedAt: update.updatedAt,
		});
	}
}
