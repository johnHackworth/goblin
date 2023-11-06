import type Bull from "bull";
import { IsNull } from "typeorm";
import { Emojis } from "@/models/index.js";

import { queueLogger } from "../../logger.js";
import { getEmojiSize } from "@/misc/emoji-meta.js";

const logger = queueLogger.createSubLogger("local-emoji-size");

export async function setLocalEmojiSizes(
	_job: Bull.Job<Record<string, unknown>>,
	done: any,
): Promise<void> {
	logger.info("Setting sizes of local emojis...");

	const emojis = await Emojis.findBy([
		{ host: IsNull(), width: IsNull(), height: IsNull() },
	]);
	logger.info(`${emojis.length} emojis need to be fetched.`);

	for (let i = 0; i < emojis.length; i++) {
		try {
			const size = await getEmojiSize(emojis[i].publicUrl);
			await Emojis.update(emojis[i].id, {
				width: size.width || null,
				height: size.height || null,
			});
		} catch (e) {
			logger.error(
				`Unable to set emoji size (${i + 1}/${emojis.length}): ${e}`,
			);
			/* skip if any error happens */
		} finally {
			// wait for 1sec so that this would not overwhelm the object storage.
			await new Promise((resolve) => setTimeout(resolve, 1000));
			if (i % 10 === 9) logger.succ(`fetched ${i + 1}/${emojis.length} emojis`);
		}
	}

	logger.succ("Done.");
	done();
}
