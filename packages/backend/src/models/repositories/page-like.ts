import { db } from "@/db/postgre.js";
import { PageLike } from "@/models/entities/page-like.js";
import type { User } from "@/models/entities/user.js";
import { Pages } from "../index.js";

export const PageLikeRepository = db.getRepository(PageLike).extend({
	async pack(
		src: PageLike["id"] | PageLike,
		me?: { id: User["id"] } | null | undefined,
	) {
		const like =
			typeof src === "object" ? src : await this.findOneByOrFail({ id: src });

		return {
			id: like.id,
			page: await Pages.pack(like.page || like.pageId, me),
		};
	},

	packMany(likes: PageLike[], me: { id: User["id"] }) {
		return Promise.all(likes.map((x) => this.pack(x, me)));
	},
});
