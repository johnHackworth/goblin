import type Bull from "bull";
import type { DoneCallback } from "bull";

import { queueLogger } from "../../logger.js";
import { Notes } from "@/models/index.js";
import { MoreThan } from "typeorm";
import { index } from "@/services/note/create.js";
import { Note } from "@/models/entities/note.js";
import meilisearch from "../../../db/meilisearch.js";

const logger = queueLogger.createSubLogger("index-all-notes");

export default async function indexAllNotes(
	job: Bull.Job<Record<string, unknown>>,
	done: DoneCallback,
): Promise<void> {
	logger.info("Indexing all notes...");

	let cursor: string | null = (job.data.cursor as string) ?? null;
	let indexedCount: number = (job.data.indexedCount as number) ?? 0;
	let total: number = (job.data.total as number) ?? 0;

	let running = true;
	const take = 10000;
	const batch = 100;
	while (running) {
		logger.info(
			`Querying for ${take} notes ${indexedCount}/${
				total ? total : "?"
			} at ${cursor}`,
		);

		let notes: Note[] = [];
		try {
			notes = await Notes.find({
				where: {
					...(cursor ? { id: MoreThan(cursor) } : {}),
				},
				take: take,
				order: {
					id: 1,
				},
				relations: ["user"],
			});
		} catch (e: any) {
			logger.error(`Failed to query notes ${e}`);
			done(e);
			break;
		}

		if (notes.length === 0) {
			await job.progress(100);
			running = false;
			break;
		}

		try {
			const count = await Notes.count();
			total = count;
			await job.update({ indexedCount, cursor, total });
		} catch (e) {}

		for (let i = 0; i < notes.length; i += batch) {
			const chunk = notes.slice(i, i + batch);

			if (meilisearch) {
				await meilisearch.ingestNote(chunk);
			}

			await Promise.all(chunk.map((note) => index(note, true)));

			indexedCount += chunk.length;
			const pct = (indexedCount / total) * 100;
			await job.update({ indexedCount, cursor, total });
			await job.progress(+pct.toFixed(1));
			logger.info(`Indexed notes ${indexedCount}/${total ? total : "?"}`);
		}
		cursor = notes[notes.length - 1].id;
		await job.update({ indexedCount, cursor, total });

		if (notes.length < take) {
			running = false;
		}
	}

	done();
	logger.info("All notes have been indexed.");
}
