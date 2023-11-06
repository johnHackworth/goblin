<template>
	<MkStickyContainer>
		<template #header
			><MkPageHeader
				:actions="headerActions"
				:tabs="headerTabs"
				:display-back-button="true"
		/></template>
		<MkSpacer :content-max="900" :margin-min="20" :margin-max="32">
			<div ref="el" class="vvcocwet" :class="{ wide: !narrow }">
				<div class="body">
					<div
						v-if="!narrow || currentPage?.route.name == null"
						class="nav"
					>
						<div class="baaadecd">
							<MkInfo v-if="emailNotConfigured" warn class="info"
								>{{ i18n.ts.emailNotConfiguredWarning }}
								<MkA to="/settings/email" class="_link">{{
									i18n.ts.configure
								}}</MkA></MkInfo
							>
							<MkSuperMenu
								:def="menuDef"
								:grid="narrow"
							></MkSuperMenu>
						</div>
					</div>
					<section
						v-if="!(narrow && currentPage?.route.name == null)"
						class="main"
					>
						<div class="bkzroven">
							<RouterView />
						</div>
					</section>
				</div>
			</div>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script setup lang="ts">
import {
	computed,
	defineAsyncComponent,
	inject,
	nextTick,
	onActivated,
	onMounted,
	onUnmounted,
	provide,
	ref,
	watch,
} from "vue";
import { i18n } from "@/i18n";
import MkInfo from "@/components/MkInfo.vue";
import MkSuperMenu from "@/components/MkSuperMenu.vue";
import { scroll } from "@/scripts/scroll";
import { signout, $i } from "@/account";
import { unisonReload } from "@/scripts/unison-reload";
import { instance } from "@/instance";
import { useRouter } from "@/router";
import {
	definePageMetadata,
	provideMetadataReceiver,
	setPageMetadata,
} from "@/scripts/page-metadata";
import * as os from "@/os";

const indexInfo = {
	title: i18n.ts.settings,
	icon: "ph-gear-six ph-bold ph-lg",
	hideHeader: true,
};
const INFO = ref(indexInfo);
const el = ref<HTMLElement | null>(null);
const childInfo = ref(null);

const router = useRouter();

let narrow = $ref(false);
const NARROW_THRESHOLD = 600;

let currentPage = $computed(() => router.currentRef.value.child);

const ro = new ResizeObserver((entries, observer) => {
	if (entries.length === 0) return;
	narrow = entries[0].borderBoxSize[0].inlineSize < NARROW_THRESHOLD;
});

const menuDef = computed(() => [
	{
		title: i18n.ts.basicSettings,
		items: [
			{
				icon: "ph-user ph-bold ph-lg",
				text: i18n.ts.profile,
				to: "/settings/profile",
				active: currentPage?.route.name === "profile",
			},
			{
				icon: "ph-keyhole ph-bold ph-lg",
				text: i18n.ts.privacy,
				to: "/settings/privacy",
				active: currentPage?.route.name === "privacy",
			},
			{
				icon: "ph-smiley ph-bold ph-lg",
				text: i18n.ts.reaction,
				to: "/settings/reaction",
				active: currentPage?.route.name === "reaction",
			},
			{
				icon: "ph-cloud ph-bold ph-lg",
				text: i18n.ts.drive,
				to: "/settings/drive",
				active: currentPage?.route.name === "drive",
			},
			{
				icon: "ph-bell ph-bold ph-lg",
				text: i18n.ts.notifications,
				to: "/settings/notifications",
				active: currentPage?.route.name === "notifications",
			},
			{
				icon: "ph-envelope-simple-open ph-bold ph-lg",
				text: i18n.ts.email,
				to: "/settings/email",
				active: currentPage?.route.name === "email",
			},
			{
				icon: "ph-share-network ph-bold ph-lg",
				text: i18n.ts.integration,
				to: "/settings/integration",
				active: currentPage?.route.name === "integration",
			},
			{
				icon: "ph-lock ph-bold ph-lg",
				text: i18n.ts.security,
				to: "/settings/security",
				active: currentPage?.route.name === "security",
			},
		],
	},
	{
		title: i18n.ts.clientSettings,
		items: [
			{
				icon: "ph-gear-six ph-bold ph-lg",
				text: i18n.ts.general,
				to: "/settings/general",
				active: currentPage?.route.name === "general",
			},
			{
				icon: "ph-palette ph-bold ph-lg",
				text: i18n.ts.theme,
				to: "/settings/theme",
				active: currentPage?.route.name === "theme",
			},
			{
				icon: "ph-list ph-bold ph-lg",
				text: i18n.ts.navbar,
				to: "/settings/navbar",
				active: currentPage?.route.name === "navbar",
			},
			{
				icon: "ph-traffic-signal ph-bold ph-lg",
				text: i18n.ts.statusbar,
				to: "/settings/statusbar",
				active: currentPage?.route.name === "statusbar",
			},
			{
				icon: "ph-speaker-high ph-bold ph-lg",
				text: i18n.ts.sounds,
				to: "/settings/sounds",
				active: currentPage?.route.name === "sounds",
			},
			{
				icon: "ph-plug ph-bold ph-lg",
				text: i18n.ts.plugins,
				to: "/settings/plugin",
				active: currentPage?.route.name === "plugin",
			},
		],
	},
	{
		title: i18n.ts.otherSettings,
		items: [
			{
				icon: "ph-airplane-takeoff ph-bold ph-lg",
				text: i18n.ts.migration,
				to: "/settings/migration",
				active: currentPage?.route.name === "migration",
			},
			{
				icon: "ph-package ph-bold ph-lg",
				text: i18n.ts.importAndExport,
				to: "/settings/import-export",
				active: currentPage?.route.name === "import-export",
			},
			{
				icon: "ph-speaker-none ph-bold ph-lg",
				text: i18n.ts.instanceMute,
				to: "/settings/instance-mute",
				active: currentPage?.route.name === "instance-mute",
			},
			{
				icon: "ph-prohibit ph-bold ph-lg",
				text: i18n.ts.muteAndBlock,
				to: "/settings/mute-block",
				active: currentPage?.route.name === "mute-block",
			},
			{
				icon: "ph-speaker-x ph-bold ph-lg",
				text: i18n.ts.wordMute,
				to: "/settings/word-mute",
				active: currentPage?.route.name === "word-mute",
			},
			{
				icon: "ph-key ph-bold ph-lg",
				text: "API",
				to: "/settings/api",
				active: currentPage?.route.name === "api",
			},
			{
				icon: "ph-webhooks-logo ph-bold ph-lg",
				text: "Webhook",
				to: "/settings/webhook",
				active: currentPage?.route.name === "webhook",
			},
			{
				icon: "ph-dots-three-outline ph-bold ph-lg",
				text: i18n.ts.other,
				to: "/settings/other",
				active: currentPage?.route.name === "other",
			},
		],
	},
	{
		items: [
			{
				icon: "ph-floppy-disk ph-bold ph-lg",
				text: i18n.ts.preferencesBackups,
				to: "/settings/preferences-backups",
				active: currentPage?.route.name === "preferences-backups",
			},
			{
				type: "button",
				icon: "ph-trash ph-bold ph-lg",
				text: i18n.ts.clearCache,
				action: () => {
					localStorage.removeItem("locale");
					localStorage.removeItem("theme");
					unisonReload();
				},
			},
			{
				type: "button",
				icon: "ph-sign-in ph-bold ph-lg fa-flip-horizontal",
				text: i18n.ts.logout,
				action: async () => {
					const { canceled } = await os.confirm({
						type: "warning",
						text: i18n.ts.logoutConfirm,
					});
					if (canceled) return;
					signout();
				},
				danger: true,
			},
		],
	},
]);

watch($$(narrow), () => {});

onMounted(() => {
	ro.observe(el.value);

	narrow = el.value.offsetWidth < NARROW_THRESHOLD;

	if (!narrow && currentPage?.route.name == null) {
		router.replace("/settings/profile");
	}
});

onActivated(() => {
	narrow = el.value.offsetWidth < NARROW_THRESHOLD;

	if (!narrow && currentPage?.route.name == null) {
		router.replace("/settings/profile");
	}
});

onUnmounted(() => {
	ro.disconnect();
});

watch(router.currentRef, (to) => {
	if (
		to.route.name === "settings" &&
		to.child?.route.name == null &&
		!narrow
	) {
		router.replace("/settings/profile");
	}
});

const emailNotConfigured = computed(
	() => instance.enableEmail && ($i.email == null || !$i.emailVerified),
);

provideMetadataReceiver((info) => {
	if (info == null) {
		childInfo.value = null;
	} else {
		childInfo.value = info;
	}
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(INFO);
// w 890
// h 700
</script>

<style lang="scss" scoped>
.vvcocwet {
	> .body {
		.wallpaper & {
			background: var(--bg);
			color: var(--navFg);
			padding: var(--margin);
			border-radius: var(--radius);
		}
		> .nav {
			.baaadecd {
				color: var(--navFg);

				> .info {
					margin: 16px 0;
				}
				> .accounts {
					> .avatar {
						display: block;
						width: 50px;
						height: 50px;
						margin: 8px auto 16px auto;
					}
				}
			}
		}

		> .main {
			.bkzroven {
			}
		}
	}

	&.wide {
		> .body {
			display: flex;
			height: 100%;

			> .nav {
				width: 34%;
				padding-right: 32px;
				box-sizing: border-box;
			}

			> .main {
				flex: 1;
				min-width: 0;
			}
		}
	}
}
</style>
