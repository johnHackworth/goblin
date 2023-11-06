import type Bull from "bull";
import { Notes, PollVotes } from "@/models/index.js";
import { queueLogger } from "../logger.js";
import type { EndedPollNotificationJobData } from "@/queue/types.js";
import { createNotification } from "@/services/create-notification.js";
import { deliverQuestionUpdate } from "@/services/note/polls/update.js";

const logger = queueLogger.createSubLogger("ended-poll-notification");

export async function endedPollNotification(
	job: Bull.Job<EndedPollNotificationJobData>,
	done: any,
): Promise<void> {
	const note = await Notes.findOneBy({ id: job.data.noteId });
	if (note == null || !note.hasPoll) {
		done();
		return;
	}

	const votes = await PollVotes.createQueryBuilder("vote")
		.select("vote.userId")
		.where("vote.noteId = :noteId", { noteId: note.id })
		.innerJoinAndSelect("vote.user", "user")
		.andWhere("user.host IS NULL")
		.getMany();

	const userIds = [...new Set([note.userId, ...votes.map((v) => v.userId)])];

	for (const userId of userIds) {
		createNotification(userId, "pollEnded", {
			noteId: note.id,
		});
	}

	// Broadcast the poll result once it ends
	if (!note.localOnly) await deliverQuestionUpdate(note.id);

	done();
}
