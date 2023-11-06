import {
	Entity,
	JoinColumn,
	Column,
	ManyToOne,
	PrimaryColumn,
	Index,
} from "typeorm";
import { Note } from "./note.js";
import { id } from "../id.js";
import { DriveFile } from "./drive-file.js";

@Entity()
export class NoteEdit {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		comment: "The ID of note.",
	})
	public noteId: Note["id"];

	@ManyToOne((type) => Note, {
		onDelete: "CASCADE",
	})
	@JoinColumn()
	public note: Note | null;

	@Column("text", {
		nullable: true,
	})
	public text: string | null;

	@Column("varchar", {
		length: 512,
		nullable: true,
	})
	public cw: string | null;

	@Column({
		...id(),
		array: true,
		default: "{}",
	})
	public fileIds: DriveFile["id"][];

	@Column("timestamp with time zone", {
		comment: "The updated date of the Note.",
	})
	public updatedAt: Date;
}
