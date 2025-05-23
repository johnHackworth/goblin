import { ref } from "vue";
import { DriveFile } from "firefish-js/built/entities";
import * as os from "@/os";
import { stream } from "@/stream";
import { i18n } from "@/i18n";
import { defaultStore } from "@/store";
import { uploadFile } from "@/scripts/upload";

function select(
	src: any,
	label: string | null,
	multiple: boolean,
): Promise<DriveFile | DriveFile[]> {
	return new Promise((res, rej) => {
		const keepOriginal = ref(defaultStore.state.keepOriginalUploading);

		const chooseFileFromPc = () => {
			const input = document.createElement("input");
			input.type = "file";
			input.multiple = multiple;
			input.accept = ".jpg,.jpeg,.png,.gif";
			input.onchange = () => {
				const promises = Array.from(input.files).map((file) =>
					uploadFile(
						file,
						defaultStore.state.uploadFolder,
						undefined,
						keepOriginal.value,
					),
				);

				Promise.all(promises)
					.then((driveFiles) => {
						res(multiple ? driveFiles : driveFiles[0]);
					})
					.catch((err) => {
						// アップロードのエラーは uploadFile 内でハンドリングされているためアラートダイアログを出したりはしてはいけない
					});

				// 一応廃棄
				(window as any).__misskey_input_ref__ = null;
			};

			// https://qiita.com/fukasawah/items/b9dc732d95d99551013d
			// iOS Safari で正常に動かす為のおまじない
			(window as any).__misskey_input_ref__ = input;

			input.click();
		};

		const chooseFileFromDrive = () => {
			os.selectDriveFile(multiple).then((files) => {
				res(files);
			});
		};

		const chooseFileFromUrl = () => {
			os.inputText({
				title: i18n.ts.uploadFromUrl,
				type: "url",
				placeholder: i18n.ts.uploadFromUrlDescription,
			}).then(({ canceled, result: url }) => {

				res(url);

			});
		};

		os.popupMenu(
			[
				label
					? {
							text: label,
							type: "label",
					  }
					: undefined,
				{
					type: "switch",
					text: i18n.ts.keepOriginalUploading,
					ref: keepOriginal,
				},
				{
					text: i18n.ts.upload,
					icon: "ph-upload-simple ph-bold ph-lg",
					action: chooseFileFromPc,
				},
				{
					text: i18n.ts.fromDrive,
					icon: "ph-cloud ph-bold ph-lg",
					action: chooseFileFromDrive,
				},
				{
					text: i18n.ts.fromUrl,
					icon: "ph-link-simple ph-bold ph-lg",
					action: chooseFileFromUrl,
				},
			],
			src,
		);
	});
}

export function selectFile(
	src: any,
	label: string | null = null,
): Promise<DriveFile> {
	return select(src, label, false) as Promise<DriveFile>;
}

export function selectFiles(
	src: any,
	label: string | null = null,
): Promise<DriveFile[]> {
	return select(src, label, true) as Promise<DriveFile[]>;
}
