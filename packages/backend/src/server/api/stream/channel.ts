import type Connection from ".";
import type { Note } from "@/models/entities/note.js";
import { Notes } from "@/models/index.js";
import type { Packed } from "@/misc/schema.js";
import { IdentifiableError } from "@/misc/identifiable-error.js";

/**
 * Stream channel
 */
export default abstract class Channel {
	protected connection: Connection;
	public id: string;
	public abstract readonly chName: string;
	public static readonly shouldShare: boolean;
	public static readonly requireCredential: boolean;

	protected get user() {
		return this.connection.user;
	}

	protected get userProfile() {
		return this.connection.userProfile;
	}

	protected get following() {
		return this.connection.following;
	}

	protected get muting() {
		return this.connection.muting;
	}

	protected get renoteMuting() {
		return this.connection.renoteMuting;
	}

	protected get blocking() {
		return this.connection.blocking;
	}

	protected get followingChannels() {
		return this.connection.followingChannels;
	}

	protected get subscriber() {
		return this.connection.subscriber;
	}

	constructor(id: string, connection: Connection) {
		this.id = id;
		this.connection = connection;
	}

	public send(typeOrPayload: any, payload?: any) {
		const type = payload === undefined ? typeOrPayload.type : typeOrPayload;
		const body = payload === undefined ? typeOrPayload.body : payload;

		this.connection.sendMessageToWs("channel", {
			id: this.id,
			type: type,
			body: body,
		});
	}

	protected withPackedNote(
		callback: (note: Packed<"Note">) => void,
	): (Note) => void {
		return async (note: Note) => {
			try {
				// because `note` was previously JSON.stringify'ed, the fields that
				// were objects before are now strings and have to be restored or
				// removed from the object
				note.createdAt = new Date(note.createdAt);
				note.reply = undefined;
				note.renote = undefined;
				note.user = undefined;
				note.channel = undefined;

				const packed = await Notes.pack(note, this.user, { detail: true });

				callback(packed);
			} catch (err) {
				if (
					err instanceof IdentifiableError &&
					err.id === "9725d0ce-ba28-4dde-95a7-2cbb2c15de24"
				) {
					// skip: note not visible to user
					return;
				} else {
					throw err;
				}
			}
		};
	}

	public abstract init(params: any): void;
	public dispose?(): void;
	public onMessage?(type: string, body: any): void;
}
