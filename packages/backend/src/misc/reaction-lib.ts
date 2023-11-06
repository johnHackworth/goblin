import { emojiRegex } from "./emoji-regex.js";
import { fetchMeta } from "./fetch-meta.js";
import { Emojis } from "@/models/index.js";
import { toPunyNullable } from "./convert-host.js";
import { IsNull } from "typeorm";

const legacies = new Map([
	["like", "👍"],
	["love", "❤️"],
	["laugh", "😆"],
	["hmm", "🤔"],
	["surprise", "😮"],
	["congrats", "🎉"],
	["angry", "💢"],
	["confused", "😥"],
	["rip", "😇"],
	["pudding", "🍮"],
	["star", "⭐"],
]);

export async function getFallbackReaction() {
	const meta = await fetchMeta();
	return meta.defaultReaction;
}

export function convertLegacyReactions(reactions: Record<string, number>) {
	const _reactions = new Map();
	const decodedReactions = new Map();

	for (const reaction in reactions) {
		if (reactions[reaction] <= 0) continue;

		let decodedReaction;
		if (decodedReactions.has(reaction)) {
			decodedReaction = decodedReactions.get(reaction);
		} else {
			decodedReaction = decodeReaction(reaction);
			decodedReactions.set(reaction, decodedReaction);
		}

		let emoji = legacies.get(decodedReaction.reaction);
		if (emoji) {
			_reactions.set(emoji, (_reactions.get(emoji) || 0) + reactions[reaction]);
		} else {
			_reactions.set(
				reaction,
				(_reactions.get(reaction) || 0) + reactions[reaction],
			);
		}
	}

	const _reactions2 = new Map();
	for (const [reaction, count] of _reactions) {
		const decodedReaction = decodedReactions.get(reaction);
		_reactions2.set(decodedReaction.reaction, count);
	}

	return Object.fromEntries(_reactions2);
}

export async function toDbReaction(
	reaction?: string | null,
	reacterHost?: string | null,
): Promise<string> {
	if (!reaction) return await getFallbackReaction();

	reacterHost = toPunyNullable(reacterHost);

	// Convert string-type reactions to unicode
	const emoji = legacies.get(reaction) || (reaction === "♥️" ? "❤️" : null);
	if (emoji) return emoji;

	// Allow unicode reactions
	const match = emojiRegex.exec(reaction);
	if (match) {
		const unicode = match[0];
		return unicode;
	}

	const custom = reaction.match(/^:([\w+-]+)(?:@\.)?:$/);
	if (custom) {
		const name = custom[1];
		const emoji = await Emojis.findOneBy({
			host: reacterHost || IsNull(),
			name,
		});

		if (emoji) return reacterHost ? `:${name}@${reacterHost}:` : `:${name}:`;
	}

	return await getFallbackReaction();
}

type DecodedReaction = {
	/**
	 * リアクション名 (Unicode Emoji or ':name@hostname' or ':name@.')
	 */
	reaction: string;

	/**
	 * name (カスタム絵文字の場合name, Emojiクエリに使う)
	 */
	name?: string;

	/**
	 * host (カスタム絵文字の場合host, Emojiクエリに使う)
	 */
	host?: string | null;
};

export function decodeReaction(str: string): DecodedReaction {
	const custom = str.match(/^:([\w+-]+)(?:@([\w.-]+))?:$/);

	if (custom) {
		const name = custom[1];
		const host = custom[2] || null;

		return {
			reaction: `:${name}@${host || "."}:`, // ローカル分は@以降を省略するのではなく.にする
			name,
			host,
		};
	}

	return {
		reaction: str,
		name: undefined,
		host: undefined,
	};
}

export function convertLegacyReaction(reaction: string): string {
	const decoded = decodeReaction(reaction).reaction;
	if (legacies.has(decoded)) return legacies.get(decoded)!;
	return decoded;
}
