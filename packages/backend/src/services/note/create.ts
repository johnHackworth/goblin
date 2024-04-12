import * as mfm from "mfm-js";
import es from "../../db/elasticsearch.js";
import sonic from "../../db/sonic.js";
import {
	publishMainStream,
	publishNotesStream,
	publishNoteStream,
} from "@/services/stream.js";
import DeliverManager from "@/remote/activitypub/deliver-manager.js";
import renderNote from "@/remote/activitypub/renderer/note.js";
import renderCreate from "@/remote/activitypub/renderer/create.js";
import renderAnnounce from "@/remote/activitypub/renderer/announce.js";
import { renderActivity } from "@/remote/activitypub/renderer/index.js";
import { resolveUser } from "@/remote/resolve-user.js";
import config from "@/config/index.js";
import { updateHashtags } from "../update-hashtag.js";
import { concat } from "@/prelude/array.js";
import { insertNoteUnread } from "@/services/note/unread.js";
import { registerOrFetchInstanceDoc } from "../register-or-fetch-instance-doc.js";
import { extractMentions } from "@/misc/extract-mentions.js";
import { extractCustomEmojisFromMfm } from "@/misc/extract-custom-emojis-from-mfm.js";
import { extractHashtags } from "@/misc/extract-hashtags.js";
import { getRootAncestor } from "@/misc/note/ancestors.js";
import { getNoteSlug } from "@/misc/note/noteSlug.js";
import type { IMentionedRemoteUsers } from "@/models/entities/note.js";
import { Note } from "@/models/entities/note.js";
import {
	Mutings,
	Users,
	NoteWatchings,
	Notes,
	Instances,
	UserProfiles,
	MutedNotes,
	Channels,
	ChannelFollowings,
	NoteThreadMutings,
} from "@/models/index.js";
import type { DriveFile } from "@/models/entities/drive-file.js";
import type { App } from "@/models/entities/app.js";
import { Not, In } from "typeorm";
import type { User, ILocalUser, IRemoteUser } from "@/models/entities/user.js";
import { genId } from "@/misc/gen-id.js";
import {
	notesChart,
	perUserNotesChart,
	activeUsersChart,
	instanceChart,
} from "@/services/chart/index.js";
import type { IPoll } from "@/models/entities/poll.js";
import { Poll } from "@/models/entities/poll.js";
import { createNotification } from "../create-notification.js";
import { isDuplicateKeyValueError } from "@/misc/is-duplicate-key-value-error.js";
import { checkHitAntenna } from "@/misc/check-hit-antenna.js";
import { getWordHardMute } from "@/misc/check-word-mute.js";
import { addNoteToAntenna } from "../add-note-to-antenna.js";
import { countSameRenotes } from "@/misc/count-same-renotes.js";
import { deliverToRelays, getCachedRelays } from "../relay.js";
import type { Channel } from "@/models/entities/channel.js";
import { normalizeForSearch } from "@/misc/normalize-for-search.js";
import { getAntennas } from "@/misc/antenna-cache.js";
import { endedPollNotificationQueue } from "@/queue/queues.js";
import { webhookDeliver } from "@/queue/index.js";
import { Cache } from "@/misc/cache.js";
import type { UserProfile } from "@/models/entities/user-profile.js";
import { db } from "@/db/postgre.js";
import { getActiveWebhooks } from "@/misc/webhook-cache.js";
import { shouldSilenceInstance } from "@/misc/should-block-instance.js";
import meilisearch from "../../db/meilisearch.js";
import { redisClient } from "@/db/redis.js";
import { Mutex } from "redis-semaphore";
import Logger from "../logger.js";
import { getNoteSummary } from "@/misc/get-note-summary.js";

const logger = new Logger("notes-create");

const mutedWordsCache = new Cache<
	{ userId: UserProfile["userId"]; mutedWords: UserProfile["mutedWords"] }[]
>("mutedWords", 60 * 5);

type NotificationType = "reply" | "renote" | "quote" | "mention";

class NotificationManager {
	private notifier: { id: User["id"] };
	private note: Note;
	private queue: {
		target: ILocalUser["id"];
		reason: NotificationType;
	}[];

	constructor(notifier: { id: User["id"] }, note: Note) {
		this.notifier = notifier;
		this.note = note;
		this.queue = [];
	}

	public push(notifiee: ILocalUser["id"], reason: NotificationType) {
		// 自分自身へは通知しない
		if (this.notifier.id === notifiee) return;

		const exist = this.queue.find((x) => x.target === notifiee);

		if (exist) {
			// 「メンションされているかつ返信されている」場合は、メンションとしての通知ではなく返信としての通知にする
			if (reason !== "mention") {
				exist.reason = reason;
			}
		} else {
			this.queue.push({
				reason: reason,
				target: notifiee,
			});
		}
	}

	public async deliver() {
		for (const x of this.queue) {
			// ミュート情報を取得
			const mentioneeMutes = await Mutings.findBy({
				muterId: x.target,
			});

			const mentioneesMutedUserIds = mentioneeMutes.map((m) => m.muteeId);

			// 通知される側のユーザーが通知する側のユーザーをミュートしていない限りは通知する
			if (!mentioneesMutedUserIds.includes(this.notifier.id)) {
				createNotification(x.target, x.reason, {
					notifierId: this.notifier.id,
					noteId: this.note.id,
					note: this.note,
				});
			}
		}
	}
}

type MinimumUser = {
	id: User["id"];
	host: User["host"];
	username: User["username"];
	uri: User["uri"];
};

type Option = {
	createdAt?: Date | null;
	name?: string | null;
	text?: string | null;
	reply?: Note | null;
	reblogtrail?: Note[];
	renote?: Note | null;
	files?: DriveFile[] | null;
	poll?: IPoll | null;
	localOnly?: boolean | null;
	cw?: string | null;
	visibility?: string;
	visibleUsers?: MinimumUser[] | null;
	channel?: Channel | null;
	apMentions?: MinimumUser[] | null;
	apHashtags?: string[] | null;
	apEmojis?: string[] | null;
	uri?: string | null;
	url?: string | null;
	slug?: string | null;
	app?: App | null;
};


const processReply = async (reply, nmRelatedPromises, nm, user, note) => {
	// Fetch watchers
	nmRelatedPromises.push(notifyToWatchersOfReplyee(reply, user, nm));
	if (reply.userHost === null) {
		const threadMuted = await NoteThreadMutings.findOneBy({
			userId: reply.userId,
			threadId: reply.threadId || reply.id,
		});

		if (!threadMuted) {
			nm.push(reply.userId, "reply");

			const packedReply = await Notes.pack(note, {
				id: reply.userId,
			});
			publishMainStream( reply.userId, "reply", packedReply);

			const webhooks = (await getActiveWebhooks()).filter(
				(x) => x.userId === reply!.userId && x.on.includes("reply"),
			);
			for (const webhook of webhooks) {
				webhookDeliver(webhook, "reply", {
					note: packedReply,
				});
			}
		}
	}
}

export default async (
	user: {
		id: User["id"];
		username: User["username"];
		host: User["host"];
		isSilenced: User["isSilenced"];
		createdAt: User["createdAt"];
		isBot: User["isBot"];
		inbox?: User["inbox"];
	},
	data: Option,
	silent = false,
	noMentions = false,
) =>
	// rome-ignore lint/suspicious/noAsyncPromiseExecutor: FIXME
	new Promise<Note>(async (res, rej) => {
		const dontFederateInitially =
			data.localOnly || data.visibility === "hidden";

		let rootPost = null;
		if (data.reply && ( data.reply.replyId || data.reply.renoteId)) {
			rootPost = await getRootAncestor(data.reply);
		}

		// If you reply outside the channel, match the scope of the target.
		// TODO (I think it's a process that could be done on the client side, but it's server side for now.)
		if (
			data.reply &&
			data.channel &&
			data.reply.channelId !== data.channel.id
		) {
			if (data.reply.channelId) {
				data.channel = await Channels.findOneBy({ id: data.reply.channelId });
			} else {
				data.channel = null;
			}
		}

		// When you reply in a channel, match the scope of the target
		// TODO (I think it's a process that could be done on the client side, but it's server side for now.)
		if (data.reply && data.channel == null && data.reply.channelId) {
			data.channel = await Channels.findOneBy({ id: data.reply.channelId });
		}

		const now = new Date();
		if (
			!data.createdAt ||
			isNaN(data.createdAt.getTime()) ||
			data.createdAt > now
		)
			data.createdAt = now;
		if (data.visibility == null) data.visibility = "public";
		if (data.localOnly == null) data.localOnly = false;
		if (data.channel != null) data.visibility = "public";
		if (data.channel != null) data.visibleUsers = [];
		if (data.channel != null) data.localOnly = true;
		if (data.visibility === "hidden") data.visibility = "public";

		// enforce silent clients on server
		if (
			user.isSilenced &&
			data.visibility === "public" &&
			data.channel == null
		) {
			data.visibility = "home";
		}

		// Enforce home visibility if the user is in a silenced instance.
		if (
			data.visibility === "public" &&
			Users.isRemoteUser(user) &&
			(await shouldSilenceInstance(user.host))
		) {
			data.visibility = "home";
		}

		// Reject if the target of the renote is a public range other than "Home or Entire".
		if (
			data.renote &&
			data.renote.visibility !== "public" &&
			data.renote.visibility !== "home" &&
			data.renote.userId !== user.id
		) {
			return rej("Renote target is not public or home");
		}

		// If the target of the renote is not public, make it home.
		if (
			data.renote &&
			data.renote.visibility !== "public" &&
			data.visibility === "public"
		) {
			data.visibility = "home";
		}

		// If the target of Renote is followers, make it followers.
		if (data.renote && data.renote.visibility === "followers") {
			data.visibility = "followers";
		}

		// If the reply target is not public, make it home.
		if (
			data.reply &&
			data.reply.visibility !== "public" &&
			data.visibility === "public"
		) {
			data.visibility = "home";
		}

		// Renote local only if you Renote local only.
		if (data.renote?.localOnly && data.channel == null) {
			data.localOnly = true;
		}

		// If you reply to local only, make it local only.
		if (data.reply?.localOnly && data.channel == null) {
			data.localOnly = true;
		}

		if (data.text) {
			data.text = data.text.trim();
		} else {
			data.text = null;
		}

		let tags = data.apHashtags;
		let emojis = data.apEmojis;
		let mentionedUsers = data.apMentions;

		// Parse MFM if needed
		if (!(tags && emojis && mentionedUsers)) {
			const tokens = data.text ? mfm.parse(data.text)! : [];
			const cwTokens = data.cw ? mfm.parse(data.cw)! : [];
			const choiceTokens = data.poll?.choices
				? concat(data.poll.choices.map((choice) => mfm.parse(choice)!))
				: [];

			const combinedTokens = tokens.concat(cwTokens).concat(choiceTokens);

			tags = data.apHashtags || extractHashtags(combinedTokens);

			emojis = data.apEmojis || extractCustomEmojisFromMfm(combinedTokens);

			if(!noMentions) {
				mentionedUsers =
					data.apMentions || (await extractMentionedUsers(user, combinedTokens));
			}
		}

		tags = tags
			.filter((tag) => Array.from(tag || "").length <= 128)
			.splice(0, 32);

		if (
			!noMentions &&
			data.reply &&
			user.id !== data.reply.userId &&
			!mentionedUsers.some((u) => u.id === data.reply!.userId)
		) {
			mentionedUsers.push(
				await Users.findOneByOrFail({ id: data.reply!.userId }),
			);
		}

		if (data.visibility === "specified") {
			if (data.visibleUsers == null) throw new Error("invalid param");

			for (const u of data.visibleUsers) {
				if (!noMentions && !mentionedUsers.some((x) => x.id === u.id)) {
					mentionedUsers.push(u);
				}
			}

			if (
				data.reply &&
				!data.visibleUsers.some((x) => x.id === data.reply!.userId)
			) {
				data.visibleUsers.push(
					await Users.findOneByOrFail({ id: data.reply!.userId }),
				);
			}
		}

		data.slug = await getNoteSlug(data as Note)
		logger.info('created slug: ' + data.slug);
		if(user.username && data.slug && !data.url) {
			const host = user.host ? '@' + user.host : '';
			data.url = `${config.url}/@${user.username}${host}/${data.slug}`;
		}

		const note = await insertNote(user, data, tags, emojis, mentionedUsers);

		res(note);

		// 統計を更新
		notesChart.update(note, true, user.isBot);
		perUserNotesChart.update(user, note, true, user.isBot);

		// Register host
		if (Users.isRemoteUser(user)) {
			registerOrFetchInstanceDoc(user.host).then((i) => {
				Instances.increment({ id: i.id }, "notesCount", 1);
				instanceChart.updateNote(i.host, note, true);
			});
		}

		// ハッシュタグ更新
		if (data.visibility === "public" || data.visibility === "home") {
			updateHashtags(user, tags);
		}

		// Increment notes count (user)
		incNotesCountOfUser(user);

		// Word mute
		mutedWordsCache
			.fetch(null, () =>
				UserProfiles.find({
					where: {
						enableWordMute: true,
					},
					select: ["userId", "mutedWords"],
				}),
			)
			.then((us) => {
				for (const u of us) {
					getWordHardMute(data, { id: u.userId }, u.mutedWords).then(
						(shouldMute) => {
							if (shouldMute) {
								MutedNotes.insert({
									id: genId(),
									userId: u.userId,
									noteId: note.id,
									reason: "word",
								});
							}
						},
					);
				}
			});

		// Antenna
		for (const antenna of await getAntennas()) {
			checkHitAntenna(antenna, note, user).then((hit) => {
				if (hit) {
					addNoteToAntenna(antenna, note, user);
				}
			});
		}

		// Channel
		if (note.channelId) {
			ChannelFollowings.findBy({ followeeId: note.channelId }).then(
				(followings) => {
					for (const following of followings) {
						insertNoteUnread(following.followerId, note, {
							isSpecified: false,
							isMentioned: false,
						});
					}
				},
			);
		}
		if (data.reply) {
			saveReply(data.reply);
		}
		if (data.reply && rootPost && rootPost.id != data.reply.id) {
			saveReply(rootPost);
		}

		if (
			data.renote && (data.text || (tags && tags.length)) && !user.isBot ) {
			incQuoteCount(data.renote);
		} else if (
			data.renote &&
			!user.isBot
		) {
			incRenoteCount(data.renote);
		}



		if (data.poll?.expiresAt) {
			const delay = data.poll.expiresAt.getTime() - Date.now();
			endedPollNotificationQueue.add(
				{
					noteId: note.id,
				},
				{
					delay,
					removeOnComplete: true,
				},
			);
		}

		if (!silent && !noMentions) {
			if (Users.isLocalUser(user)) activeUsersChart.write(user);

			// 未読通知を作成
			if (data.visibility === "specified") {
				if (data.visibleUsers == null) throw new Error("invalid param");

				for (const u of data.visibleUsers) {
					// ローカルユーザーのみ
					if (!Users.isLocalUser(u)) continue;

					insertNoteUnread(u.id, note, {
						isSpecified: true,
						isMentioned: false,
					});
				}
			} else {
				for (const u of mentionedUsers) {
					// ローカルユーザーのみ
					if (!Users.isLocalUser(u)) continue;

					insertNoteUnread(u.id, note, {
						isSpecified: false,
						isMentioned: true,
					});
				}
			}

			if (!dontFederateInitially) {
				let publishKey: string;
				let noteToPublish: Note;
				const relays = await getCachedRelays();

				// Some relays (e.g., aode-relay) deliver posts by boosting them as
				// Announce activities. In that case, user is the relay's actor.
				const boostedByRelay =
					!!user.inbox &&
					relays.map((relay) => relay.inbox).includes(user.inbox);

				if (boostedByRelay && data.renote && data.renote.userHost) {
					publishKey = `publishedNote:${data.renote.id}`;
					noteToPublish = data.renote;
				} else {
					publishKey = `publishedNote:${note.id}`;
					noteToPublish = note;
				}

				const lock = new Mutex(redisClient, "publishedNote");
				await lock.acquire();
				try {
					const published = (await redisClient.get(publishKey)) !== null;
					if (!published) {
						await redisClient.set(publishKey, "done", "EX", 30);
						if (noteToPublish.renoteId) {
							// Prevents other threads from publishing the boosting post
							await redisClient.set(
								`publishedNote:${noteToPublish.renoteId}`,
								"done",
								"EX",
								30,
							);
						}
						publishNotesStream(noteToPublish);
					}
				} finally {
					await lock.release();
				}
			}
			if (note.replyId != null) {
				// Only provide the reply note id here as the recipient may not be authorized to see the note.
				publishNoteStream(note.replyId, "replied", {
					id: note.id,
				});
			}

			const webhooks = await getActiveWebhooks().then((webhooks) =>
				webhooks.filter((x) => x.userId === user.id && x.on.includes("note")),
			);

			for (const webhook of webhooks) {
				webhookDeliver(webhook, "note", {
					note: await Notes.pack(note, user),
				});
			}

			const nm = new NotificationManager(user, note);
			const nmRelatedPromises = [];

			await createMentionedEvents(mentionedUsers, note, nm);

			// If has in reply to note
			if (data.reply) {
				processReply(data.reply, nmRelatedPromises, nm, user, note);
				if(rootPost.id !== data.reply.id ) {
					processReply(rootPost, nmRelatedPromises, nm, user, note);
				}
			}

			// If it is renote
			if (data.renote) {
				const type = data.text ? "quote" : "renote";

				// Notify
				if (data.renote.userHost === null) {
					const threadMuted = await NoteThreadMutings.findOneBy({
						userId: data.renote.userId,
						threadId: data.renote.threadId || data.renote.id,
					});

					if (!threadMuted) {
						nm.push(data.renote.userId, type);
					}
				}
				// Fetch watchers
				nmRelatedPromises.push(
					notifyToWatchersOfRenotee(data.renote, user, nm, type),
				);
				if( data.reblogtrail && data.reblogtrail.length > 1 ) {
					for(let i = 0; i < data.reblogtrail.length; i++) {
						const rebloggedPost = data.reblogtrail[i];
						if (rebloggedPost.user && rebloggedPost.user.host === null) {
							const threadMuted = await NoteThreadMutings.findOneBy({
								userId: rebloggedPost.userId,
								threadId: rebloggedPost.id
							});

							if (!threadMuted) {
								nm.push(rebloggedPost.userId, type);
							}
						}
					}
				}

				// Publish event
				if (user.id !== data.renote.userId && data.renote.userHost === null) {
					const packedRenote = await Notes.pack(note, {
						id: data.renote.userId,
					});
					publishMainStream(data.renote.userId, "renote", packedRenote);

					const renote = data.renote;
					const webhooks = (await getActiveWebhooks()).filter(
						(x) => x.userId === renote.userId && x.on.includes("renote"),
					);
					for (const webhook of webhooks) {
						webhookDeliver(webhook, "renote", {
							note: packedRenote,
						});
					}
				}
			}

			Promise.all(nmRelatedPromises).then(() => {
				nm.deliver();
			});

			//#region AP deliver
			if (Users.isLocalUser(user) && !dontFederateInitially) {
				(async () => {
					const noteActivity = await renderNoteOrRenoteActivity(data, note);
					const dm = new DeliverManager(user, noteActivity);

					// メンションされたリモートユーザーに配送
					for (const u of mentionedUsers.filter((u) => Users.isRemoteUser(u))) {
						dm.addDirectRecipe(u as IRemoteUser);
					}

					// 投稿がリプライかつ投稿者がローカルユーザーかつリプライ先の投稿の投稿者がリモートユーザーなら配送
					if (data.reply && data.reply.userHost !== null) {
						const u = await Users.findOneBy({ id: data.reply.userId });
						if (u && Users.isRemoteUser(u)) dm.addDirectRecipe(u);
					}

					// 投稿がRenoteかつ投稿者がローカルユーザーかつRenote元の投稿の投稿者がリモートユーザーなら配送
					if (data.renote && data.renote.userHost !== null) {
						const u = await Users.findOneBy({ id: data.renote.userId });
						if (u && Users.isRemoteUser(u)) dm.addDirectRecipe(u);
					}

					// フォロワーに配送
					if (["public", "home", "followers"].includes(note.visibility)) {
						dm.addFollowersRecipe();
					}

					if (["public"].includes(note.visibility)) {
						deliverToRelays(user, noteActivity);
					}

					dm.execute();
				})();
			}
			//#endregion
		}

		if (data.channel) {
			Channels.increment({ id: data.channel.id }, "notesCount", 1);
			Channels.update(data.channel.id, {
				lastNotedAt: new Date(),
			});

			await Notes.countBy({
				userId: user.id,
				channelId: data.channel.id,
			}).then((count) => {
				// この処理が行われるのはノート作成後なので、ノートが一つしかなかったら最初の投稿だと判断できる
				// TODO: とはいえノートを削除して何回も投稿すればその分だけインクリメントされる雑さもあるのでどうにかしたい
				if (count === 1 && data.channel != null) {
					Channels.increment({ id: data.channel.id }, "usersCount", 1);
				}
			});
		}

		// Register to search database
		await index(note, false);
	});

async function renderNoteOrRenoteActivity(data: Option, note: Note) {
	if (data.localOnly) return null;

	const content =
		data.renote &&
		data.text == null &&
		data.poll == null &&
		(data.files == null || data.files.length === 0)
			? renderAnnounce(
					data.renote.uri
						? data.renote.uri
						: `${config.url}/notes/${data.renote.id}`,
					note,
			  )
			: renderCreate(await renderNote(note, false), note);

	return renderActivity(content);
}

function incRenoteCount(renote: Note) {
	Notes.createQueryBuilder()
		.update()
		.set({
			renoteCount: () => '"renoteCount" + 1',
			score: () => '"score" + 1',
		})
		.where("id = :id", { id: renote.id })
		.execute();
}


function incQuoteCount(renote: Note) {
	Notes.createQueryBuilder()
		.update()
		.set({
			quoteCount: () => '"quoteCount" + 1',
			score: () => '"score" + 1',
		})
		.where("id = :id", { id: renote.id })
		.execute();
}


async function insertNote(
	user: { id: User["id"]; host: User["host"] },
	data: Option,
	tags: string[],
	emojis: string[],
	mentionedUsers: MinimumUser[],
) {
	if (data.createdAt === null || data.createdAt === undefined) {
		data.createdAt = new Date();
	}

/*	if(data.reply && user.host) {
		// it's a reply created by a user in other server
		// so we want to convert it to a reblog format
		data.renote = data.reply;
		data.reply = null;

		if(data.renote.reblogtrail) {
			data.reblogtrail = data.renote.reblogtrail;
			data.reblogtrail.push(data.renote)
		} else {
			data.reblogtrail = [ data.renote ]
		}

	}*/

	const insert = new Note({
		id: genId(data.createdAt),
		createdAt: data.createdAt,
		fileIds: data.files ? data.files.map((file) => file.id) : [],
		replyId: data.reply ? data.reply.id : null,
		renoteId: data.renote ? data.renote.id : null,
		channelId: data.channel ? data.channel.id : null,
		threadId: data.reply
			? data.reply.threadId
				? data.reply.threadId
				: data.reply.id
			: null,
		reblogtrail: data.reblogtrail,
		name: data.name,
		text: data.text,
		slug: data.slug,
		hasPoll: data.poll != null,
		cw: data.cw == null ? null : data.cw,
		tags: tags.map((tag) => normalizeForSearch(tag)),
		emojis,
		userId: user.id,
		localOnly: data.localOnly || false,
		visibility: data.visibility as any,
		visibleUserIds:
			data.visibility === "specified"
				? data.visibleUsers
					? data.visibleUsers.map((u) => u.id)
					: []
				: [],

		attachedFileTypes: data.files ? data.files.map((file) => file.type) : [],

		// 以下非正規化データ
		replyUserId: data.reply ? data.reply.userId : null,
		replyUserHost: data.reply ? data.reply.userHost : null,
		renoteUserId: data.renote ? data.renote.userId : null,
		renoteUserHost: data.renote ? data.renote.userHost : null,
		userHost: user.host,
	});

	if (data.uri != null) insert.uri = data.uri;
	if (data.url != null) insert.url = data.url;

	// Append mentions data
	if (mentionedUsers.length > 0) {
		insert.mentions = mentionedUsers.map((u) => u.id);
		const profiles = await UserProfiles.findBy({ userId: In(insert.mentions) });
		insert.mentionedRemoteUsers = JSON.stringify(
			mentionedUsers
				.filter((u) => Users.isRemoteUser(u))
				.map((u) => {
					const profile = profiles.find((p) => p.userId === u.id);
					const url = profile != null ? profile.url : null;
					return {
						uri: u.uri,
						url: url == null ? undefined : url,
						username: u.username,
						host: u.host,
					} as IMentionedRemoteUsers[0];
				}),
		);
	}

	// 投稿を作成
	try {
		if (insert.hasPoll) {
			// Start transaction
			await db.transaction(async (transactionalEntityManager) => {
				if (!data.poll) throw new Error("Empty poll data");

				await transactionalEntityManager.insert(Note, insert);

				let expiresAt: Date | null;
				if (!data.poll.expiresAt || isNaN(data.poll.expiresAt.getTime())) {
					expiresAt = null;
				} else {
					expiresAt = data.poll.expiresAt;
				}

				const poll = new Poll({
					noteId: insert.id,
					choices: data.poll.choices,
					expiresAt,
					multiple: data.poll.multiple,
					votes: new Array(data.poll.choices.length).fill(0),
					noteVisibility: insert.visibility,
					userId: user.id,
					userHost: user.host,
				});

				await transactionalEntityManager.insert(Poll, poll);
			});
		} else {
			await Notes.insert(insert);
		}

		return insert;
	} catch (e) {
		// duplicate key error
		if (isDuplicateKeyValueError(e)) {
			const err = new Error("Duplicated note");
			err.name = "duplicated";
			throw err;
		}

		console.error(e);

		throw e;
	}
}

export async function index(note: Note, reindexing: boolean): Promise<void> {
	if (!note.text) return;

	if (config.elasticsearch && es) {
		es.index({
			index: config.elasticsearch.index || "misskey_note",
			id: note.id.toString(),
			body: {
				text: normalizeForSearch(note.text),
				userId: note.userId,
				userHost: note.userHost,
			},
		});
	}

	if (sonic) {
		await sonic.ingest.push(
			sonic.collection,
			sonic.bucket,
			JSON.stringify({
				id: note.id,
				userId: note.userId,
				userHost: note.userHost,
				channelId: note.channelId,
			}),
			note.text,
		);
	}

	if (meilisearch && !reindexing) {
		await meilisearch.ingestNote(note);
	}
}

async function notifyToWatchersOfRenotee(
	renote: Note,
	user: { id: User["id"] },
	nm: NotificationManager,
	type: NotificationType,
) {
	const watchers = await NoteWatchings.findBy({
		noteId: renote.id,
		userId: Not(user.id),
	});

	for (const watcher of watchers) {
		nm.push(watcher.userId, type);
	}
}

async function notifyToWatchersOfReplyee(
	reply: Note,
	user: { id: User["id"] },
	nm: NotificationManager,
) {
	const watchers = await NoteWatchings.findBy({
		noteId: reply.id,
		userId: Not(user.id),
	});

	for (const watcher of watchers) {
		nm.push(watcher.userId, "reply");
	}
}

async function createMentionedEvents(
	mentionedUsers: MinimumUser[],
	note: Note,
	nm: NotificationManager,
) {
	for (const u of mentionedUsers.filter((u) => Users.isLocalUser(u))) {
		const threadMuted = await NoteThreadMutings.findOneBy({
			userId: u.id,
			threadId: note.threadId || note.id,
		});

		if (threadMuted) {
			continue;
		}

		// note with "specified" visibility might not be visible to mentioned users
		try {
			const detailPackedNote = await Notes.pack(note, u, {
				detail: true,
			});

			publishMainStream(u.id, "mention", detailPackedNote);

			const webhooks = (await getActiveWebhooks()).filter(
				(x) => x.userId === u.id && x.on.includes("mention"),
			);
			for (const webhook of webhooks) {
				webhookDeliver(webhook, "mention", {
					note: detailPackedNote,
				});
			}
		} catch (err) {
			if (err.id === "9725d0ce-ba28-4dde-95a7-2cbb2c15de24") continue;
			throw err;
		}

		// Create notification
		nm.push(u.id, "mention");
	}
}

function saveReply(reply: Note) {
	logger.info('saving reply for ' + reply.id);
	Notes.increment({ id: reply.id }, "repliesCount", 1);
}

function incNotesCountOfUser(user: { id: User["id"] }) {
	Users.createQueryBuilder()
		.update()
		.set({
			updatedAt: new Date(),
			notesCount: () => '"notesCount" + 1',
		})
		.where("id = :id", { id: user.id })
		.execute();
}

export async function extractMentionedUsers(
	user: { host: User["host"] },
	tokens: mfm.MfmNode[],
): Promise<User[]> {
	if (tokens == null) return [];

	const mentions = extractMentions(tokens);

	let mentionedUsers = (
		await Promise.all(
			mentions.map((m) =>
				resolveUser(m.username, m.host || user.host).catch(() => null),
			),
		)
	).filter((x) => x != null) as User[];

	// Drop duplicate users
	mentionedUsers = mentionedUsers.filter(
		(u, i, self) => i === self.findIndex((u2) => u.id === u2.id),
	);

	return mentionedUsers;
}
