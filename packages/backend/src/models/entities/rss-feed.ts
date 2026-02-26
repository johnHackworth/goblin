import {
	PrimaryColumn,
	Entity,
	Index,
	JoinColumn,
	Column,
	ManyToOne,
} from "typeorm";
import { User } from "./user.js";
import { id } from "../id.js";

@Entity()
export class RssFeed {
	@PrimaryColumn(id())
	public id: string;

	@Index({ unique: true })
	@Column("varchar", {
		length: 2048,
	})
	public url: string;

	@Column("varchar", {
		length: 512,
	})
	public title: string;

	@Column("varchar", {
		length: 2048,
		nullable: true,
	})
	public description: string | null;

	@Column("varchar", {
		length: 512,
		nullable: true,
	})
	public siteUrl: string | null;

	@Index()
	@Column(id())
	public botUserId: string;

	@ManyToOne((type) => User, {
		onDelete: "CASCADE",
	})
	@JoinColumn()
	public botUser: User | null;

	@Column("timestamp with time zone", {
		nullable: true,
	})
	public lastFetchedAt: Date | null;

	@Column("timestamp with time zone", {
		nullable: true,
	})
	public lastItemPublishedAt: Date | null;

	@Column("integer", {
		default: 15,
	})
	public fetchInterval: number;

	@Column("boolean", {
		default: true,
	})
	public isActive: boolean;

	@Column("boolean", {
		default: false,
	})
	public isPermanentlyDisabled: boolean;

	@Column("timestamp with time zone", {
		nullable: true,
	})
	public disabledUntil: Date | null;

	@Column("integer", {
		default: 0,
	})
	public consecutiveErrorCount: number;

	@Column("varchar", {
		length: 1024,
		nullable: true,
	})
	public lastError: string | null;

	@Column("timestamp with time zone")
	public createdAt: Date;

	@Column("timestamp with time zone")
	public updatedAt: Date;
}
