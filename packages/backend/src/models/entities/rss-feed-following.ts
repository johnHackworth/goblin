import {
	PrimaryColumn,
	Entity,
	Index,
	JoinColumn,
	Column,
	ManyToOne,
} from "typeorm";
import { User } from "./user.js";
import { RssFeed } from "./rss-feed.js";
import { id } from "../id.js";

@Entity()
@Index(["userId", "rssFeedId"], { unique: true })
export class RssFeedFollowing {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column(id())
	public userId: string;

	@ManyToOne((type) => User, {
		onDelete: "CASCADE",
	})
	@JoinColumn()
	public user: User | null;

	@Index()
	@Column(id())
	public rssFeedId: string;

	@ManyToOne((type) => RssFeed, {
		onDelete: "CASCADE",
	})
	@JoinColumn()
	public rssFeed: RssFeed | null;

	@Column("timestamp with time zone")
	public createdAt: Date;
}
