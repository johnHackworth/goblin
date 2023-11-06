import { i18n } from "@/i18n";
import * as os from "@/os";

export async function indexPosts() {
	const { canceled, result: index } = await os.inputText({
		title: i18n.ts.indexFrom,
		text: i18n.ts.indexFromDescription,
	});
	if (canceled) return;

	if (index == null || index === "") {
		await os.api("admin/search/index-all");
		await os.alert({
			type: "info",
			text: i18n.ts.indexNotice,
		});
	} else {
		await os.api("admin/search/index-all", {
			cursor: index,
		});
		await os.alert({
			type: "info",
			text: i18n.ts.indexNotice,
		});
	}
}
