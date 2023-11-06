import { URLSearchParams } from "node:url";
import fetch from "node-fetch";
import config from "@/config/index.js";
import { getAgentByUrl } from "@/misc/fetch.js";
import { fetchMeta } from "@/misc/fetch-meta.js";
import { Notes } from "@/models/index.js";
import { ApiError } from "../../error.js";
import { getNote } from "../../common/getters.js";
import define from "../../define.js";

export const meta = {
	tags: ["notes"],

	requireCredential: false,
	requireCredentialPrivateMode: true,

	res: {
		type: "object",
		optional: false,
		nullable: false,
	},

	errors: {
		noSuchNote: {
			message: "No such note.",
			code: "NO_SUCH_NOTE",
			id: "bea9b03f-36e0-49c5-a4db-627a029f8971",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		noteId: { type: "string", format: "misskey:id" },
		targetLang: { type: "string" },
	},
	required: ["noteId", "targetLang"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	const note = await getNote(ps.noteId, user).catch((err) => {
		if (err.id === "9725d0ce-ba28-4dde-95a7-2cbb2c15de24")
			throw new ApiError(meta.errors.noSuchNote);
		throw err;
	});

	if (note.text == null) {
		return 204;
	}

	const instance = await fetchMeta();

	if (instance.deeplAuthKey == null && instance.libreTranslateApiUrl == null) {
		return 204; // TODO: 良い感じのエラー返す
	}

	let targetLang = ps.targetLang;
	if (targetLang.includes("-")) targetLang = targetLang.split("-")[0];

	if (instance.libreTranslateApiUrl != null) {
		const jsonBody = {
			q: note.text,
			source: "auto",
			target: targetLang,
			format: "text",
			api_key: instance.libreTranslateApiKey ?? "",
		};

		const url = new URL(instance.libreTranslateApiUrl);
		if (url.pathname.endsWith("/")) {
			url.pathname = url.pathname.slice(0, -1);
		}
		if (!url.pathname.endsWith("/translate")) {
			url.pathname += "/translate";
		}
		const res = await fetch(url.toString(), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(jsonBody),
			agent: getAgentByUrl,
		});

		const json = (await res.json()) as {
			detectedLanguage?: {
				confidence: number;
				language: string;
			};
			translatedText: string;
		};

		return {
			sourceLang: json.detectedLanguage?.language,
			text: json.translatedText,
		};
	}

	const params = new URLSearchParams();
	params.append("auth_key", instance.deeplAuthKey ?? "");
	params.append("text", note.text);
	params.append("target_lang", targetLang);

	const endpoint = instance.deeplIsPro
		? "https://api.deepl.com/v2/translate"
		: "https://api-free.deepl.com/v2/translate";

	const res = await fetch(endpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			"User-Agent": config.userAgent,
			Accept: "application/json, */*",
		},
		body: params,
		// TODO
		//timeout: 10000,
		agent: getAgentByUrl,
	});

	const json = (await res.json()) as {
		translations: {
			detected_source_language: string;
			text: string;
		}[];
	};

	return {
		sourceLang: json.translations[0].detected_source_language,
		text: json.translations[0].text,
	};
});
