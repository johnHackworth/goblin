import { i18n } from "@/i18n";
import * as os from "@/os";

export async function lookupInstance() {
	const { canceled, result: q } = await os.inputText({
		title: i18n.ts.instance,
	});
	if (canceled) return;

	os.api(
		"federation/show-instance",
		q.startsWith("http://") || q.startsWith("https://")
			? { host: q.replace("https://", "") }
			: { host: q },
	)
		.then((instance) => {
			os.pageWindow(`/instance-info/${instance.host}`);
		})
		.catch(() => {
			os.alert({
				type: "error",
				text: i18n.ts.notFound,
			});
		});
}
