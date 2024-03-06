// TODO: なんでもかんでもos.tsに突っ込むのやめたいのでよしなに分割する

import { Component, markRaw, Ref, ref, defineAsyncComponent } from "vue";
import { EventEmitter } from "eventemitter3";
import insertTextAtCursor from "insert-text-at-cursor";
import * as Misskey from "firefish-js";
import { apiUrl, url } from "@/config";
import MkPostFormDialog from "@/components/MkPostFormDialog.vue";
import MkWaitingDialog from "@/components/MkWaitingDialog.vue";
import MkToast from "@/components/MkToast.vue";
import MkDialog from "@/components/MkDialog.vue";
import { MenuItem } from "@/types/menu";
import { $i } from "@/account";
import { i18n } from "./i18n";

export const pendingApiRequestsCount = ref(0);

const apiClient = new Misskey.api.APIClient({
	origin: url,
});

export const api = ((
	endpoint: string,
	data: Record<string, any> = {},
	token?: string | null | undefined,
) => {
	pendingApiRequestsCount.value++;

	const onFinally = () => {
		pendingApiRequestsCount.value--;
	};

	const authorizationToken = token ?? $i?.token ?? undefined;
	const authorization = authorizationToken
		? `Bearer ${authorizationToken}`
		: undefined;

	const promise = new Promise((resolve, reject) => {
		fetch(endpoint.includes("://") ? endpoint : `${apiUrl}/${endpoint}`, {
			method: "POST",
			body: JSON.stringify(data),
			credentials: "omit",
			cache: "no-cache",
			headers: authorization ? { authorization } : {},
		})
			.then(async (res) => {
				const body = res.status === 204 ? null : await res.json();

				if (res.status === 200) {
					resolve(body);
				} else if (res.status === 204) {
					resolve();
				} else {
					reject(body.error);
				}
			})
			.catch(reject);
	});

	promise.then(onFinally, onFinally);

	return promise;
}) as typeof apiClient.request;

export const apiGet = ((
	endpoint: string,
	data: Record<string, any> = {},
	token?: string | null | undefined,
) => {
	pendingApiRequestsCount.value++;

	const onFinally = () => {
		pendingApiRequestsCount.value--;
	};

	const query = new URLSearchParams(data);

	const authorizationToken = token ?? $i?.token ?? undefined;
	const authorization = authorizationToken
		? `Bearer ${authorizationToken}`
		: undefined;

	const promise = new Promise((resolve, reject) => {
		// Send request
		fetch(`${apiUrl}/${endpoint}?${query}`, {
			method: "GET",
			credentials: "omit",
			cache: "default",
			headers: authorization ? { authorization } : {},
		})
			.then(async (res) => {
				const body = res.status === 204 ? null : await res.json();

				if (res.status === 200) {
					resolve(body);
				} else if (res.status === 204) {
					resolve();
				} else {
					reject(body.error);
				}
			})
			.catch(reject);
	});

	promise.then(onFinally, onFinally);

	return promise;
}) as typeof apiClient.request;

export const apiWithDialog = ((
	endpoint: string,
	data: Record<string, any> = {},
	token?: string | null | undefined,
) => {
	const promise = api(endpoint, data, token);
	promiseDialog(promise, null, (err) => {
		alert({
			type: "error",
			text: err.message + "\n" + (err as any).id,
		});
	});

	return promise;
}) as typeof api;

export function promiseDialog<T extends Promise<any>>(
	promise: T,
	onSuccess?: ((res: any) => void) | null,
	onFailure?: ((err: Error) => void) | null,
	text?: string,
): T {
	const showing = ref(true);
	const success = ref(false);

	promise
		.then((res) => {
			if (onSuccess) {
				showing.value = false;
				onSuccess(res);
			} else {
				success.value = true;
				window.setTimeout(() => {
					showing.value = false;
				}, 1000);
			}
		})
		.catch((err) => {
			showing.value = false;
			if (onFailure) {
				onFailure(err);
			} else {
				alert({
					type: "error",
					text: err,
				});
			}
		});

	// NOTE: dynamic importすると挙動がおかしくなる(showingの変更が伝播しない)
	popup(
		MkWaitingDialog,
		{
			success: success,
			showing: showing,
			text: text,
		},
		{},
		"closed",
	);

	return promise;
}

let popupIdCount = 0;
export const popups = ref([]) as Ref<
	{
		id: any;
		component: any;
		props: Record<string, any>;
	}[]
>;

const zIndexes = {
	low: 1000000,
	middle: 2000000,
	high: 3000000,
};
export function claimZIndex(
	priority: "low" | "middle" | "high" = "low",
): number {
	zIndexes[priority] += 100;
	return zIndexes[priority];
}

let uniqueId = 0;
export function getUniqueId(): string {
	return uniqueId++ + "";
}

export async function popup(
	component: Component,
	props: Record<string, any>,
	events = {},
	disposeEvent?: string,
) {
	markRaw(component);

	const id = ++popupIdCount;
	const dispose = () => {
		// このsetTimeoutが無いと挙動がおかしくなる(autocompleteが閉じなくなる)。Vueのバグ？
		window.setTimeout(() => {
			popups.value = popups.value.filter((popup) => popup.id !== id);
		}, 0);
	};
	const state = {
		component,
		props,
		events: disposeEvent
			? {
					...events,
					[disposeEvent]: dispose,
			  }
			: events,
		id,
	};

	popups.value.push(state);

	return {
		dispose,
	};
}

export function pageWindow(path: string) {
	popup(
		defineAsyncComponent({
			loader: () => import("@/components/MkPageWindow.vue"),
			loadingComponent: MkWaitingDialog,
			delay: 1000,
		}),
		{
			initialPath: path,
		},
		{},
		"closed",
	);
}

export function modalPageWindow(path: string) {
	popup(
		defineAsyncComponent({
			loader: () => import("@/components/MkModalPageWindow.vue"),
			loadingComponent: MkWaitingDialog,
			delay: 1000,
		}),
		{
			initialPath: path,
		},
		{},
		"closed",
	);
}

export function toast(message: string) {
	popup(
		MkToast,
		{
			message,
		},
		{},
		"closed",
	);
}

export function alert(props: {
	type?: "error" | "info" | "success" | "warning" | "waiting" | "question";
	title?: string | null;
	text?: string | null;
}): Promise<void> {
	return new Promise((resolve, reject) => {
		if (props.text == null && props.type === "error") {
			props.text = i18n.ts.somethingHappened;
		}
		popup(
			MkDialog,
			props,
			{
				done: (result) => {
					resolve();
				},
			},
			"closed",
		);
	});
}

export function confirm(props: {
	type: "error" | "info" | "success" | "warning" | "waiting" | "question";
	title?: string | null;
	text?: string | null;
	okText?: string;
	cancelText?: string;
}): Promise<{ canceled: boolean }> {
	return new Promise((resolve, reject) => {
		popup(
			MkDialog,
			{
				...props,
				showCancelButton: true,
			},
			{
				done: (result) => {
					resolve(result ? result : { canceled: true });
				},
			},
			"closed",
		);
	});
}

export function yesno(props: {
	type: "error" | "info" | "success" | "warning" | "waiting" | "question";
	title?: string | null;
	text?: string | null;
}): Promise<{ canceled: boolean }> {
	return new Promise((resolve, reject) => {
		popup(
			defineAsyncComponent({
				loader: () => import("@/components/MkDialog.vue"),
				loadingComponent: MkWaitingDialog,
				delay: 1000,
			}),
			{
				...props,
				showCancelButton: true,
				isYesNo: true,
			},
			{
				done: (result) => {
					resolve(result ? result : { canceled: true });
				},
			},
			"closed",
		);
	});
}

export function inputText(props: {
	type?: "text" | "email" | "password" | "url" | "search";
	title?: string | null;
	text?: string | null;
	placeholder?: string | null;
	autocomplete?: string;
	default?: string | null;
	minLength?: number;
	maxLength?: number;
}): Promise<
	| { canceled: true; result: undefined }
	| {
			canceled: false;
			result: string;
	  }
> {
	return new Promise((resolve, reject) => {
		popup(
			MkDialog,
			{
				title: props.title,
				text: props.text,
				input: {
					type: props.type,
					placeholder: props.placeholder,
					autocomplete: props.autocomplete,
					default: props.default,
					minLength: props.minLength,
					maxLength: props.maxLength,
				},
			},
			{
				done: (result) => {
					resolve(result ? result : { canceled: true });
				},
			},
			"closed",
		);
	});
}

export function inputParagraph(props: {
	title?: string | null;
	text?: string | null;
	placeholder?: string | null;
	default?: string | null;
}): Promise<
	| { canceled: true; result: undefined }
	| {
			canceled: false;
			result: string;
	  }
> {
	return new Promise((resolve, reject) => {
		popup(
			defineAsyncComponent({
				loader: () => import("@/components/MkDialog.vue"),
				loadingComponent: MkWaitingDialog,
				delay: 1000,
			}),
			{
				title: props.title,
				text: props.text,
				input: {
					type: "paragraph",
					placeholder: props.placeholder,
					default: props.default,
				},
			},
			{
				done: (result) => {
					resolve(result ? result : { canceled: true });
				},
			},
			"closed",
		);
	});
}

export function inputNumber(props: {
	title?: string | null;
	text?: string | null;
	placeholder?: string | null;
	default?: number | null;
	autocomplete?: string;
}): Promise<
	| { canceled: true; result: undefined }
	| {
			canceled: false;
			result: number;
	  }
> {
	return new Promise((resolve, reject) => {
		popup(
			defineAsyncComponent({
				loader: () => import("@/components/MkDialog.vue"),
				loadingComponent: MkWaitingDialog,
				delay: 1000,
			}),
			{
				title: props.title,
				text: props.text,
				input: {
					type: "number",
					placeholder: props.placeholder,
					autocomplete: props.autocomplete,
					default: props.default,
				},
			},
			{
				done: (result) => {
					resolve(result ? result : { canceled: true });
				},
			},
			"closed",
		);
	});
}

export function inputDate(props: {
	title?: string | null;
	text?: string | null;
	placeholder?: string | null;
	default?: Date | null;
}): Promise<
	| { canceled: true; result: undefined }
	| {
			canceled: false;
			result: Date;
	  }
> {
	return new Promise((resolve, reject) => {
		popup(
			MkDialog,
			{
				title: props.title,
				text: props.text,
				input: {
					type: "date",
					placeholder: props.placeholder,
					default: props.default,
				},
			},
			{
				done: (result) => {
					resolve(
						result
							? {
									result: new Date(result.result),
									canceled: false,
							  }
							: { canceled: true },
					);
				},
			},
			"closed",
		);
	});
}

export function select<C = any>(
	props: {
		title?: string | null;
		text?: string | null;
		default?: string | null;
	} & (
		| {
				items: {
					value: C;
					text: string;
				}[];
		  }
		| {
				groupedItems: {
					label: string;
					items: {
						value: C;
						text: string;
					}[];
				}[];
		  }
	),
): Promise<
	| { canceled: true; result: undefined }
	| {
			canceled: false;
			result: C;
	  }
> {
	return new Promise((resolve, reject) => {
		popup(
			MkDialog,
			{
				title: props.title,
				text: props.text,
				select: {
					items: props.items,
					groupedItems: props.groupedItems,
					default: props.default,
				},
			},
			{
				done: (result) => {
					resolve(result ? result : { canceled: true });
				},
			},
			"closed",
		);
	});
}

export function success(): Promise<void> {
	return new Promise((resolve, reject) => {
		const showing = ref(true);
		window.setTimeout(() => {
			showing.value = false;
		}, 1000);
		popup(
			MkWaitingDialog,
			{
				success: true,
				showing: showing,
			},
			{
				done: () => resolve(),
			},
			"closed",
		);
	});
}

export function waiting(): Promise<void> {
	return new Promise((resolve, reject) => {
		const showing = ref(true);
		popup(
			MkWaitingDialog,
			{
				success: false,
				showing: showing,
			},
			{
				done: () => resolve(),
			},
			"closed",
		);
	});
}

export function form(title, form) {
	return new Promise((resolve, reject) => {
		popup(
			defineAsyncComponent({
				loader: () => import("@/components/MkFormDialog.vue"),
				loadingComponent: MkWaitingDialog,
				delay: 1000,
			}),
			{ title, form },
			{
				done: (result) => {
					resolve(result);
				},
			},
			"closed",
		);
	});
}

export async function selectUser() {
	return new Promise((resolve, reject) => {
		popup(
			defineAsyncComponent({
				loader: () => import("@/components/MkUserSelectDialog.vue"),
				loadingComponent: MkWaitingDialog,
				delay: 1000,
			}),
			{},
			{
				ok: (user) => {
					resolve(user);
				},
			},
			"closed",
		);
	});
}

export async function selectLocalUser() {
	return new Promise((resolve, reject) => {
		popup(
			defineAsyncComponent({
				loader: () => import("@/components/MkUserSelectLocalDialog.vue"),
				loadingComponent: MkWaitingDialog,
				delay: 1000,
			}),
			{},
			{
				ok: (user) => {
					resolve(user);
				},
			},
			"closed",
		);
	});
}

export async function selectInstance(): Promise<Misskey.entities.Instance> {
	return new Promise((resolve, reject) => {
		popup(
			defineAsyncComponent({
				loader: () => import("@/components/MkInstanceSelectDialog.vue"),
				loadingComponent: MkWaitingDialog,
				delay: 1000,
			}),
			{},
			{
				ok: (instance) => {
					resolve(instance);
				},
			},
			"closed",
		);
	});
}

export async function selectDriveFile(multiple: boolean) {
	return new Promise((resolve, reject) => {
		popup(
			defineAsyncComponent({
				loader: () => import("@/components/MkDriveSelectDialog.vue"),
				loadingComponent: MkWaitingDialog,
				delay: 1000,
			}),
			{
				type: "file",
				multiple,
			},
			{
				done: (files) => {
					if (files) {
						resolve(multiple ? files : files[0]);
					}
				},
			},
			"closed",
		);
	});
}

export async function selectDriveFolder(multiple: boolean) {
	return new Promise((resolve, reject) => {
		popup(
			defineAsyncComponent({
				loader: () => import("@/components/MkDriveSelectDialog.vue"),
				loadingComponent: MkWaitingDialog,
				delay: 1000,
			}),
			{
				type: "folder",
				multiple,
			},
			{
				done: (folders) => {
					if (folders) {
						resolve(multiple ? folders : folders[0]);
					}
				},
			},
			"closed",
		);
	});
}

export async function pickEmoji(src: HTMLElement | null, opts) {
	return new Promise((resolve, reject) => {
		popup(
			defineAsyncComponent({
				loader: () => import("@/components/MkEmojiPickerDialog.vue"),
				loadingComponent: MkWaitingDialog,
				delay: 1000,
			}),
			{
				src,
				...opts,
			},
			{
				done: (emoji) => {
					resolve(emoji);
				},
			},
			"closed",
		);
	});
}

export async function cropImage(
	image: Misskey.entities.DriveFile,
	options: {
		aspectRatio: number;
	},
): Promise<Misskey.entities.DriveFile> {
	return new Promise((resolve, reject) => {
		popup(
			defineAsyncComponent({
				loader: () => import("@/components/MkCropperDialog.vue"),
				loadingComponent: MkWaitingDialog,
				delay: 1000,
			}),
			{
				file: image,
				aspectRatio: options.aspectRatio,
			},
			{
				ok: (x) => {
					resolve(x);
				},
			},
			"closed",
		);
	});
}

type AwaitType<T> = T extends Promise<infer U>
	? U
	: T extends (...args: any[]) => Promise<infer V>
	? V
	: T;
let openingEmojiPicker: AwaitType<ReturnType<typeof popup>> | null = null;
let activeTextarea: HTMLTextAreaElement | HTMLInputElement | null = null;
export async function openEmojiPicker(
	src?: HTMLElement,
	opts,
	initialTextarea: typeof activeTextarea,
) {
	if (openingEmojiPicker) return;

	activeTextarea = initialTextarea;

	const textareas = document.querySelectorAll("textarea, input");
	for (const textarea of Array.from(textareas)) {
		textarea.addEventListener("focus", () => {
			activeTextarea = textarea;
		});
	}

	const observer = new MutationObserver((records) => {
		for (const record of records) {
			for (const node of Array.from(record.addedNodes).filter(
				(node) => node instanceof HTMLElement,
			) as HTMLElement[]) {
				const textareas = node.querySelectorAll("textarea, input");
				for (const textarea of Array.from(textareas).filter(
					(textarea) => textarea.dataset.preventEmojiInsert == null,
				)) {
					if (document.activeElement === textarea) activeTextarea = textarea;
					textarea.addEventListener("focus", () => {
						activeTextarea = textarea;
					});
				}
			}
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
		attributes: false,
		characterData: false,
	});

	openingEmojiPicker = await popup(
		defineAsyncComponent({
			loader: () => import("@/components/MkEmojiPickerDialog.vue"),
			loadingComponent: MkWaitingDialog,
			delay: 1000,
		}),
		{
			src,
			...opts,
		},
		{
			chosen: (emoji) => {
				insertTextAtCursor(activeTextarea, emoji);
			},
			done: (emoji) => {
				insertTextAtCursor(activeTextarea, emoji);
			},
			closed: () => {
				openingEmojiPicker!.dispose();
				openingEmojiPicker = null;
				observer.disconnect();
			},
		},
	);
}

export function popupMenu(
	items: MenuItem[] | Ref<MenuItem[]>,
	src?: HTMLElement,
	options?: {
		align?: string;
		width?: number;
		viaKeyboard?: boolean;
		noReturnFocus?: boolean;
	},
) {
	return new Promise((resolve, reject) => {
		let dispose;
		popup(
			defineAsyncComponent({
				loader: () => import("@/components/MkPopupMenu.vue"),
				loadingComponent: MkWaitingDialog,
				delay: 1000,
			}),
			{
				items,
				src,
				width: options?.width,
				align: options?.align,
				viaKeyboard: options?.viaKeyboard,
				noReturnFocus: options?.noReturnFocus,
			},
			{
				closed: () => {
					resolve();
					dispose();
				},
			},
		).then((res) => {
			dispose = res.dispose;
		});
	});
}

export function contextMenu(
	items: MenuItem[] | Ref<MenuItem[]>,
	ev: MouseEvent,
) {
	ev.preventDefault();
	return new Promise((resolve, reject) => {
		let dispose;
		popup(
			defineAsyncComponent({
				loader: () => import("@/components/MkContextMenu.vue"),
				loadingComponent: MkWaitingDialog,
				delay: 1000,
			}),
			{
				items,
				ev,
			},
			{
				closed: () => {
					resolve();
					dispose();
				},
			},
		).then((res) => {
			dispose = res.dispose;
		});
	});
}

export function post(props: Record<string, any> = {}) {
	return new Promise((resolve, reject) => {
		// NOTE: MkPostFormDialogをdynamic importするとiOSでテキストエリアに自動フォーカスできない
		// NOTE: ただ、dynamic importしない場合、MkPostFormDialogインスタンスが使いまわされ、
		//       Vueが渡されたコンポーネントに内部的に__propsというプロパティを生やす影響で、
		//       複数のpost formを開いたときに場合によってはエラーになる
		//       もちろん複数のpost formを開けること自体Misskeyサイドのバグなのだが
		let dispose;
		popup(MkPostFormDialog, props, {
			closed: () => {
				resolve();
				dispose();
			},
		}).then((res) => {
			dispose = res.dispose;
		});
	});
}

export const deckGlobalEvents = new EventEmitter();

/*
export function checkExistence(fileData: ArrayBuffer): Promise<any> {
	return new Promise((resolve, reject) => {
		const data = new FormData();
		data.append('md5', getMD5(fileData));

		os.api('drive/files/find-by-hash', {
			md5: getMD5(fileData)
		}).then(resp => {
			resolve(resp.length > 0 ? resp[0] : null);
		});
	});
}*/
