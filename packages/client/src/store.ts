import { markRaw, ref } from "vue";
import { Storage } from "./pizzax";

export const userActions = [];
export const noteActions = [];

const menuOptions = [
	"notifications",
	"followRequests",
	"messaging",
	"hashtags",
	"rss",
	"explore",
	"search",
	"profile",
];

// TODO: それぞれいちいちwhereとかdefaultというキーを付けなきゃいけないの冗長なのでなんとかする(ただ型定義が面倒になりそう)
//       あと、現行の定義の仕方なら「whereが何であるかに関わらずキー名の重複不可」という制約を付けられるメリットもあるからそのメリットを引き継ぐ方法も考えないといけない
export const defaultStore = markRaw(
	new Storage("base", {
		tutorial: {
			where: "account",
			default: 0,
		},
		tlHomeHintClosed: {
			where: "device",
			default: false,
		},
		tlLocalHintClosed: {
			where: "device",
			default: false,
		},
		tlRecommendedHintClosed: {
			where: "device",
			default: false,
		},
		tlSocialHintClosed: {
			where: "device",
			default: false,
		},
		tlGlobalHintClosed: {
			where: "device",
			default: false,
		},
		keepCw: {
			where: "account",
			default: true,
		},
		showFullAcct: {
			where: "account",
			default: false,
		},
		rememberNoteVisibility: {
			where: "account",
			default: false,
		},
		defaultNoteVisibility: {
			where: "account",
			default: "public",
		},
		defaultNoteLocalOnly: {
			where: "account",
			default: false,
		},
		uploadFolder: {
			where: "account",
			default: null as string | null,
		},
		pastedFileName: {
			where: "account",
			default: "yyyy-MM-dd HH-mm-ss [{{number}}]",
		},
		keepOriginalUploading: {
			where: "account",
			default: false,
		},
		memo: {
			where: "account",
			default: null,
		},
		reactions: {
			where: "account",
			default: [
				"⭐",
				"❤️",
				"😆",
				"🤔",
				"😮",
				"🎉",
				"💢",
				"😥",
				"😇",
				"🥴",
				"🍮",
			],
		},
		mutedWords: {
			where: "account",
			default: [],
		},
		mutedAds: {
			where: "account",
			default: [] as string[],
		},
		showAds: {
			where: "account",
			default: true,
		},
		menu: {
			where: "deviceAccount",
			default: menuOptions,
		},
		visibility: {
			where: "deviceAccount",
			default: "public" as "public" | "home" | "followers" | "specified",
		},
		localOnly: {
			where: "deviceAccount",
			default: false,
		},
		widgets: {
			where: "deviceAccount",
			default: [] as {
				name: string;
				id: string;
				place: string | null;
				data: Record<string, any>;
			}[],
		},
		tl: {
			where: "deviceAccount",
			default: {
				src: "home" as "home" | "local" | "social" | "global",
				arg: null,
			},
		},

		overridedDeviceKind: {
			where: "device",
			default: null as null | "smartphone" | "tablet" | "desktop",
		},
		serverDisconnectedBehavior: {
			where: "device",
			default: "nothing" as "nothing" | "quiet" | "reload" | "dialog",
		},
		seperateRenoteQuote: {
			where: "device",
			default: true,
		},
		expandOnNoteClick: {
			where: "device",
			default: true,
		},
		nsfw: {
			where: "device",
			default: "respect" as "respect" | "force" | "ignore",
		},
		animation: {
			where: "device",
			default: true,
		},
		advancedMfm: {
			where: "device",
			default: true,
		},
		animatedMfm: {
			where: "device",
			default: true,
		},
		animatedMfmWarnShown: {
			where: "device",
			default: false,
		},
		loadRawImages: {
			where: "device",
			default: false,
		},
		imageNewTab: {
			where: "device",
			default: false,
		},
		disableShowingAnimatedImages: {
			where: "device",
			default: false,
		},
		disablePagesScript: {
			where: "device",
			default: false,
		},
		useOsNativeEmojis: {
			where: "device",
			default: false,
		},
		disableDrawer: {
			where: "device",
			default: false,
		},
		useBlurEffectForModal: {
			where: "device",
			default: true,
		},
		useBlurEffect: {
			where: "device",
			default: true,
		},
		showFixedPostForm: {
			where: "device",
			default: false,
		},
		enableInfiniteScroll: {
			where: "device",
			default: true,
		},
		useReactionPickerForContextMenu: {
			where: "device",
			default: false,
		},
		showGapBetweenNotesInTimeline: {
			where: "device",
			default: true,
		},
		darkMode: {
			where: "device",
			default: false,
		},
		instanceTicker: {
			where: "device",
			default: "remote" as "none" | "remote" | "always",
		},
		reactionPickerSkinTone: {
			where: "account",
			default: 1,
		},
		reactionPickerSize: {
			where: "device",
			default: 3,
		},
		reactionPickerWidth: {
			where: "device",
			default: 3,
		},
		reactionPickerHeight: {
			where: "device",
			default: 3,
		},
		reactionPickerUseDrawerForMobile: {
			where: "device",
			default: true,
		},
		recentlyUsedEmojis: {
			where: "device",
			default: [] as string[],
		},
		recentlyUsedUsers: {
			where: "device",
			default: [] as string[],
		},
		defaultSideView: {
			where: "device",
			default: false,
		},
		menuDisplay: {
			where: "device",
			default: "sideFull" as "sideFull" | "sideIcon" | "top",
		},
		reportError: {
			where: "device",
			default: false,
		},
		squareAvatars: {
			where: "device",
			default: true,
		},
		postFormWithHashtags: {
			where: "device",
			default: false,
		},
		postFormHashtags: {
			where: "device",
			default: "",
		},
		themeInitial: {
			where: "device",
			default: true,
		},
		numberOfPageCache: {
			where: "device",
			default: 5,
		},
		enterSendsMessage: {
			where: "device",
			default: true,
		},
		showUpdates: {
			where: "device",
			default: true,
		},
		swipeOnDesktop: {
			where: "device",
			default: false,
		},
		swipeOnMobile: {
			where: "device",
			default: true,
		},
		showAdminUpdates: {
			where: "account",
			default: true,
		},
		woozyMode: {
			where: "device",
			default: false,
		},
		enableCustomKaTeXMacro: {
			where: "device",
			default: false,
		},
		enableEmojiReactions: {
			where: "account",
			default: true,
		},
		showEmojisInReactionNotifications: {
			where: "account",
			default: true,
		},
		showTimelineReplies: {
			where: "device",
			default: false,
		},
	}),
);

// TODO: 他のタブと永続化されたstateを同期

const PREFIX = "miux:";

/**
 * 常にメモリにロードしておく必要がないような設定情報を保管するストレージ(非リアクティブ)
 */
import darkTheme from "@/themes/_dark.json5";
const lightTheme = darkTheme;

export class ColdDeviceStorage {
	public static default = {
		lightTheme,
		darkTheme,
		syncDeviceDarkMode: true,
		mediaVolume: 0.5,
		sound_masterVolume: 0.3,
		sound_note: { type: "none", volume: 0 },
		sound_noteMy: { type: "syuilo/up", volume: 1 },
		sound_notification: { type: "syuilo/pope2", volume: 1 },
		sound_chat: { type: "syuilo/pope1", volume: 1 },
		sound_chatBg: { type: "syuilo/waon", volume: 1 },
		sound_channel: { type: "syuilo/square-pico", volume: 1 },
	};

	public static watchers = [];

	public static get<T extends keyof typeof ColdDeviceStorage.default>(
		key: T,
	): typeof ColdDeviceStorage.default[T] {
		// TODO: indexedDBにする
		//       ただしその際はnullチェックではなくキー存在チェックにしないとダメ
		//       (indexedDBはnullを保存できるため、ユーザーが意図してnullを格納した可能性がある)
		const value = localStorage.getItem(PREFIX + key);
		if (value == null) {
			return ColdDeviceStorage.default[key];
		} else {
			return JSON.parse(value);
		}
	}

	public static set<T extends keyof typeof ColdDeviceStorage.default>(
		key: T,
		value: typeof ColdDeviceStorage.default[T],
	): void {
		// 呼び出し側のバグ等で undefined が来ることがある
		// undefined を文字列として localStorage に入れると参照する際の JSON.parse でコケて不具合の元になるため無視
		if (value === undefined) {
			console.error(`attempt to store undefined value for key '${key}'`);
			return;
		}

		localStorage.setItem(PREFIX + key, JSON.stringify(value));

		for (const watcher of this.watchers) {
			if (watcher.key === key) watcher.callback(value);
		}
	}

	public static watch(key, callback) {
		this.watchers.push({ key, callback });
	}

	// TODO: VueのcustomRef使うと良い感じになるかも
	public static ref<T extends keyof typeof ColdDeviceStorage.default>(key: T) {
		const v = ColdDeviceStorage.get(key);
		const r = ref(v);
		// TODO: このままではwatcherがリークするので開放する方法を考える
		this.watch(key, (v) => {
			r.value = v;
		});
		return r;
	}

	/**
	 * 特定のキーの、簡易的なgetter/setterを作ります
	 * 主にvue場で設定コントロールのmodelとして使う用
	 */
	public static makeGetterSetter<
		K extends keyof typeof ColdDeviceStorage.default,
	>(key: K) {
		// TODO: VueのcustomRef使うと良い感じになるかも
		const valueRef = ColdDeviceStorage.ref(key);
		return {
			get: () => {
				return valueRef.value;
			},
			set: (value: unknown) => {
				const val = value;
				ColdDeviceStorage.set(key, val);
			},
		};
	}
}

// このファイルに書きたくないけどここに書かないと何故かVeturが認識しない
declare module "@vue/runtime-core" {
	interface ComponentCustomProperties {
		$store: typeof defaultStore;
	}
}
