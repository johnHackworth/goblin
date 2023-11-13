import define from "../../../define.js";
import { createWorker } from "tesseract.js";

export const meta = {
	tags: ["drive"],

	requireCredential: true,

	kind: "read:drive",

	description: "Return caption of image",

	res: {
		type: "string",
		optional: false,
		nullable: false,
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		url: { type: "string" },
	},
	required: ["url"],
} as const;

export default define(meta, paramDef, async (ps) => {
	const worker = createWorker({
		logger: (m) => console.log(m),
	});

	await worker.load();
	await worker.loadLanguage("eng");
	await worker.initialize("eng");
	const {
		data: { text },
	} = await worker.recognize(ps.url);
	await worker.terminate();

	return text;
});
