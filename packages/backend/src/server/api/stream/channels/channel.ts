import Channel from "../channel.js";
import { Users } from "@/models/index.js";
import { isUserRelated } from "@/misc/is-user-related.js";
import type { User } from "@/models/entities/user.js";
import type { StreamMessages } from "../types.js";
import type { Packed } from "@/misc/schema.js";

export default class extends Channel {
	public readonly chName = "channel";
	public static shouldShare = false;
	public static requireCredential = false;
	private channelId: string;
	private typers: Map<User["id"], Date> = new Map();
	private emitTypersIntervalId: ReturnType<typeof setInterval>;

	constructor(id: string, connection: Channel["connection"]) {
		super(id, connection);
		this.onNote = this.withPackedNote(this.onNote.bind(this));
		this.emitTypers = this.emitTypers.bind(this);
	}

	public async init(params: any) {
		this.channelId = params.channelId as string;

		// Subscribe stream
		this.subscriber.on("notesStream", this.onNote);
		this.subscriber.on(`channelStream:${this.channelId}`, this.onEvent);
		this.emitTypersIntervalId = setInterval(this.emitTypers, 5000);
	}

	private async onNote(note: Packed<"Note">) {
		if (note.visibility === "hidden") return;
		if (note.channelId !== this.channelId) return;

		// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
		if (isUserRelated(note, this.muting)) return;
		// 流れてきたNoteがブロックされているユーザーが関わるものだったら無視する
		if (isUserRelated(note, this.blocking)) return;

		if (note.renote && !note.text && this.renoteMuting.has(note.userId)) return;

		this.connection.cacheNote(note);

		this.send("note", note);
	}

	private onEvent(data: StreamMessages["channel"]["payload"]) {
		if (data.type === "typing") {
			const id = data.body;
			const begin = !this.typers.has(id);
			this.typers.set(id, new Date());
			if (begin) {
				this.emitTypers();
			}
		}
	}

	private async emitTypers() {
		const now = new Date();

		// Remove not typing users
		for (const [userId, date] of Object.entries(this.typers)) {
			if (now.getTime() - date.getTime() > 5000) this.typers.delete(userId);
		}

		const userIds = Array.from(this.typers.keys());
		const users = await Users.packMany(userIds, null, {
			detail: false,
		});

		this.send({
			type: "typers",
			body: users,
		});
	}

	public dispose() {
		// Unsubscribe events
		this.subscriber.off("notesStream", this.onNote);
		this.subscriber.off(`channelStream:${this.channelId}`, this.onEvent);

		clearInterval(this.emitTypersIntervalId);
	}
}
