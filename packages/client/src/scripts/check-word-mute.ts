export type Muted = {
	muted: boolean;
	matched: string[];
	what?: string; // "note" || "reply" || "renote" || "quote"
};

const NotMuted = { muted: false, matched: [] };

function checkWordMute(
	note: NoteLike,
	mutedWords: Array<string | string[]>,
): Muted {
	let text = `${note.cw ?? ""} ${note.text ?? ""}`;
	if (note.files != null)
		text += ` ${note.files.map((f) => f.comment ?? "").join(" ")}`;
	text = text.trim();

	if (text === "") return NotMuted;

	let result = { muted: false, matched: [] };

	for (const mutePattern of mutedWords) {
		if (Array.isArray(mutePattern)) {
			// Clean up
			const keywords = mutePattern.filter((keyword) => keyword !== "");

			if (
				keywords.length > 0 &&
				keywords.every((keyword) => text.includes(keyword))
			) {
				result.muted = true;
				result.matched.push(...keywords);
			}
		} else {
			// represents RegExp
			const regexp = mutePattern.match(/^\/(.+)\/(.*)$/);

			// This should never happen due to input sanitisation.
			if (!regexp) {
				console.warn(`Found invalid regex in word mutes: ${mutePattern}`);
				continue;
			}

			try {
				if (new RegExp(regexp[1], regexp[2]).test(text)) {
					result.muted = true;
					result.matched.push(mutePattern);
				}
			} catch (err) {
				// This should never happen due to input sanitisation.
			}
		}
	}

	result.matched = [...new Set(result.matched)];
	return result;
}

export function getWordSoftMute(
	note: Record<string, any>,
	me: Record<string, any> | null | undefined,
	mutedWords: Array<string | string[]>,
): Muted {
	// 自分自身
	if (me && note.userId === me.id) {
		return NotMuted;
	}

	if (mutedWords.length > 0) {
		let noteMuted = checkWordMute(note, mutedWords);
		if (noteMuted.muted) {
			noteMuted.what = "note";
			return noteMuted;
		}

		if (note.renote) {
			let renoteMuted = checkWordMute(note.renote, mutedWords);
			if (renoteMuted.muted) {
				renoteMuted.what = note.text == null ? "renote" : "quote";
				return renoteMuted;
			}
		}

		if (note.reply) {
			let replyMuted = checkWordMute(note.reply, mutedWords);
			if (replyMuted.muted) {
				replyMuted.what = "reply";
				return replyMuted;
			}
		}
	}

	return NotMuted;
}
