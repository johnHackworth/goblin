import { computed, ref, reactive } from "vue";
import { $i } from "./account";
import { search } from "@/scripts/search";
import * as os from "@/os";
import { i18n } from "@/i18n";
import { ui } from "@/config";
import { unisonReload } from "@/scripts/unison-reload";
import { defaultStore } from "@/store";
import { instance } from "@/instance";
import { host } from "@/config";
import XTutorial from "@/components/MkTutorialDialog.vue";

export const navbarItemDef = reactive({
	notifications: {
		title: "notifications",
		icon: "ph-bell ph-bold ph-lg",
		show: computed(() => $i != null),
		indicated: computed(() => $i?.hasUnreadNotification),
		to: "/my/notifications",
	},
	hashtags: {
		title: "hashtags",
		icon: "ph-hash ph-bold ph-lg",
		show: computed(() => $i != null),
		to: "/my/hashtags"
	},
	messaging: {
		title: "messaging",
		icon: "ph-chats-teardrop ph-bold ph-lg",
		show: computed(() => $i != null),
		indicated: computed(() => $i?.hasUnreadMessagingMessage),
		to: "/my/messaging",
	},
	drive: {
		title: "drive",
		icon: "ph-cloud ph-bold ph-lg",
		show: computed(() => $i != null),
		to: "/my/drive",
	},
	followRequests: {
		title: "followRequests",
		icon: "ph-hand-waving ph-bold ph-lg",
		show: computed(() => $i?.isLocked || $i?.hasPendingReceivedFollowRequest),
		indicated: computed(() => $i?.hasPendingReceivedFollowRequest),
		to: "/my/follow-requests",
	},
	explore: {
		title: "explore",
		icon: "ph-compass ph-bold ph-lg",
		to: "/explore",
	},
	announcements: {
		title: "announcements",
		icon: "ph-megaphone-simple ph-bold ph-lg",
		indicated: computed(() => $i?.hasUnreadAnnouncement),
		to: "/announcements",
	},
	search: {
		title: "search",
		icon: "ph-magnifying-glass ph-bold ph-lg",
		action: () => search(),
	},
	lists: {
		title: "lists",
		icon: "ph-list-bullets ph-bold ph-lg",
		show: computed(() => $i != null),
		to: "/my/lists",
	},
	pages: {
		title: "pages",
		icon: "ph-file-text ph-bold ph-lg",
		to: "/pages",
	},
	ui: {
		title: "switchUi",
		icon: "ph-layout ph-bold ph-lg",
		action: (ev) => {
			os.popupMenu(
				[
					{
						text: i18n.ts.default,
						active: ui === "default" || ui === null,
						action: () => {
							localStorage.setItem("ui", "default");
							unisonReload();
						},
					},
					{
						text: i18n.ts.classic,
						active: ui === "classic",
						action: () => {
							localStorage.setItem("ui", "classic");
							unisonReload();
						},
					},
					{
						text: i18n.ts.deck,
						active: ui === "deck",
						action: () => {
							localStorage.setItem("ui", "deck");
							unisonReload();
						},
					},
				],
				ev.currentTarget ?? ev.target,
			);
		},
	},
	reload: {
		title: "reload",
		icon: "ph-arrows-clockwise ph-bold ph-lg",
		action: (ev) => {
			location.reload();
		},
	},
});
