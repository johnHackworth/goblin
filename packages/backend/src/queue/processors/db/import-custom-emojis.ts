import type Bull from "bull";
import * as fs from "node:fs";
import AdmZip from "adm-zip";

import { queueLogger } from "../../logger.js";
import { createTempDir } from "@/misc/create-temp.js";
import { downloadUrl } from "@/misc/download-url.js";
import { DriveFiles, Emojis } from "@/models/index.js";
import type { DbUserImportJobData } from "@/queue/types.js";
import { addFile } from "@/services/drive/add-file.js";
import { genId } from "@/misc/gen-id.js";
import { db } from "@/db/postgre.js";
import probeImageSize from "probe-image-size";
import * as path from "path";

const logger = queueLogger.createSubLogger("import-custom-emojis");

// TODO: 名前衝突時の動作を選べるようにする
export async function importCustomEmojis(
	job: Bull.Job<DbUserImportJobData>,
	done: any,
): Promise<void> {
	logger.info("Importing custom emojis ...");

	const file = await DriveFiles.findOneBy({
		id: job.data.fileId,
	});
	if (file == null) {
		done();
		return;
	}

	const [tempPath, cleanup] = await createTempDir();

	logger.info(`Temp dir is ${tempPath}`);

	const destPath = `${tempPath}/emojis.zip`;

	try {
		fs.writeFileSync(destPath, "", "binary");
		await downloadUrl(file.url, destPath);
	} catch (e) {
		// TODO: 何度か再試行
		if (e instanceof Error || typeof e === "string") {
			logger.error(e);
		}
		throw e;
	}

	const outputPath = `${tempPath}/emojis`;
	const unzipStream = fs.createReadStream(destPath);
	const zip = new AdmZip(destPath);
	zip.extractAllToAsync(outputPath, true, false, async (error) => {
		if (error) throw error;

		if (fs.existsSync(`${outputPath}/meta.json`)) {
			logger.info("starting emoji import with metadata");
			const metaRaw = fs.readFileSync(`${outputPath}/meta.json`, "utf-8");
			const meta = JSON.parse(metaRaw);

			for (const record of meta.emojis) {
				if (!record.downloaded) continue;
				const emojiInfo = record.emoji;
				const emojiPath = `${outputPath}/${record.fileName}`;
				await Emojis.delete({
					name: emojiInfo.name,
				});
				const driveFile = await addFile({
					user: null,
					path: emojiPath,
					name: record.fileName,
					force: true,
				});
				const file = fs.createReadStream(emojiPath);
				const size = await probeImageSize(file);
				file.destroy();
				await Emojis.insert({
					id: genId(),
					updatedAt: new Date(),
					name: emojiInfo.name,
					category: emojiInfo.category,
					host: null,
					aliases: emojiInfo.aliases,
					originalUrl: driveFile.url,
					publicUrl: driveFile.webpublicUrl ?? driveFile.url,
					type: driveFile.webpublicType ?? driveFile.type,
					license: emojiInfo.license,
					width: size.width || null,
					height: size.height || null,
				}).then((x) => Emojis.findOneByOrFail(x.identifiers[0]));
			}
		} else {
			logger.info("starting emoji import without metadata");
			// Since we lack metadata, we import into a randomized category name instead
			let categoryName = genId();

			let containedEmojis = fs.readdirSync(outputPath);

			// Filter out accidental JSON files
			containedEmojis = containedEmojis.filter(
				(emoji) => !emoji.match(/\.(json)$/i),
			);

			for (const emojiFilename of containedEmojis) {
				// strip extension and get filename to use as name
				const name = path.basename(emojiFilename, path.extname(emojiFilename));
				const emojiPath = `${outputPath}/${emojiFilename}`;

				logger.info(`importing ${name}`);

				await Emojis.delete({
					name: name,
				});
				const driveFile = await addFile({
					user: null,
					path: emojiPath,
					name: path.basename(emojiFilename),
					force: true,
				});
				const file = fs.createReadStream(emojiPath);
				const size = await probeImageSize(file);
				file.destroy();
				logger.info(`emoji size: ${size.width}x${size.height}`);

				await Emojis.insert({
					id: genId(),
					updatedAt: new Date(),
					name: name,
					category: categoryName,
					host: null,
					aliases: [],
					originalUrl: driveFile.url,
					publicUrl: driveFile.webpublicUrl ?? driveFile.url,
					type: driveFile.webpublicType ?? driveFile.type,
					license: null,
					width: size.width || null,
					height: size.height || null,
				}).then((x) => Emojis.findOneByOrFail(x.identifiers[0]));
			}
		}

		await db.queryResultCache!.remove(["meta_emojis"]);

		cleanup();

		logger.succ("Imported");
		done();
	});
	logger.succ(`Unzipping to ${outputPath}`);
}
