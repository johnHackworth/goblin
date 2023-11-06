import RE2 from "re2";
import type { Note } from "@/models/entities/note.js";
import type { User } from "@/models/entities/user.js";

type NoteLike = {
	userId: Note["userId"];
	text: Note["text"];
	files?: Note["files"];
	cw?: Note["cw"];
};

type UserLike = {
	id: User["id"];
};

function checkWordMute(
	note: NoteLike,
	mutedWords: Array<string | string[]>,
): boolean {
	if (note == null) return false;

	let text = `${note.cw ?? ""} ${note.text ?? ""}`;
	if (note.files != null)
		text += ` ${note.files.map((f) => f.comment ?? "").join(" ")}`;
	text = text.trim();

	if (text === "") return false;

	for (const mutePattern of mutedWords) {
		if (Array.isArray(mutePattern)) {
			// Clean up
			const keywords = mutePattern.filter((keyword) => keyword !== "");

			if (
				keywords.length > 0 &&
				keywords.every((keyword) => text.includes(keyword))
			)
				return true;
		} else {
			// represents RegExp
			const regexp = mutePattern.match(/^\/(.+)\/(.*)$/);

			// This should never happen due to input sanitisation.
			if (!regexp) {
				console.warn(`Found invalid regex in word mutes: ${mutePattern}`);
				continue;
			}

			try {
				if (new RE2(regexp[1], regexp[2]).test(text)) return true;
			} catch (err) {
				// This should never happen due to input sanitisation.
			}
		}
	}

	return false;
}

export async function getWordHardMute(
	note: NoteLike,
	me: UserLike | null | undefined,
	mutedWords: Array<string | string[]>,
): Promise<boolean> {
	// 自分自身
	if (me && note.userId === me.id) {
		return false;
	}

	if (mutedWords.length > 0) {
		return (
			checkWordMute(note, mutedWords) ||
			checkWordMute(note.reply, mutedWords) ||
			checkWordMute(note.renote, mutedWords)
		);
	}

	return false;
}
