import { onUnmounted, Ref } from "vue";
import * as misskey from "firefish-js";
import { stream } from "@/stream";
import { $i } from "@/account";
import * as os from "@/os";

export function useNoteCapture(props: {
	rootEl: Ref<HTMLElement>;
	note: Ref<misskey.entities.Note>;
	isDeletedRef: Ref<boolean>;
}) {
	const note = props.note;
	const connection = $i ? stream : null;

	async function onStreamNoteUpdated(noteData): Promise<void> {
		const { type, id, body } = noteData;

		if (id !== note.value.id) return;

		switch (type) {
			case "reacted": {
				const reaction = body.reaction;

				if (body.emoji) {
					const emojis = note.value.emojis || [];
					if (!emojis.includes(body.emoji)) {
						note.value.emojis = [...emojis, body.emoji];
					}
				}

				// TODO: reactionsプロパティがない場合ってあったっけ？ なければ || {} は消せる
				const currentCount = note.value.reactions?.[reaction] || 0;

				note.value.reactions[reaction] = currentCount + 1;

				if ($i && body.userId === $i.id) {
					note.value.myReaction = reaction;
				}
				break;
			}

			case "unreacted": {
				const reaction = body.reaction;

				// TODO: reactionsプロパティがない場合ってあったっけ？ なければ || {} は消せる
				const currentCount = note.value.reactions?.[reaction] || 0;

				note.value.reactions[reaction] = Math.max(0, currentCount - 1);

				if ($i && body.userId === $i.id) {
					note.value.myReaction = undefined;
				}
				break;
			}

			case "pollVoted": {
				const choice = body.choice;

				if (note.value.poll) {
					const choices = [...note.value.poll.choices];
					choices[choice] = {
						...choices[choice],
						votes: choices[choice].votes + 1,
						...($i && body.userId === $i.id
							? {
									isVoted: true,
							  }
							: {}),
					};
					note.value.poll.choices = choices;
				}

				break;
			}

			case "deleted": {
				props.isDeletedRef.value = true;
				break;
			}

			case "updated": {
				const editedNote = await os.api("notes/show", {
					noteId: id,
				});

				const keys = new Set<string>();
				Object.keys(editedNote)
					.concat(Object.keys(note.value))
					.forEach((key) => keys.add(key));
				keys.forEach((key) => {
					note.value[key] = editedNote[key];
				});
				break;
			}
		}
	}

	function capture(withHandler = false): void {
		if (connection) {
			// TODO: このノートがストリーミング経由で流れてきた場合のみ sr する
			connection.send(document.body.contains(props.rootEl.value) ? "sr" : "s", {
				id: note.value.id,
			});
			if (withHandler) connection.on("noteUpdated", onStreamNoteUpdated);
		}
	}

	function decapture(withHandler = false): void {
		if (connection) {
			connection.send("un", {
				id: note.value.id,
			});
			if (withHandler) connection.off("noteUpdated", onStreamNoteUpdated);
		}
	}

	function onStreamConnected() {
		capture(false);
	}

	capture(true);
	if (connection) {
		connection.on("_connected_", onStreamConnected);
	}

	onUnmounted(() => {
		decapture(true);
		if (connection) {
			connection.off("_connected_", onStreamConnected);
		}
	});
}
