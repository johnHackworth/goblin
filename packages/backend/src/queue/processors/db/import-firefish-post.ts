import * as Post from "@/misc/post.js";
import create from "@/services/note/create.js";
import { Users } from "@/models/index.js";
import type { DbUserImportMastoPostJobData } from "@/queue/types.js";
import { queueLogger } from "../../logger.js";
import type Bull from "bull";

const logger = queueLogger.createSubLogger("import-firefish-post");

export async function importCkPost(
	job: Bull.Job<DbUserImportMastoPostJobData>,
	done: any,
): Promise<void> {
	const user = await Users.findOneBy({ id: job.data.user.id });
	if (user == null) {
		done();
		return;
	}
	const post = job.data.post;
	if (post.replyId != null) {
		done();
		return;
	}
	if (post.renoteId != null) {
		done();
		return;
	}
	if (post.visibility !== "public") {
		done();
		return;
	}
	const { text, cw, localOnly, createdAt } = Post.parse(post);
	const note = await create(user, {
		createdAt: createdAt,
		files: undefined,
		poll: undefined,
		text: text || undefined,
		reply: null,
		renote: null,
		cw: cw,
		localOnly,
		visibility: "hidden",
		visibleUsers: [],
		channel: null,
		apMentions: new Array(0),
		apHashtags: undefined,
		apEmojis: undefined,
	});
	logger.succ("Imported");
	done();
}
