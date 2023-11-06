import define from "../../define.js";
import { createImportPostsJob } from "@/queue/index.js";
import { ApiError } from "../../error.js";
import { DriveFiles } from "@/models/index.js";
import { DAY } from "@/const.js";
import { fetchMeta } from "@/misc/fetch-meta.js";

export const meta = {
	secure: true,
	requireCredential: true,
	limit: {
		duration: DAY * 30,
		max: 2,
	},
	errors: {
		noSuchFile: {
			message: "No such file.",
			code: "NO_SUCH_FILE",
			id: "e674141e-bd2a-ba85-e616-aefb187c9c2a",
		},

		emptyFile: {
			message: "That file is empty.",
			code: "EMPTY_FILE",
			id: "d2f12af1-e7b4-feac-86a3-519548f2728e",
		},

		importsDisabled: {
			message: "Post imports are disabled.",
			code: "IMPORTS_DISABLED",
			id: " bc9227e4-fb82-11ed-be56-0242ac120002",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		fileId: { type: "string", format: "misskey:id" },
		signatureCheck: { type: "boolean" },
	},
	required: ["fileId"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	const file = await DriveFiles.findOneBy({ id: ps.fileId });

	const instanceMeta = await fetchMeta();
	if (instanceMeta.experimentalFeatures?.postImports === false)
		throw new ApiError(meta.errors.importsDisabled);

	if (file == null) throw new ApiError(meta.errors.noSuchFile);
	if (file.size === 0) throw new ApiError(meta.errors.emptyFile);
	createImportPostsJob(user, file.id, ps.signatureCheck);
});
