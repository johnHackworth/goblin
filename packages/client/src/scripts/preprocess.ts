import * as mfm from "mfm-js";
import { defaultStore } from "@/store";
import { expandKaTeXMacro } from "@/scripts/katex-macro";

export function preprocess(text: string): string {
	if (defaultStore.state.enableCustomKaTeXMacro) {
		const parsedKaTeXMacro =
			localStorage.getItem("customKaTeXMacroParsed") ?? "{}";
		const maxNumberOfExpansions = 200; // to prevent infinite expansion loops

		let nodes = mfm.parse(text);

		for (let node of nodes) {
			if (node["type"] === "mathInline" || node["type"] === "mathBlock") {
				node["props"]["formula"] = expandKaTeXMacro(
					node["props"]["formula"],
					parsedKaTeXMacro,
					maxNumberOfExpansions,
				);
			}
		}

		text = mfm.toString(nodes);
	}

	return text;
}
