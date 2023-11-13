import create from "@/services/note/create.js";
import { Users } from "@/models/index.js";
import type { DbUserImportMastoPostJobData } from "@/queue/types.js";
import { queueLogger } from "../../logger.js";
import type Bull from "bull";
import { htmlToMfm } from "@/remote/activitypub/misc/html-to-mfm.js";
import { resolveNote } from "@/remote/activitypub/models/note.js";
import { Note } from "@/models/entities/note.js";
import { uploadFromUrl } from "@/services/drive/upload-from-url.js";
import type { DriveFile } from "@/models/entities/drive-file.js";

const logger = queueLogger.createSubLogger("import-masto-post");

export async function importMastoPost(
	job: Bull.Job<DbUserImportMastoPostJobData>,
	done: any,
): Promise<void> {
	const user = await Users.findOneBy({ id: job.data.user.id });
	if (user == null) {
		done();
		return;
	}
	const post = job.data.post;
	let reply: Note | null = null;
	job.progress(20);
	if (post.object.inReplyTo != null) {
		reply = await resolveNote(post.object.inReplyTo);
	}
	job.progress(40);
	if (post.directMessage) {
		done();
		return;
	}
	if (job.data.signatureCheck) {
		if (!post.signature) {
			done();
			return;
		}
	}
	job.progress(60);
	let text;
	try {
		text = htmlToMfm(post.object.content, post.object.tag);
	} catch (e) {
		throw e;
	}
	job.progress(80);

	let files: DriveFile[] = (post.object.attachment || [])
		.map((x: any) => x?.driveFile)
		.filter((x: any) => x);

	if (files.length == 0) {
		const urls = post.object.attachment
			.map((x: any) => x.url)
			.filter((x: String) => x.startsWith("http"));
		files = [];
		for (const url of urls) {
			try {
				const file = await uploadFromUrl({
					url: url,
					user: user,
				});
				files.push(file);
			} catch (e) {
				logger.error(`Skipped adding file to drive: ${url}`);
			}
		}
	}

	const note = await create(user, {
		createdAt: new Date(post.object.published),
		files: files.length == 0 ? undefined : files,
		poll: undefined,
		text: text || undefined,
		reply,
		renote: null,
		cw: post.object.sensitive ? post.object.summary : undefined,
		localOnly: false,
		visibility: "hidden",
		visibleUsers: [],
		channel: null,
		apMentions: new Array(0),
		apHashtags: undefined,
		apEmojis: undefined,
	});
	job.progress(100);
	done();

	logger.succ("Imported");
}
