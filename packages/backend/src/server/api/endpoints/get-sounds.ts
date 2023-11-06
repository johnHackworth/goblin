import { readdir } from "fs/promises";
import define from "../define.js";

export const meta = {
	tags: ["meta"],
	requireCredential: false,
	requireCredentialPrivateMode: false,
} as const;

export const paramDef = {
	type: "object",
	properties: {},
	required: [],
} as const;

export default define(meta, paramDef, async () => {
	const music_files: (string | null)[] = [null];
	const directory = (
		await readdir("./assets/sounds", { withFileTypes: true })
	).filter((potentialFolder) => potentialFolder.isDirectory());
	for await (const folder of directory) {
		const files = (await readdir(`./assets/sounds/${folder.name}`)).filter(
			(potentialSong) => potentialSong.endsWith(".mp3"),
		);
		for await (const file of files) {
			music_files.push(`${folder.name}/${file.replace(".mp3", "")}`);
		}
	}
	return music_files;
});
