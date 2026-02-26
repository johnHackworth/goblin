import {
	PrimaryColumn,
	Entity,
	Index,
	Column,
	ManyToOne,
	JoinColumn,
} from "typeorm";
import { RssFeed } from "./rss-feed.js";
import { Note } from "./note.js";
import { id } from "../id.js";

@Entity()
@Index(["rssFeedId", "url"], { unique: true })
export class RssFeedItem {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column(id())
	public rssFeedId: string;

	@ManyToOne((type) => RssFeed, {
		onDelete: "CASCADE",
	})
	@JoinColumn()
	public rssFeed: RssFeed | null;

	@Column("varchar", {
		length: 2048,
	})
	public url: string;

	@Column(id())
	public noteId: string;

	@ManyToOne((type) => Note, {
		onDelete: "CASCADE",
	})
	@JoinColumn()
	public note: Note | null;

	@Column("timestamp with time zone")
	public publishedAt: Date;

	@Column("timestamp with time zone")
	public createdAt: Date;
}
