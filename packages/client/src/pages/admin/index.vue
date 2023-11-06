<template>
	<div ref="el" class="hiyeyicy" :class="{ wide: !narrow }">
		<div v-if="!narrow || currentPage?.route.name == null" class="nav">
			<MkSpacer :content-max="700" :margin-min="16">
				<div class="lxpfedzu">
					<div class="banner">
						<img
							:src="$instance.iconUrl || '/favicon.ico'"
							alt=""
							class="icon"
						/>
					</div>

					<MkInfo
						v-if="thereIsUnresolvedAbuseReport"
						warn
						class="info"
						>{{ i18n.ts.thereIsUnresolvedAbuseReportWarning }}
						<MkA to="/admin/abuses" class="_link">{{
							i18n.ts.check
						}}</MkA></MkInfo
					>
					<MkInfo v-if="noMaintainerInformation" warn class="info"
						>{{ i18n.ts.noMaintainerInformationWarning }}
						<MkA to="/admin/settings" class="_link">{{
							i18n.ts.configure
						}}</MkA></MkInfo
					>
					<MkInfo v-if="noBotProtection" warn class="info"
						>{{ i18n.ts.noBotProtectionWarning }}
						<MkA to="/admin/security" class="_link">{{
							i18n.ts.configure
						}}</MkA></MkInfo
					>
					<MkInfo v-if="noEmailServer" warn class="info"
						>{{ i18n.ts.noEmailServerWarning }}
						<MkA to="/admin/email-settings" class="_link">{{
							i18n.ts.configure
						}}</MkA></MkInfo
					>
					<MkInfo v-if="updateAvailable" warn class="info"
						>{{ i18n.ts.updateAvailable }}
						<a
							href="https://git.joinfirefish.org/firefish/firefish/releases"
							target="_bank"
							class="_link"
							>{{ i18n.ts.check }}</a
						></MkInfo
					>

					<MkSuperMenu :def="menuDef" :grid="narrow"></MkSuperMenu>
				</div>
			</MkSpacer>
		</div>
		<div v-if="!(narrow && currentPage?.route.name == null)" class="main">
			<RouterView />
		</div>
	</div>
</template>

<script lang="ts" setup>
import {
	defineAsyncComponent,
	inject,
	nextTick,
	onMounted,
	onUnmounted,
	onActivated,
	provide,
	watch,
	ref,
} from "vue";
import { i18n } from "@/i18n";
import MkSuperMenu from "@/components/MkSuperMenu.vue";
import MkInfo from "@/components/MkInfo.vue";
import { scroll } from "@/scripts/scroll";
import { instance } from "@/instance";
import { version } from "@/config";
import { $i } from "@/account";
import * as os from "@/os";
import { lookupUser } from "@/scripts/lookup-user";
import { lookupFile } from "@/scripts/lookup-file";
import { lookupInstance } from "@/scripts/lookup-instance";
import { indexPosts } from "@/scripts/index-posts";
import { defaultStore } from "@/store";
import { useRouter } from "@/router";
import {
	definePageMetadata,
	provideMetadataReceiver,
	setPageMetadata,
} from "@/scripts/page-metadata";

const isEmpty = (x: string | null) => x == null || x === "";
const el = ref<HTMLElement | null>(null);
const router = useRouter();

const indexInfo = {
	title: i18n.ts.controlPanel,
	icon: "ph-gear-six ph-bold ph-lg",
	hideHeader: true,
};

provide("shouldOmitHeaderTitle", false);

let INFO = $ref(indexInfo);
let childInfo = $ref(null);
let narrow = $ref(false);
let view = $ref(null);
let pageProps = $ref({});
let noMaintainerInformation =
	isEmpty(instance.maintainerName) || isEmpty(instance.maintainerEmail);
let noBotProtection =
	!instance.disableRegistration &&
	!instance.enableHcaptcha &&
	!instance.enableRecaptcha;
let noEmailServer = !instance.enableEmail;
let thereIsUnresolvedAbuseReport = $ref(false);
let updateAvailable = $ref(false);
let currentPage = $computed(() => router.currentRef.value.child);

os.api("admin/abuse-user-reports", {
	state: "unresolved",
	limit: 1,
}).then((reports) => {
	if (reports?.length > 0) thereIsUnresolvedAbuseReport = true;
});

if (defaultStore.state.showAdminUpdates) {
	os.api("latest-version").then((res) => {
		const cleanRes = parseInt(res?.tag_name.replace(/[^0-9]/g, ""));
		const cleanVersion = parseInt(version.replace(/[^0-9]/g, ""));
		if (cleanRes > cleanVersion) {
			updateAvailable = true;
		}
	});
}

const NARROW_THRESHOLD = 600;
const ro = new ResizeObserver((entries, observer) => {
	if (entries.length === 0) return;
	narrow = entries[0].borderBoxSize[0].inlineSize < NARROW_THRESHOLD;
});

const menuDef = $computed(() => [
	{
		title: i18n.ts.quickAction,
		items: [
			{
				type: "button",
				icon: "ph-magnifying-glass ph-bold ph-lg",
				text: i18n.ts.lookup,
				action: lookup,
			},
			...(instance.disableRegistration
				? [
						{
							type: "button",
							icon: "ph-user-plus ph-bold ph-lg",
							text: i18n.ts.invite,
							action: invite,
						},
				  ]
				: []),
			...($i.isAdmin
				? [
						{
							type: "button",
							icon: "ph-list-magnifying-glass ph-bold ph-lg",
							text: i18n.ts.indexPosts,
							action: indexPosts,
						},
				  ]
				: []),
		],
	},
	{
		title: i18n.ts.administration,
		items: [
			{
				icon: "ph-gauge ph-bold ph-lg",
				text: i18n.ts.dashboard,
				to: "/admin/overview",
				active: currentPage?.route.name === "overview",
			},
			{
				icon: "ph-users ph-bold ph-lg",
				text: i18n.ts.users,
				to: "/admin/users",
				active: currentPage?.route.name === "users",
			},
			{
				icon: "ph-smiley ph-bold ph-lg",
				text: i18n.ts.customEmojis,
				to: "/admin/emojis",
				active: currentPage?.route.name === "emojis",
			},
			{
				icon: "ph-planet ph-bold ph-lg",
				text: i18n.ts.federation,
				to: "/admin/federation",
				active: currentPage?.route.name === "federation",
			},
			{
				icon: "ph-queue ph-bold ph-lg",
				text: i18n.ts.jobQueue,
				to: "/admin/queue",
				active: currentPage?.route.name === "queue",
			},
			{
				icon: "ph-cloud ph-bold ph-lg",
				text: i18n.ts.files,
				to: "/admin/files",
				active: currentPage?.route.name === "files",
			},
			{
				icon: "ph-megaphone-simple ph-bold ph-lg",
				text: i18n.ts.announcements,
				to: "/admin/announcements",
				active: currentPage?.route.name === "announcements",
			},
			{
				icon: "ph-money ph-bold ph-lg",
				text: i18n.ts.ads,
				to: "/admin/ads",
				active: currentPage?.route.name === "ads",
			},
			{
				icon: "ph-warning-circle ph-bold ph-lg",
				text: i18n.ts.abuseReports,
				to: "/admin/abuses",
				active: currentPage?.route.name === "abuses",
			},
		],
	},
	...($i?.isAdmin
		? [
				{
					title: i18n.ts.settings,
					items: [
						{
							icon: "ph-gear-six ph-bold ph-lg",
							text: i18n.ts.general,
							to: "/admin/settings",
							active: currentPage?.route.name === "settings",
						},
						{
							icon: "ph-envelope-simple-open ph-bold ph-lg",
							text: i18n.ts.emailServer,
							to: "/admin/email-settings",
							active:
								currentPage?.route.name === "email-settings",
						},
						{
							icon: "ph-cloud ph-bold ph-lg",
							text: i18n.ts.objectStorage,
							to: "/admin/object-storage",
							active:
								currentPage?.route.name === "object-storage",
						},
						{
							icon: "ph-lock ph-bold ph-lg",
							text: i18n.ts.security,
							to: "/admin/security",
							active: currentPage?.route.name === "security",
						},
						{
							icon: "ph-arrows-merge ph-bold ph-lg",
							text: i18n.ts.relays,
							to: "/admin/relays",
							active: currentPage?.route.name === "relays",
						},
						{
							icon: "ph-plug ph-bold ph-lg",
							text: i18n.ts.integration,
							to: "/admin/integrations",
							active: currentPage?.route.name === "integrations",
						},
						{
							icon: "ph-prohibit ph-bold ph-lg",
							text: i18n.ts.instanceBlocking,
							to: "/admin/instance-block",
							active:
								currentPage?.route.name === "instance-block",
						},
						{
							icon: "ph-hash ph-bold ph-lg",
							text: i18n.ts.hiddenTags,
							to: "/admin/hashtags",
							active: currentPage?.route.name === "hashtags",
						},
						{
							icon: "ph-ghost ph-bold ph-lg",
							text: i18n.ts.proxyAccount,
							to: "/admin/proxy-account",
							active: currentPage?.route.name === "proxy-account",
						},
						{
							icon: "ph-database ph-bold ph-lg",
							text: i18n.ts.database,
							to: "/admin/database",
							active: currentPage?.route.name === "database",
						},
						{
							icon: "ph-flask ph-bold ph-lg",
							text: i18n.ts._experiments.title,
							to: "/admin/experiments",
							active: currentPage?.route.name === "experiments",
						},
					],
				},
		  ]
		: []),
]);

watch(narrow, () => {
	if (currentPage?.route.name == null && !narrow) {
		router.push("/admin/overview");
	}
});

onMounted(() => {
	ro.observe(el.value);

	narrow = el.value.offsetWidth < NARROW_THRESHOLD;
	if (currentPage?.route.name == null && !narrow) {
		router.push("/admin/overview");
	}
});

onActivated(() => {
	narrow = el.value.offsetWidth < NARROW_THRESHOLD;

	if (!narrow && currentPage?.route.name == null) {
		router.replace("/admin/overview");
	}
});

onUnmounted(() => {
	ro.disconnect();
});

watch(router.currentRef, (to) => {
	if (to.route.path === "/admin" && to.child?.route.name == null && !narrow) {
		router.replace("/admin/overview");
	}
});

provideMetadataReceiver((info) => {
	if (info == null) {
		childInfo = null;
	} else {
		childInfo = info;
	}
});

const invite = () => {
	os.api("admin/invite")
		.then((x) => {
			os.alert({
				type: "info",
				text: x.code,
			});
		})
		.catch((err) => {
			os.alert({
				type: "error",
				text: err,
			});
		});
};

async function lookupNote() {
	const { canceled, result: q } = await os.inputText({
		title: i18n.ts.noteId,
	});
	if (canceled) return;

	os.api(
		"notes/show",
		q.startsWith("http://") || q.startsWith("https://")
			? { url: q.trim() }
			: { noteId: q.trim() },
	)
		.then((note) => {
			os.pageWindow(`/notes/${note.id}`);
		})
		.catch((err) => {
			if (err.code === "NO_SUCH_NOTE") {
				os.alert({
					type: "error",
					text: i18n.ts.notFound,
				});
			}
		});
}

const lookup = (ev) => {
	os.popupMenu(
		[
			{
				text: i18n.ts.user,
				icon: "ph-user ph-bold ph-lg",
				action: () => {
					lookupUser();
				},
			},
			{
				text: i18n.ts.note,
				icon: "ph-pencil ph-bold ph-lg",
				action: () => {
					lookupNote();
				},
			},
			{
				text: i18n.ts.file,
				icon: "ph-cloud ph-bold ph-lg",
				action: () => {
					lookupFile();
				},
			},
			{
				text: i18n.ts.instance,
				icon: "ph-planet ph-bold ph-lg",
				action: () => {
					lookupInstance();
				},
			},
		],
		ev.currentTarget ?? ev.target,
	);
};

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(INFO);

defineExpose({
	header: {
		title: i18n.ts.controlPanel,
	},
});
</script>

<style lang="scss" scoped>
.hiyeyicy {
	&.wide {
		display: flex;
		margin: 0 auto;
		height: 100%;

		> .nav {
			width: 32%;
			max-width: 280px;
			box-sizing: border-box;
			border-right: solid 0.5px var(--divider);
			overflow: auto;
			height: 100%;
		}

		> .main {
			flex: 1;
			min-width: 0;
		}
	}

	> .nav {
		.lxpfedzu {
			> .info {
				margin: 16px 0;
			}

			> .banner {
				margin: 16px;

				> .icon {
					display: block;
					margin: auto;
					height: 42px;
					border-radius: 8px;
				}
			}
		}
	}
}
</style>
