import { In } from "typeorm";
import * as mfm from "mfm-js";
import { Note } from "@/models/entities/note.js";
import type { User } from "@/models/entities/user.js";
import {
	Users,
	PollVotes,
	DriveFiles,
	NoteReactions,
	Followings,
	Polls,
	Channels,
} from "../index.js";
import type { Packed } from "@/misc/schema.js";
import { nyaize } from "@/misc/nyaize.js";
import { awaitAll } from "@/prelude/await-all.js";
import {
	convertLegacyReaction,
	convertLegacyReactions,
	decodeReaction,
} from "@/misc/reaction-lib.js";
import type { NoteReaction } from "@/models/entities/note-reaction.js";
import {
	aggregateNoteEmojis,
	populateEmojis,
	prefetchEmojis,
} from "@/misc/populate-emojis.js";
import { db } from "@/db/postgre.js";
import { IdentifiableError } from "@/misc/identifiable-error.js";

export async function populatePoll(note: Note, meId: User["id"] | null) {
	const poll = await Polls.findOneByOrFail({ noteId: note.id });
	const choices = poll.choices.map((c) => ({
		text: c,
		votes: poll.votes[poll.choices.indexOf(c)],
		isVoted: false,
	}));

	if (meId) {
		if (poll.multiple) {
			const votes = await PollVotes.findBy({
				userId: meId,
				noteId: note.id,
			});

			const myChoices = votes.map((v) => v.choice);
			for (const myChoice of myChoices) {
				choices[myChoice].isVoted = true;
			}
		} else {
			const vote = await PollVotes.findOneBy({
				userId: meId,
				noteId: note.id,
			});

			if (vote) {
				choices[vote.choice].isVoted = true;
			}
		}
	}

	return {
		multiple: poll.multiple,
		expiresAt: poll.expiresAt,
		choices,
	};
}

async function populateMyReaction(
	note: Note,
	meId: User["id"],
	_hint_?: {
		myReactions: Map<Note["id"], NoteReaction | null>;
	},
) {
	if (_hint_?.myReactions) {
		const reaction = _hint_.myReactions.get(note.id);
		if (reaction) {
			return convertLegacyReaction(reaction.reaction);
		} else if (reaction === null) {
			return undefined;
		}
		// 実装上抜けがあるだけかもしれないので、「ヒントに含まれてなかったら(=undefinedなら)return」のようにはしない
	}

	const reaction = await NoteReactions.findOneBy({
		userId: meId,
		noteId: note.id,
	});

	if (reaction) {
		return convertLegacyReaction(reaction.reaction);
	}

	return undefined;
}

export const NoteRepository = db.getRepository(Note).extend({
	async isVisibleForMe(note: Note, meId: User["id"] | null): Promise<boolean> {
		// This code must always be synchronized with the checks in generateVisibilityQuery.
		// visibility が specified かつ自分が指定されていなかったら非表示
		if (note.visibility === "specified") {
			if (meId == null) {
				return false;
			} else if (meId === note.userId) {
				return true;
			} else {
				// 指定されているかどうか
				return note.visibleUserIds.some((id: any) => meId === id);
			}
		}

		// visibility が followers かつ自分が投稿者のフォロワーでなかったら非表示
		if (note.visibility === "followers") {
			if (meId == null) {
				return false;
			} else if (meId === note.userId) {
				return true;
			} else if (note.reply && meId === note.reply.userId) {
				// 自分の投稿に対するリプライ
				return true;
			} else if (note.mentions?.some((id) => meId === id)) {
				// 自分へのメンション
				return true;
			} else {
				// フォロワーかどうか
				const [following, user] = await Promise.all([
					Followings.count({
						where: {
							followeeId: note.userId,
							followerId: meId,
						},
						take: 1,
					}),
					Users.findOneByOrFail({ id: meId }),
				]);

				/* If we know the following, everyhting is fine.

				But if we do not know the following, it might be that both the
				author of the note and the author of the like are remote users,
				in which case we can never know the following. Instead we have
				to assume that the users are following each other.
				*/
				return following > 0 || (note.userHost != null && user.host != null);
			}
		}

		return true;
	},

	async pack(
		src: Note["id"] | Note,
		me?: { id: User["id"] } | null | undefined,
		options?: {
			detail?: boolean;
			_hint_?: {
				myReactions: Map<Note["id"], NoteReaction | null>;
			};
		},
	): Promise<Packed<"Note">> {
		const opts = Object.assign(
			{
				detail: true,
			},
			options,
		);

		const meId = me ? me.id : null;
		const note =
			typeof src === "object" ? src : await this.findOneByOrFail({ id: src });
		const host = note.userHost;

		if (!(await this.isVisibleForMe(note, meId))) {
			throw new IdentifiableError(
				"9725d0ce-ba28-4dde-95a7-2cbb2c15de24",
				"No such note.",
			);
		}

		let text = note.text;

		if (note.name && (note.url ?? note.uri)) {
			text = `【${note.name}】\n${(note.text || "").trim()}\n\n${
				note.url ?? note.uri
			}`;
		}

		const channel = note.channelId
			? note.channel
				? note.channel
				: await Channels.findOneBy({ id: note.channelId })
			: null;

		const reactionEmojiNames = Object.keys(note.reactions)
			.filter((x) => x?.startsWith(":"))
			.map((x) => decodeReaction(x).reaction)
			.map((x) => x.replace(/:/g, ""));

		const noteEmoji = await populateEmojis(
			note.emojis.concat(reactionEmojiNames),
			host,
		);
		const reactionEmoji = await populateEmojis(reactionEmojiNames, host);
		const packed: Packed<"Note"> = await awaitAll({
			id: note.id,
			createdAt: note.createdAt.toISOString(),
			userId: note.userId,
			user: Users.pack(note.user ?? note.userId, me, {
				detail: false,
			}),
			text: text,
			cw: note.cw,
			visibility: note.visibility,
			localOnly: note.localOnly || undefined,
			visibleUserIds:
				note.visibility === "specified" ? note.visibleUserIds : undefined,
			renoteCount: note.renoteCount,
			quoteCount: note.quoteCount,
			repliesCount: note.repliesCount,
			reactions: convertLegacyReactions(note.reactions),
			reblogtrail: note.reblogtrail,
			reactionEmojis: reactionEmoji,
			emojis: noteEmoji,
			tags: note.tags.length > 0 ? note.tags : undefined,
			fileIds: note.fileIds,
			files: DriveFiles.packMany(note.fileIds),
			replyId: note.replyId,
			renoteId: note.renoteId,
			channelId: note.channelId || undefined,
			channel: channel
				? {
						id: channel.id,
						name: channel.name,
				  }
				: undefined,
			mentions: note.mentions.length > 0 ? note.mentions : undefined,
			uri: note.uri || undefined,
			url: note.url || undefined,
			updatedAt: note.updatedAt?.toISOString() || undefined,
			poll: note.hasPoll ? populatePoll(note, meId) : undefined,
			...(meId
				? {
						myReaction: populateMyReaction(note, meId, options?._hint_),
				  }
				: {}),

			...(opts.detail
				? {
						reply: note.replyId
							? this.pack(note.reply || note.replyId, me, {
									detail: false,
									_hint_: options?._hint_,
							  })
							: undefined,

						renote: note.renoteId
							? this.pack(note.renote || note.renoteId, me, {
									detail: true,
									_hint_: options?._hint_,
							  })
							: undefined,
				  }
				: {}),
		});

		if (packed.user.isCat && packed.user.speakAsCat && packed.text) {
			const tokens = packed.text ? mfm.parse(packed.text) : [];
			function nyaizeNode(node: mfm.MfmNode) {
				if (node.type === "quote") return;
				if (node.type === "text") node.props.text = nyaize(node.props.text);

				if (node.children) {
					for (const child of node.children) {
						nyaizeNode(child);
					}
				}
			}

			for (const node of tokens) nyaizeNode(node);

			packed.text = mfm.toString(tokens);
		}

		return packed;
	},

	async packMany(
		notes: Note[],
		me?: { id: User["id"] } | null | undefined,
		options?: {
			detail?: boolean;
		},
	) {
		if (notes.length === 0) return [];

		const meId = me ? me.id : null;
		const myReactionsMap = new Map<Note["id"], NoteReaction | null>();
		if (meId) {
			const renoteIds = notes
				.filter((n) => n.renoteId != null)
				.map((n) => n.renoteId!);
			const targets = [...notes.map((n) => n.id), ...renoteIds];
			const myReactions = await NoteReactions.findBy({
				userId: meId,
				noteId: In(targets),
			});

			for (const target of targets) {
				myReactionsMap.set(
					target,
					myReactions.find((reaction) => reaction.noteId === target) || null,
				);
			}
		}

		await prefetchEmojis(aggregateNoteEmojis(notes));

		const promises = await Promise.allSettled(
			notes.map((n) =>
				this.pack(n, me, {
					...options,
					_hint_: {
						myReactions: myReactionsMap,
					},
				}),
			),
		);

		// filter out rejected promises, only keep fulfilled values
		return promises.flatMap((result) =>
			result.status === "fulfilled" ? [result.value] : [],
		);
	},
});
