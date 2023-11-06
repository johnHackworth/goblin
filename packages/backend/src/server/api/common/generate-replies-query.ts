import type { User } from "@/models/entities/user.js";
import type { SelectQueryBuilder } from "typeorm";
import { Brackets } from "typeorm";

export function generateRepliesQuery(
	q: SelectQueryBuilder<any>,
	withReplies: boolean,
	me?: Pick<User, "id"> | null,
) {
	if (me == null) {
		q.andWhere(
			new Brackets((qb) => {
				qb.where("note.replyId IS NULL") // 返信ではない
					.orWhere(
						new Brackets((qb) => {
							qb.where(
								// 返信だけど投稿者自身への返信
								"note.replyId IS NOT NULL",
							).andWhere("note.replyUserId = note.userId");
						}),
					);
			}),
		);
	} else if (!withReplies) {
		q.andWhere(
			new Brackets((qb) => {
				qb.where("note.replyId IS NULL") // 返信ではない
					.orWhere("note.replyUserId = :meId", { meId: me.id }) // 返信だけど自分のノートへの返信
					.orWhere(
						new Brackets((qb) => {
							qb.where("note.replyId IS NOT NULL") // 返信だけど自分の行った返信
								.andWhere("note.userId = :meId", { meId: me.id });
						}),
					)
					.orWhere(
						new Brackets((qb) => {
							qb.where("note.replyId IS NOT NULL") // 返信だけど投稿者自身への返信
								.andWhere("note.replyUserId = note.userId");
						}),
					);
			}),
		);
	}
}
