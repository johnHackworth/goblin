import { i18n } from "@/i18n";
import * as os from "@/os";

export async function lookupFile() {
	const { canceled, result: q } = await os.inputText({
		title: i18n.ts.fileIdOrUrl,
	});
	if (canceled) return;

	os.api(
		"admin/drive/show-file",
		q.startsWith("http://") || q.startsWith("https://")
			? { url: q.trim() }
			: { fileId: q.trim() },
	)
		.then((file) => {
			os.pageWindow(`/admin/file/${file.id}`);
		})
		.catch((err) => {
			if (err.code === "NO_SUCH_FILE") {
				os.alert({
					type: "error",
					text: i18n.ts.notFound,
				});
			}
		});
}
