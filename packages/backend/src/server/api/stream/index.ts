import type { EventEmitter } from "events";
import type * as websocket from "websocket";
import readNote from "@/services/note/read.js";
import type { User } from "@/models/entities/user.js";
import type { Channel as ChannelModel } from "@/models/entities/channel.js";
import {
	Users,
	Followings,
	Mutings,
	RenoteMutings,
	UserProfiles,
	ChannelFollowings,
	Blockings,
} from "@/models/index.js";
import type { AccessToken } from "@/models/entities/access-token.js";
import type { UserProfile } from "@/models/entities/user-profile.js";
import {
	publishChannelStream,
	publishGroupMessagingStream,
	publishMessagingStream,
} from "@/services/stream.js";
import type { UserGroup } from "@/models/entities/user-group.js";
import type { Packed } from "@/misc/schema.js";
import { readNotification } from "../common/read-notification.js";
import channels from "./channels/index.js";
import type Channel from "./channel.js";
import type { StreamEventEmitter, StreamMessages } from "./types.js";
import { Converter } from "megalodon";
import { getClient } from "../mastodon/ApiMastodonCompatibleService.js";

/**
 * Main stream connection
 */
export default class Connection {
	public user?: User;
	public userProfile?: UserProfile | null;
	public following: Set<User["id"]> = new Set();
	public muting: Set<User["id"]> = new Set();
	public renoteMuting: Set<User["id"]> = new Set();
	public blocking: Set<User["id"]> = new Set(); // "被"blocking
	public followingChannels: Set<ChannelModel["id"]> = new Set();
	public token?: AccessToken;
	private wsConnection: websocket.connection;
	public subscriber: StreamEventEmitter;
	private channels: Channel[] = [];
	private subscribingNotes: Map<string, number> = new Map();
	private cachedNotes: Packed<"Note">[] = [];
	private isMastodonCompatible = false;
	private host: string;
	private accessToken: string;
	private currentSubscribe: string[][] = [];

	constructor(
		wsConnection: websocket.connection,
		subscriber: EventEmitter,
		user: User | null | undefined,
		token: AccessToken | null | undefined,
		host: string,
		accessToken: string,
		prepareStream: string | undefined,
	) {
		console.log("constructor", prepareStream);
		this.wsConnection = wsConnection;
		this.subscriber = subscriber;
		if (user) this.user = user;
		if (token) this.token = token;
		if (host) this.host = host;
		if (accessToken) this.accessToken = accessToken;

		this.onWsConnectionMessage = this.onWsConnectionMessage.bind(this);
		this.onUserEvent = this.onUserEvent.bind(this);
		this.onNoteStreamMessage = this.onNoteStreamMessage.bind(this);
		this.onBroadcastMessage = this.onBroadcastMessage.bind(this);

		this.wsConnection.on("message", this.onWsConnectionMessage);

		this.subscriber.on("broadcast", (data) => {
			this.onBroadcastMessage(data);
		});

		if (this.user) {
			this.updateFollowing();
			this.updateMuting();
			this.updateRenoteMuting();
			this.updateBlocking();
			this.updateFollowingChannels();
			this.updateUserProfile();

			this.subscriber.on(`user:${this.user.id}`, this.onUserEvent);
		}
		console.log("prepare", prepareStream);
		if (prepareStream) {
			this.onWsConnectionMessage({
				type: "utf8",
				utf8Data: JSON.stringify({ stream: prepareStream, type: "subscribe" }),
			});
		}
	}

	private onUserEvent(data: StreamMessages["user"]["payload"]) {
		// { type, body }と展開するとそれぞれ型が分離してしまう
		switch (data.type) {
			case "follow":
				this.following.add(data.body.id);
				break;

			case "unfollow":
				this.following.delete(data.body.id);
				break;

			case "mute":
				this.muting.add(data.body.id);
				break;

			case "unmute":
				this.muting.delete(data.body.id);
				break;

			// TODO: renote mute events
			// TODO: block events

			case "followChannel":
				this.followingChannels.add(data.body.id);
				break;

			case "unfollowChannel":
				this.followingChannels.delete(data.body.id);
				break;

			case "updateUserProfile":
				this.userProfile = data.body;
				break;

			case "terminate":
				this.wsConnection.close();
				this.dispose();
				break;

			default:
				break;
		}
	}

	/**
	 * クライアントからメッセージ受信時
	 */
	private async onWsConnectionMessage(data: websocket.Message) {
		if (data.type !== "utf8") return;
		if (data.utf8Data == null) return;

		let objs: Record<string, any>[];

		try {
			objs = [JSON.parse(data.utf8Data)];
		} catch (e) {
			return;
		}

		const simpleObj = objs[0];
		if (simpleObj.stream) {
			// is Mastodon Compatible
			this.isMastodonCompatible = true;
			if (simpleObj.type === "subscribe") {
				let forSubscribe = [];
				if (simpleObj.stream === "user") {
					this.currentSubscribe.push(["user"]);
					objs = [
						{
							type: "connect",
							body: {
								channel: "main",
								id: simpleObj.stream,
							},
						},
						{
							type: "connect",
							body: {
								channel: "homeTimeline",
								id: simpleObj.stream,
							},
						},
					];
					const client = getClient(this.host, this.accessToken);
					try {
						const tl = await client.getHomeTimeline();
						for (const t of tl.data) forSubscribe.push(t.id);
					} catch (e: any) {
						console.log(e);
						console.error(e.response.data);
					}
				} else if (simpleObj.stream === "public:local") {
					this.currentSubscribe.push(["public:local"]);
					objs = [
						{
							type: "connect",
							body: {
								channel: "localTimeline",
								id: simpleObj.stream,
							},
						},
					];
					const client = getClient(this.host, this.accessToken);
					const tl = await client.getLocalTimeline();
					for (const t of tl.data) forSubscribe.push(t.id);
				} else if (simpleObj.stream === "public") {
					this.currentSubscribe.push(["public"]);
					objs = [
						{
							type: "connect",
							body: {
								channel: "globalTimeline",
								id: simpleObj.stream,
							},
						},
					];
					const client = getClient(this.host, this.accessToken);
					const tl = await client.getPublicTimeline();
					for (const t of tl.data) forSubscribe.push(t.id);
				} else if (simpleObj.stream === "list") {
					this.currentSubscribe.push(["list", simpleObj.list]);
					objs = [
						{
							type: "connect",
							body: {
								channel: "list",
								id: simpleObj.stream,
								params: {
									listId: simpleObj.list,
								},
							},
						},
					];
					const client = getClient(this.host, this.accessToken);
					const tl = await client.getListTimeline(simpleObj.list);
					for (const t of tl.data) forSubscribe.push(t.id);
				}
				for (const s of forSubscribe) {
					objs.push({
						type: "s",
						body: {
							id: s,
						},
					});
				}
			}
		}

		for (const obj of objs) {
			const { type, body } = obj;
			// console.log(type, body);
			switch (type) {
				case "readNotification":
					this.onReadNotification(body);
					break;
				case "subNote":
					this.onSubscribeNote(body);
					break;
				case "s":
					this.onSubscribeNote(body);
					break; // alias
				case "sr":
					this.onSubscribeNote(body);
					this.readNote(body);
					break;
				case "unsubNote":
					this.onUnsubscribeNote(body);
					break;
				case "un":
					this.onUnsubscribeNote(body);
					break; // alias
				case "connect":
					this.onChannelConnectRequested(body);
					break;
				case "disconnect":
					this.onChannelDisconnectRequested(body);
					break;
				case "channel":
					this.onChannelMessageRequested(body);
					break;
				case "ch":
					this.onChannelMessageRequested(body);
					break; // alias

				// 個々のチャンネルではなくルートレベルでこれらのメッセージを受け取る理由は、
				// クライアントの事情を考慮したとき、入力フォームはノートチャンネルやメッセージのメインコンポーネントとは別
				// なこともあるため、それらのコンポーネントがそれぞれ各チャンネルに接続するようにするのは面倒なため。
				case "typingOnChannel":
					this.typingOnChannel(body.channel);
					break;
				case "typingOnMessaging":
					this.typingOnMessaging(body);
					break;
			}
		}
	}

	private onBroadcastMessage(data: StreamMessages["broadcast"]["payload"]) {
		this.sendMessageToWs(data.type, data.body);
	}

	public cacheNote(note: Packed<"Note">) {
		const add = (note: Packed<"Note">) => {
			const existIndex = this.cachedNotes.findIndex((n) => n.id === note.id);
			if (existIndex > -1) {
				this.cachedNotes[existIndex] = note;
				return;
			}

			this.cachedNotes.unshift(note);
			if (this.cachedNotes.length > 32) {
				this.cachedNotes.splice(32);
			}
		};

		add(note);
		if (note.reply) add(note.reply);
		if (note.renote) add(note.renote);
	}

	private readNote(body: any) {
		const id = body.id;

		const note = this.cachedNotes.find((n) => n.id === id);
		if (note == null) return;

		if (this.user && note.userId !== this.user.id) {
			readNote(this.user.id, [note], {
				following: this.following,
				followingChannels: this.followingChannels,
			});
		}
	}

	private onReadNotification(payload: any) {
		if (!payload.id) return;
		readNotification(this.user!.id, [payload.id]);
	}

	/**
	 * 投稿購読要求時
	 */
	private onSubscribeNote(payload: any) {
		if (!payload.id) return;

		const current = this.subscribingNotes.get(payload.id) || 0;
		this.subscribingNotes.set(payload.id, current + 1);

		if (!current) {
			this.subscriber.on(`noteStream:${payload.id}`, this.onNoteStreamMessage);
		}
	}

	/**
	 * 投稿購読解除要求時
	 */
	private onUnsubscribeNote(payload: any) {
		if (!payload.id) return;

		const current = this.subscribingNotes.get(payload.id) || 0;
		if (current <= 1) {
			this.subscribingNotes.delete(payload.id);
			this.subscriber.off(`noteStream:${payload.id}`, this.onNoteStreamMessage);
			return;
		}
		this.subscribingNotes.set(payload.id, current - 1);
	}

	private async onNoteStreamMessage(data: StreamMessages["note"]["payload"]) {
		this.sendMessageToWs("noteUpdated", {
			id: data.body.id,
			type: data.type,
			body: data.body.body,
		});
	}

	/**
	 * チャンネル接続要求時
	 */
	private onChannelConnectRequested(payload: any) {
		const { channel, id, params, pong } = payload;
		this.connectChannel(id, params, channel, pong);
	}

	/**
	 * チャンネル切断要求時
	 */
	private onChannelDisconnectRequested(payload: any) {
		const { id } = payload;
		this.disconnectChannel(id);
	}

	/**
	 * クライアントにメッセージ送信
	 */
	public sendMessageToWs(type: string, payload: any) {
		if (this.isMastodonCompatible) {
			if (payload.type === "note") {
				this.wsConnection.send(
					JSON.stringify({
						stream: [payload.id],
						event: "update",
						payload: JSON.stringify(Converter.note(payload.body, this.host)),
					}),
				);
				this.onSubscribeNote({
					id: payload.body.id,
				});
			} else if (payload.type === "reacted" || payload.type === "unreacted") {
				// reaction
				const client = getClient(this.host, this.accessToken);
				client.getStatus(payload.id).then((data) => {
					const newPost = [data.data];
					const targetPost = newPost[0];
					for (const stream of this.currentSubscribe) {
						this.wsConnection.send(
							JSON.stringify({
								stream,
								event: "status.update",
								payload: JSON.stringify(targetPost),
							}),
						);
					}
				});
			} else if (payload.type === "deleted") {
				// delete
				for (const stream of this.currentSubscribe) {
					this.wsConnection.send(
						JSON.stringify({
							stream,
							event: "delete",
							payload: payload.id,
						}),
					);
				}
			} else if (payload.type === "unreadNotification") {
				if (payload.id === "user") {
					const body = Converter.notification(payload.body, this.host);
					if (body.type === "reaction") body.type = "favourite";
					this.wsConnection.send(
						JSON.stringify({
							stream: ["user"],
							event: "notification",
							payload: JSON.stringify(body),
						}),
					);
				}
			}
		} else {
			this.wsConnection.send(
				JSON.stringify({
					type: type,
					body: payload,
				}),
			);
		}
	}

	/**
	 * チャンネルに接続
	 */
	public connectChannel(
		id: string,
		params: any,
		channel: string,
		pong = false,
	) {
		if ((channels as any)[channel].requireCredential && this.user == null) {
			return;
		}

		// 共有可能チャンネルに接続しようとしていて、かつそのチャンネルに既に接続していたら無意味なので無視
		if (
			(channels as any)[channel].shouldShare &&
			this.channels.some((c) => c.chName === channel)
		) {
			return;
		}

		const ch: Channel = new (channels as any)[channel](id, this);
		this.channels.push(ch);
		ch.init(params);

		if (pong) {
			this.sendMessageToWs("connected", {
				id: id,
			});
		}
	}

	/**
	 * チャンネルから切断
	 * @param id チャンネルコネクションID
	 */
	public disconnectChannel(id: string) {
		const channel = this.channels.find((c) => c.id === id);

		if (channel) {
			if (channel.dispose) channel.dispose();
			this.channels = this.channels.filter((c) => c.id !== id);
		}
	}

	/**
	 * チャンネルへメッセージ送信要求時
	 * @param data メッセージ
	 */
	private onChannelMessageRequested(data: any) {
		const channel = this.channels.find((c) => c.id === data.id);
		if (channel?.onMessage != null) {
			channel.onMessage(data.type, data.body);
		}
	}

	private typingOnChannel(channel: ChannelModel["id"]) {
		if (this.user) {
			publishChannelStream(channel, "typing", this.user.id);
		}
	}

	private typingOnMessaging(param: {
		partner?: User["id"];
		group?: UserGroup["id"];
	}) {
		if (this.user) {
			if (param.partner) {
				publishMessagingStream(
					param.partner,
					this.user.id,
					"typing",
					this.user.id,
				);
			} else if (param.group) {
				publishGroupMessagingStream(param.group, "typing", this.user.id);
			}
		}
	}

	private async updateFollowing() {
		const followings = await Followings.find({
			where: {
				followerId: this.user!.id,
			},
			select: ["followeeId"],
		});

		this.following = new Set<string>(followings.map((x) => x.followeeId));
	}

	private async updateMuting() {
		const mutings = await Mutings.find({
			where: {
				muterId: this.user!.id,
			},
			select: ["muteeId"],
		});

		this.muting = new Set<string>(mutings.map((x) => x.muteeId));
	}

	private async updateRenoteMuting() {
		const renoteMutings = await RenoteMutings.find({
			where: {
				muterId: this.user!.id,
			},
			select: ["muteeId"],
		});

		this.renoteMuting = new Set<string>(renoteMutings.map((x) => x.muteeId));
	}

	private async updateBlocking() {
		// ここでいうBlockingは被Blockingの意
		const blockings = await Blockings.find({
			where: {
				blockeeId: this.user!.id,
			},
			select: ["blockerId"],
		});

		this.blocking = new Set<string>(blockings.map((x) => x.blockerId));
	}

	private async updateFollowingChannels() {
		const followings = await ChannelFollowings.find({
			where: {
				followerId: this.user!.id,
			},
			select: ["followeeId"],
		});

		this.followingChannels = new Set<string>(
			followings.map((x) => x.followeeId),
		);
	}

	private async updateUserProfile() {
		this.userProfile = await UserProfiles.findOneBy({
			userId: this.user!.id,
		});
	}

	/**
	 * ストリームが切れたとき
	 */
	public dispose() {
		for (const c of this.channels.filter((c) => c.dispose)) {
			if (c.dispose) c.dispose();
		}
	}
}
