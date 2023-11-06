import { defaultStore } from "@/store";
import { instance } from "@/instance";
import { host } from "@/config";
import * as os from "@/os";
import XTutorial from "../components/MkTutorialDialog.vue";
import { i18n } from "@/i18n";

export function openHelpMenu_(ev: MouseEvent) {
	os.popupMenu(
		[
			{
				text: instance.name ?? host,
				type: "label",
			},
			{
				type: "link",
				text: i18n.ts.instanceInfo,
				icon: "ph-info ph-bold ph-lg",
				to: "/about",
			},
			{
				type: "link",
				text: i18n.ts.aboutFirefish,
				icon: "ph-lightbulb ph-bold ph-lg",
				to: "/about-firefish",
			},
			{
				type: "button",
				text: i18n.ts.tos,
				icon: "ph-scroll ph-bold ph-lg",
				action: () => {
					window.open(instance.tosUrl, "_blank");
				},
			},
			{
				type: "button",
				text: i18n.ts.apps,
				icon: "ph-device-mobile ph-bold ph-lg",
				action: () => {
					window.open("https://joinfirefish.org/apps", "_blank");
				},
			},
			{
				type: "button",
				action: async () => {
					defaultStore.set("tutorial", 0);
					os.popup(XTutorial, {}, {}, "closed");
				},
				text: i18n.ts.replayTutorial,
				icon: "ph-circle-wavy-question ph-bold ph-lg",
			},
			null,
			{
				type: "parent",
				text: i18n.ts.developer,
				icon: "ph-code ph-bold ph-lg",
				children: [
					{
						type: "link",
						to: "/api-console",
						text: "API Console",
						icon: "ph-terminal-window ph-bold ph-lg",
					},
					{
						text: i18n.ts.document,
						icon: "ph-file-doc ph-bold ph-lg",
						action: () => {
							window.open("/api-doc", "_blank");
						},
					},
					{
						type: "link",
						to: "/scratchpad",
						text: "AiScript Scratchpad",
						icon: "ph-scribble-loop ph-bold ph-lg",
					},
				],
			},
		],
		ev.currentTarget ?? ev.target,
	);
}
