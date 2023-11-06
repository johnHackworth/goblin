import { In } from "typeorm";
import create, { index } from "@/services/note/create.js";
import type { IRemoteUser, User } from "@/models/entities/user.js";
import {
	Users,
	DriveFiles,
	Notes,
	Channels,
	Blockings,
	UserProfiles,
	Polls,
	NoteEdits,
} from "@/models/index.js";
import type { DriveFile } from "@/models/entities/drive-file.js";
import type { IMentionedRemoteUsers, Note } from "@/models/entities/note.js";
import type { Channel } from "@/models/entities/channel.js";
import { MAX_NOTE_TEXT_LENGTH } from "@/const.js";
import { noteVisibilities } from "../../../../types.js";
import { ApiError } from "../../error.js";
import define from "../../define.js";
import { HOUR } from "@/const.js";
import { getNote } from "../../common/getters.js";
import { Poll } from "@/models/entities/poll.js";
import * as mfm from "mfm-js";
import { concat } from "@/prelude/array.js";
import { extractHashtags } from "@/misc/extract-hashtags.js";
import { extractCustomEmojisFromMfm } from "@/misc/extract-custom-emojis-from-mfm.js";
import { extractMentionedUsers } from "@/services/note/create.js";
import { genId } from "@/misc/gen-id.js";
import { publishNoteStream } from "@/services/stream.js";
import DeliverManager from "@/remote/activitypub/deliver-manager.js";
import { renderActivity } from "@/remote/activitypub/renderer/index.js";
import renderNote from "@/remote/activitypub/renderer/note.js";
import renderUpdate from "@/remote/activitypub/renderer/update.js";
import { deliverToRelays } from "@/services/relay.js";
// import { deliverQuestionUpdate } from "@/services/note/polls/update.js";
import { fetchMeta } from "@/misc/fetch-meta.js";

export const meta = {
	tags: ["notes"],

	requireCredential: true,

	limit: {
		duration: HOUR,
		max: 300,
	},

	kind: "write:notes",

	res: {
		type: "object",
		optional: false,
		nullable: false,
		properties: {
			createdNote: {
				type: "object",
				optional: false,
				nullable: false,
				ref: "Note",
			},
		},
	},

	errors: {
		noSuchRenoteTarget: {
			message: "No such renote target.",
			code: "NO_SUCH_RENOTE_TARGET",
			id: "b5c90186-4ab0-49c8-9bba-a1f76c282ba4",
		},

		cannotReRenote: {
			message: "You can not Renote a pure Renote.",
			code: "CANNOT_RENOTE_TO_A_PURE_RENOTE",
			id: "fd4cc33e-2a37-48dd-99cc-9b806eb2031a",
		},

		noSuchReplyTarget: {
			message: "No such reply target.",
			code: "NO_SUCH_REPLY_TARGET",
			id: "749ee0f6-d3da-459a-bf02-282e2da4292c",
		},

		cannotReplyToPureRenote: {
			message: "You can not reply to a pure Renote.",
			code: "CANNOT_REPLY_TO_A_PURE_RENOTE",
			id: "3ac74a84-8fd5-4bb0-870f-01804f82ce15",
		},

		cannotCreateAlreadyExpiredPoll: {
			message: "Poll is already expired.",
			code: "CANNOT_CREATE_ALREADY_EXPIRED_POLL",
			id: "04da457d-b083-4055-9082-955525eda5a5",
		},

		noSuchChannel: {
			message: "No such channel.",
			code: "NO_SUCH_CHANNEL",
			id: "b1653923-5453-4edc-b786-7c4f39bb0bbb",
		},

		youHaveBeenBlocked: {
			message: "You have been blocked by this user.",
			code: "YOU_HAVE_BEEN_BLOCKED",
			id: "b390d7e1-8a5e-46ed-b625-06271cafd3d3",
		},

		accountLocked: {
			message: "You migrated. Your account is now locked.",
			code: "ACCOUNT_LOCKED",
			id: "d390d7e1-8a5e-46ed-b625-06271cafd3d3",
		},

		needsEditId: {
			message: "You need to specify `editId`.",
			code: "NEEDS_EDIT_ID",
			id: "d697edc8-8c73-4de8-bded-35fd198b79e5",
		},

		noSuchNote: {
			message: "No such note.",
			code: "NO_SUCH_NOTE",
			id: "eef6c173-3010-4a23-8674-7c4fcaeba719",
		},

		youAreNotTheAuthor: {
			message: "You are not the author of this note.",
			code: "YOU_ARE_NOT_THE_AUTHOR",
			id: "c6e61685-411d-43d0-b90a-a448d2539001",
		},

		cannotPrivateRenote: {
			message: "You can not perform a private renote.",
			code: "CANNOT_PRIVATE_RENOTE",
			id: "19a50f1c-84fa-4e33-81d3-17834ccc0ad8",
		},

		notLocalUser: {
			message: "You are not a local user.",
			code: "NOT_LOCAL_USER",
			id: "b907f407-2aa0-4283-800b-a2c56290b822",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		editId: { type: "string", format: "misskey:id" },
		visibility: { type: "string", enum: noteVisibilities, default: "public" },
		visibleUserIds: {
			type: "array",
			uniqueItems: true,
			items: {
				type: "string",
				format: "misskey:id",
			},
		},
		text: { type: "string", maxLength: MAX_NOTE_TEXT_LENGTH, nullable: true },
		cw: { type: "string", nullable: true, maxLength: 250 },
		localOnly: { type: "boolean", default: false },
		noExtractMentions: { type: "boolean", default: false },
		noExtractHashtags: { type: "boolean", default: false },
		noExtractEmojis: { type: "boolean", default: false },
		fileIds: {
			type: "array",
			uniqueItems: true,
			minItems: 1,
			maxItems: 16,
			items: { type: "string", format: "misskey:id" },
		},
		mediaIds: {
			deprecated: true,
			description:
				"Use `fileIds` instead. If both are specified, this property is discarded.",
			type: "array",
			uniqueItems: true,
			minItems: 1,
			maxItems: 16,
			items: { type: "string", format: "misskey:id" },
		},
		replyId: { type: "string", format: "misskey:id", nullable: true },
		renoteId: { type: "string", format: "misskey:id", nullable: true },
		channelId: { type: "string", format: "misskey:id", nullable: true },
		poll: {
			type: "object",
			nullable: true,
			properties: {
				choices: {
					type: "array",
					uniqueItems: true,
					minItems: 2,
					maxItems: 10,
					items: { type: "string", minLength: 1, maxLength: 50 },
				},
				multiple: { type: "boolean", default: false },
				expiresAt: { type: "integer", nullable: true },
				expiredAfter: { type: "integer", nullable: true, minimum: 1 },
			},
			required: ["choices"],
		},
	},
	anyOf: [
		{
			// (re)note with text, files and poll are optional
			properties: {
				text: {
					type: "string",
					minLength: 1,
					maxLength: MAX_NOTE_TEXT_LENGTH,
					nullable: false,
				},
			},
			required: ["text"],
		},
		{
			// (re)note with files, text and poll are optional
			required: ["fileIds"],
		},
		{
			// (re)note with files, text and poll are optional
			required: ["mediaIds"],
		},
		{
			// (re)note with poll, text and files are optional
			properties: {
				poll: { type: "object", nullable: false },
			},
			required: ["poll"],
		},
		{
			// pure renote
			required: ["renoteId"],
		},
	],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	if (user.movedToUri != null) throw new ApiError(meta.errors.accountLocked);

	if (!Users.isLocalUser(user)) {
		throw new ApiError(meta.errors.notLocalUser);
	}

	if (!ps.editId) {
		throw new ApiError(meta.errors.needsEditId);
	}

	let publishing = false;
	let note = await Notes.findOneBy({
		id: ps.editId,
	});

	if (note == null) {
		throw new ApiError(meta.errors.noSuchNote);
	}

	if (note.userId !== user.id) {
		throw new ApiError(meta.errors.youAreNotTheAuthor);
	}

	let renote: Note | null = null;
	if (ps.renoteId != null) {
		// Fetch renote to note
		renote = await getNote(ps.renoteId, user).catch((e) => {
			if (e.id === "9725d0ce-ba28-4dde-95a7-2cbb2c15de24")
				throw new ApiError(meta.errors.noSuchRenoteTarget);
			throw e;
		});

		if (renote.renoteId && !renote.text && !renote.fileIds && !renote.hasPoll) {
			throw new ApiError(meta.errors.cannotReRenote);
		}

		// Check blocking
		if (renote.userId !== user.id) {
			const block = await Blockings.findOneBy({
				blockerId: renote.userId,
				blockeeId: user.id,
			});
			if (block) {
				throw new ApiError(meta.errors.youHaveBeenBlocked);
			}
		}
	}

	let reply: Note | null = null;
	if (ps.replyId != null) {
		// Fetch reply
		reply = await getNote(ps.replyId, user).catch((e) => {
			if (e.id === "9725d0ce-ba28-4dde-95a7-2cbb2c15de24")
				throw new ApiError(meta.errors.noSuchReplyTarget);
			throw e;
		});

		if (reply.renoteId && !reply.text && !reply.fileIds && !reply.hasPoll) {
			throw new ApiError(meta.errors.cannotReplyToPureRenote);
		}

		// Check blocking
		if (reply.userId !== user.id) {
			const block = await Blockings.findOneBy({
				blockerId: reply.userId,
				blockeeId: user.id,
			});
			if (block) {
				throw new ApiError(meta.errors.youHaveBeenBlocked);
			}
		}
	}

	let channel: Channel | null = null;
	if (ps.channelId != null) {
		channel = await Channels.findOneBy({ id: ps.channelId });

		if (channel == null) {
			throw new ApiError(meta.errors.noSuchChannel);
		}
	}

	// enforce silent clients on server
	if (user.isSilenced && ps.visibility === "public" && ps.channelId == null) {
		ps.visibility = "home";
	}

	// Reject if the target of the renote is a public range other than "Home or Entire".
	if (
		renote &&
		renote.visibility !== "public" &&
		renote.visibility !== "home" &&
		renote.userId !== user.id
	) {
		throw new ApiError(meta.errors.cannotPrivateRenote);
	}

	// If the target of the renote is not public, make it home.
	if (renote && renote.visibility !== "public" && ps.visibility === "public") {
		ps.visibility = "home";
	}

	// If the reply target is not public, make it home.
	if (reply && reply.visibility !== "public" && ps.visibility === "public") {
		ps.visibility = "home";
	}

	// Renote local only if you Renote local only.
	if (renote?.localOnly && ps.channelId == null) {
		ps.localOnly = true;
	}

	// If you reply to local only, make it local only.
	if (reply?.localOnly && ps.channelId == null) {
		ps.localOnly = true;
	}

	if (ps.text) {
		ps.text = ps.text.trim();
	} else {
		ps.text = null;
	}

	let tags = [];
	let emojis = [];
	let mentionedUsers = [];

	const tokens = ps.text ? mfm.parse(ps.text) : [];
	const cwTokens = ps.cw ? mfm.parse(ps.cw) : [];
	const choiceTokens = ps.poll?.choices
		? concat(ps.poll.choices.map((choice) => mfm.parse(choice)))
		: [];

	const combinedTokens = tokens.concat(cwTokens).concat(choiceTokens);

	tags = extractHashtags(combinedTokens);

	emojis = extractCustomEmojisFromMfm(combinedTokens);

	mentionedUsers = await extractMentionedUsers(user, combinedTokens);

	tags = [...new Set(tags)]
		.sort()
		.filter((tag) => Array.from(tag || "").length <= 128)
		.splice(0, 32);

	emojis = [...new Set(emojis)].sort();

	if (
		reply &&
		user.id !== reply.userId &&
		!mentionedUsers.some((u) => u.id === reply?.userId)
	) {
		mentionedUsers.push(await Users.findOneByOrFail({ id: reply.userId }));
	}

	let visibleUsers: User[] = [];
	if (ps.visibleUserIds) {
		visibleUsers = await Users.findBy({
			id: In(ps.visibleUserIds),
		});
	}

	if (ps.visibility === "specified") {
		if (visibleUsers == null) throw new Error("invalid param");

		for (const u of visibleUsers) {
			if (!mentionedUsers.some((x) => x.id === u.id)) {
				mentionedUsers.push(u);
			}
		}

		if (reply && !visibleUsers.some((x) => x.id === reply?.userId)) {
			visibleUsers.push(await Users.findOneByOrFail({ id: reply.userId }));
		}
	}

	let files: DriveFile[] = [];
	const fileIds =
		ps.fileIds != null ? ps.fileIds : ps.mediaIds != null ? ps.mediaIds : null;
	if (fileIds != null) {
		files = await DriveFiles.createQueryBuilder("file")
			.where("file.userId = :userId AND file.id IN (:...fileIds)", {
				userId: user.id,
				fileIds,
			})
			.orderBy('array_position(ARRAY[:...fileIds], "id"::text)')
			.setParameters({ fileIds })
			.getMany();
	}

	if (ps.poll) {
		let expires = ps.poll.expiresAt;
		if (typeof expires === "number") {
			if (expires < Date.now()) {
				throw new ApiError(meta.errors.cannotCreateAlreadyExpiredPoll);
			}
		} else if (typeof ps.poll.expiredAfter === "number") {
			expires = Date.now() + ps.poll.expiredAfter;
		}

		let poll = await Polls.findOneBy({ noteId: note.id });
		const pp = ps.poll;
		if (!poll && pp) {
			poll = new Poll({
				noteId: note.id,
				choices: pp.choices,
				expiresAt: expires ? new Date(expires) : null,
				multiple: pp.multiple,
				votes: new Array(pp.choices.length).fill(0),
				noteVisibility: ps.visibility,
				userId: user.id,
				userHost: user.host,
			});
			await Polls.insert(poll);
			publishing = true;
		} else if (poll && !pp) {
			await Polls.remove(poll);
			publishing = true;
		} else if (poll && pp) {
			const pollUpdate: Partial<Poll> = {};
			if (poll.expiresAt !== expires) {
				pollUpdate.expiresAt = expires ? new Date(expires) : null;
			}
			if (poll.multiple !== pp.multiple) {
				pollUpdate.multiple = pp.multiple;
			}
			if (poll.noteVisibility !== ps.visibility) {
				pollUpdate.noteVisibility = ps.visibility;
			}
			// Keep votes for unmodified choices, reset votes if choice is modified or new
			const oldVoteCounts = new Map<string, number>();
			for (let i = 0; i < poll.choices.length; i++) {
				oldVoteCounts.set(poll.choices[i], poll.votes[i]);
			}
			const newVotes = pp.choices.map(
				(choice) => oldVoteCounts.get(choice) || 0,
			);
			pollUpdate.choices = pp.choices;
			pollUpdate.votes = newVotes;
			if (notEmpty(pollUpdate)) {
				await Polls.update(note.id, pollUpdate);
				// Seemingly already handled by by the rendered update activity
				// await deliverQuestionUpdate(note.id);
			}
			publishing = true;
		}
	}

	const mentionedUserLookup: Record<string, User> = {};
	mentionedUsers.forEach((u) => {
		mentionedUserLookup[u.id] = u;
	});

	const mentionedUserIds = [...new Set(mentionedUsers.map((u) => u.id))].sort();

	const remoteUsers = mentionedUserIds
		.map((id) => mentionedUserLookup[id])
		.filter((u) => u.host != null);

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

	const update: Partial<Note> = {};
	if (ps.text !== note.text) {
		update.text = ps.text;
	}
	if (ps.cw !== note.cw || (ps.cw && !note.cw)) {
		update.cw = ps.cw;
	}
	if (!ps.cw && note.cw) {
		update.cw = null;
	}
	if (ps.visibility !== note.visibility) {
		update.visibility = ps.visibility;
	}
	if (ps.localOnly !== note.localOnly) {
		update.localOnly = ps.localOnly;
	}
	if (ps.visibleUserIds !== note.visibleUserIds) {
		update.visibleUserIds = ps.visibleUserIds;
	}
	if (!unorderedEqual(mentionedUserIds, note.mentions)) {
		update.mentions = mentionedUserIds;
		update.mentionedRemoteUsers = JSON.stringify(mentionedRemoteUsers);
	}
	if (ps.channelId !== note.channelId) {
		update.channelId = ps.channelId;
	}
	if (ps.replyId !== note.replyId) {
		update.replyId = ps.replyId;
	}
	if (ps.renoteId !== note.renoteId) {
		update.renoteId = ps.renoteId;
	}
	if (note.hasPoll !== !!ps.poll) {
		update.hasPoll = !!ps.poll;
	}
	if (!unorderedEqual(emojis, note.emojis)) {
		update.emojis = emojis;
	}
	if (!unorderedEqual(tags, note.tags)) {
		update.tags = tags;
	}
	if (!unorderedEqual(ps.fileIds || [], note.fileIds)) {
		update.fileIds = fileIds || undefined;

		if (fileIds) {
			// Get attachedFileTypes for each file with fileId from fileIds
			const attachedFiles = fileIds.map((fileId) =>
				files.find((file) => file.id === fileId),
			);
			update.attachedFileTypes = attachedFiles.map(
				(file) => file?.type || "application/octet-stream",
			);
		} else {
			update.attachedFileTypes = undefined;
		}
	}

	if (notEmpty(update)) {
		update.updatedAt = new Date();
		await Notes.update(note.id, update);

		// Add NoteEdit history
		await NoteEdits.insert({
			id: genId(),
			noteId: note.id,
			text: ps.text || undefined,
			cw: ps.cw,
			fileIds: ps.fileIds,
			updatedAt: new Date(),
		});

		publishing = true;
	}

	note = await Notes.findOneBy({ id: note.id });
	if (!note) {
		throw new ApiError(meta.errors.noSuchNote);
	}

	if (publishing) {
		index(note, true);

		// Publish update event for the updated note details
		publishNoteStream(note.id, "updated", {
			updatedAt: update.updatedAt,
		});

		(async () => {
			const noteActivity = await renderNote(note, false);
			noteActivity.updated = note.updatedAt.toISOString();
			const updateActivity = renderUpdate(noteActivity, user);
			updateActivity.to = noteActivity.to;
			updateActivity.cc = noteActivity.cc;
			const activity = renderActivity(updateActivity);
			const dm = new DeliverManager(user, activity);

			// Delivery to remote mentioned users
			for (const u of mentionedUsers.filter((u) => Users.isRemoteUser(u))) {
				dm.addDirectRecipe(u as IRemoteUser);
			}

			// Post is a reply and remote user is the contributor of the original post
			if (note.reply && note.reply.userHost !== null) {
				const u = await Users.findOneBy({ id: note.reply.userId });
				if (u && Users.isRemoteUser(u)) dm.addDirectRecipe(u);
			}

			// Post is a renote and remote user is the contributor of the original post
			if (note.renote && note.renote.userHost !== null) {
				const u = await Users.findOneBy({ id: note.renote.userId });
				if (u && Users.isRemoteUser(u)) dm.addDirectRecipe(u);
			}

			// Deliver to followers for non-direct posts.
			if (["public", "home", "followers"].includes(note.visibility)) {
				dm.addFollowersRecipe();
			}

			// Deliver to relays for public posts.
			if (["public"].includes(note.visibility)) {
				deliverToRelays(user, activity);
			}

			// GO!
			dm.execute();
		})();
	}

	return {
		createdNote: await Notes.pack(note, user),
	};
});

function unorderedEqual<T>(a: T[], b: T[]) {
	return a.length === b.length && a.every((v) => b.includes(v));
}

function notEmpty(partial: Partial<any>) {
	return Object.keys(partial).length > 0;
}
