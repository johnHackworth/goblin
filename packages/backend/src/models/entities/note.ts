import {
	Entity,
	Index,
	JoinColumn,
	Column,
	PrimaryColumn,
	ManyToOne,
} from "typeorm";
import { User } from "./user.js";
import type { DriveFile } from "./drive-file.js";
import { id } from "../id.js";
import { noteVisibilities } from "../../types.js";
import { Channel } from "./channel.js";

@Entity()
@Index("IDX_NOTE_TAGS", { synchronize: false })
@Index("IDX_NOTE_MENTIONS", { synchronize: false })
@Index("IDX_NOTE_VISIBLE_USER_IDS", { synchronize: false })
export class Note {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column("timestamp with time zone", {
		comment: "The created date of the Note.",
	})
	public createdAt: Date;

	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: "The ID of reply target.",
	})
	public replyId: Note["id"] | null;

	@ManyToOne((type) => Note, {
		onDelete: "CASCADE",
	})
	@JoinColumn()
	public reply: Note | null;

	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: "The ID of renote target.",
	})
	public renoteId: Note["id"] | null;

	@ManyToOne((type) => Note, {
		onDelete: "CASCADE",
	})
	@JoinColumn()
	public renote: Note | null;

	@Index()
	@Column("varchar", {
		length: 256,
		nullable: true,
	})
	public threadId: string | null;

	@Column("text", {
		nullable: true,
	})
	public text: string | null;

	@Column("varchar", {
		length: 256,
		nullable: true,
	})
	public name: string | null;

	@Column("varchar", {
		length: 512,
		nullable: true,
	})
	public cw: string | null;

	@Index()
	@Column({
		...id(),
		comment: "The ID of author.",
	})
	public userId: User["id"];

	@ManyToOne((type) => User, {
		onDelete: "CASCADE",
	})
	@JoinColumn()
	public user: User | null;

	@Column("boolean", {
		default: false,
	})
	public localOnly: boolean;

	@Column("smallint", {
		default: 0,
	})
	public renoteCount: number;

	@Column("smallint", {
		default: 0,
	})
	public quoteCount: number;

	@Column("smallint", {
		default: 0,
	})
	public repliesCount: number;

	@Column("jsonb", {
		default: {},
	})
	public reactions: Record<string, number>;

	@Column("json", {
		default: [],
	})
	public reblogtrail: Note[] | null;

	/**
	 * public ... 公開
	 * home ... ホームタイムライン(ユーザーページのタイムライン含む)のみに流す
	 * hidden ... only visible on profile (doesnt federate, like local only, but can be fetched via AP like home) <- for now only used for post imports
	 * followers ... フォロワーのみ
	 * specified ... visibleUserIds で指定したユーザーのみ
	 */
	@Column("enum", { enum: noteVisibilities })
	public visibility: typeof noteVisibilities[number];

	@Index({ unique: true })
	@Column("varchar", {
		length: 512,
		nullable: true,
		comment: "The URI of a note. it will be null when the note is local.",
	})
	public uri: string | null;

	@Column("varchar", {
		length: 512,
		nullable: true,
		comment:
			"The human readable url of a note. it will be null when the note is local.",
	})
	public url: string | null;

	@Column("integer", {
		default: 0,
		select: false,
	})
	public score: number;

	@Index()
	@Column({
		...id(),
		array: true,
		default: "{}",
	})
	public fileIds: DriveFile["id"][];

	@Index()
	@Column("varchar", {
		length: 256,
		array: true,
		default: "{}",
	})
	public attachedFileTypes: string[];

	@Index()
	@Column({
		...id(),
		array: true,
		default: "{}",
	})
	public visibleUserIds: User["id"][];

	@Index()
	@Column({
		...id(),
		array: true,
		default: "{}",
	})
	public mentions: User["id"][];

	@Column("text", {
		default: "[]",
	})
	public mentionedRemoteUsers: string;

	@Column("varchar", {
		length: 128,
		array: true,
		default: "{}",
	})
	public emojis: string[];

	@Index()
	@Column("varchar", {
		length: 128,
		array: true,
		default: "{}",
	})
	public tags: string[];

	@Column("boolean", {
		default: false,
	})
	public hasPoll: boolean;

	@Index()
	@Column({
		...id(),
		nullable: true,
		comment: "The ID of source channel.",
	})
	public channelId: Channel["id"] | null;

	@ManyToOne((type) => Channel, {
		onDelete: "CASCADE",
	})
	@JoinColumn()
	public channel: Channel | null;

	//#region Denormalized fields
	@Index()
	@Column("varchar", {
		length: 128,
		nullable: true,
		comment: "[Denormalized]",
	})
	public userHost: string | null;

	@Column({
		...id(),
		nullable: true,
		comment: "[Denormalized]",
	})
	public replyUserId: User["id"] | null;

	@Column("varchar", {
		length: 128,
		nullable: true,
		comment: "[Denormalized]",
	})
	public replyUserHost: string | null;

	@Column({
		...id(),
		nullable: true,
		comment: "[Denormalized]",
	})
	public renoteUserId: User["id"] | null;

	@Column("varchar", {
		length: 128,
		nullable: true,
		comment: "[Denormalized]",
	})
	public renoteUserHost: string | null;

	@Column("timestamp with time zone", {
		nullable: true,
		comment: "The updated date of the Note.",
	})
	public updatedAt: Date;
	//#endregion

	constructor(data: Partial<Note>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}

export type IMentionedRemoteUsers = {
	uri: string;
	url?: string;
	username: string;
	host: string;
}[];
