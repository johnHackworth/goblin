<template>
	<div class="mk-app">
		<div v-if="!narrow && !root" class="side">
			<XKanban class="kanban" full />
		</div>

		<div class="main">
			<XKanban v-if="narrow && !root" class="banner" :powered-by="root" />

			<div class="contents">
				<XHeader v-if="!root" class="header" :info="pageInfo" />
				<main>
					<RouterView />
				</main>
				<div v-if="!root" class="powered-by">
					<b
						><MkA to="/">{{ host }}</MkA></b
					>
					<small
						>Powered by
						<a href="https://joinfirefish.org/" target="_blank"
							>Firefish</a
						></small
					>
				</div>
			</div>
		</div>

		<transition :name="$store.state.animation ? 'tray-back' : ''">
			<div
				v-if="showMenu"
				class="menu-back _modalBg"
				@click="showMenu = false"
				@touchstart.passive="showMenu = false"
			></div>
		</transition>

		<transition :name="$store.state.animation ? 'tray' : ''">
			<div v-if="showMenu" class="menu">
				<MkA to="/" class="link" active-class="active"
					><i class="ph-house ph-bold ph-lg icon"></i
					>{{ i18n.ts.home }}</MkA
				>
				<MkA to="/explore" class="link" active-class="active"
					><i class="ph-compass ph-bold ph-lg icon"></i
					>{{ i18n.ts.explore }}</MkA
				>
				<MkA to="/channels" class="link" active-class="active"
					><i class="ph-television ph-bold ph-lg icon"></i
					>{{ i18n.ts.channel }}</MkA
				>
				<MkA to="/pages" class="link" active-class="active"
					><i class="ph-file-text ph-bold ph-lg icon"></i
					>{{ i18n.ts.pages }}</MkA
				>
				<MkA to="/gallery" class="link" active-class="active"
					><i class="ph-image-square ph-bold ph-lg icon"></i
					>{{ i18n.ts.gallery }}</MkA
				>
				<div class="action">
					<button class="_buttonPrimary" @click="signup()">
						{{ i18n.ts.signup }}
					</button>
					<button class="_button" @click="signin()">
						{{ i18n.ts.login }}
					</button>
				</div>
			</div>
		</transition>
	</div>
</template>

<script lang="ts" setup>
import type { ComputedRef } from "vue";
import { onMounted, provide } from "vue";
import XHeader from "./header.vue";
import XKanban from "./kanban.vue";
import { host, instanceName } from "@/config";
import { search } from "@/scripts/search";
import * as os from "@/os";
import { instance } from "@/instance";
import MkPagination from "@/components/MkPagination.vue";
import XSigninDialog from "@/components/MkSigninDialog.vue";
import XSignupDialog from "@/components/MkSignupDialog.vue";
import MkButton from "@/components/MkButton.vue";
import { ColdDeviceStorage, defaultStore } from "@/store";
import { mainRouter } from "@/router";
import type { PageMetadata } from "@/scripts/page-metadata";
import {
	provideMetadataReceiver,
	setPageMetadata,
} from "@/scripts/page-metadata";
import { i18n } from "@/i18n";

const DESKTOP_THRESHOLD = 1000;

let pageMetadata = $ref<null | ComputedRef<PageMetadata>>();

provide("router", mainRouter);
provideMetadataReceiver((info) => {
	pageMetadata = info;
	if (pageMetadata.value) {
		document.title = `${pageMetadata.value.title} | ${instanceName}`;
	}
});

const announcements = {
	endpoint: "announcements",
	limit: 10,
};
const isTimelineAvailable =
	!instance.disableLocalTimeline ||
	!instance.disableRecommendedTimeline ||
	!instance.disableGlobalTimeline;
const showMenu = $ref(false);
let isDesktop = $ref(window.innerWidth >= DESKTOP_THRESHOLD),
	narrow = $ref(window.innerWidth < 1280),
	meta = $ref();

const keymap = $computed(() => {
	return {
		d: () => {
			if (ColdDeviceStorage.get("syncDeviceDarkMode")) return;
			defaultStore.set("darkMode", !defaultStore.state.darkMode);
		},
		s: search,
	};
});

const root = $computed(() => mainRouter.currentRoute.value.name === "index");

os.api("meta", { detail: true }).then((res) => {
	meta = res;
});

function signin() {
	os.popup(
		XSigninDialog,
		{
			autoSet: true,
		},
		{},
		"closed",
	);
}

function signup() {
	os.popup(
		XSignupDialog,
		{
			autoSet: true,
		},
		{},
		"closed",
	);
}

onMounted(() => {
	if (!isDesktop) {
		window.addEventListener(
			"resize",
			() => {
				if (window.innerWidth >= DESKTOP_THRESHOLD) isDesktop = true;
			},
			{ passive: true },
		);
	}
});

defineExpose({
	showMenu: $$(showMenu),
});
</script>

<style lang="scss" scoped>
.tray-enter-active,
.tray-leave-active {
	opacity: 1;
	transform: translateX(0);
	transition:
		transform 300ms cubic-bezier(0.23, 1, 0.32, 1),
		opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.tray-enter-from,
.tray-leave-active {
	opacity: 0;
	transform: translateX(-240px);
}

.tray-back-enter-active,
.tray-back-leave-active {
	opacity: 1;
	transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.tray-back-enter-from,
.tray-back-leave-active {
	opacity: 0;
}

.mk-app {
	display: flex;
	min-height: 100vh;
	background-position: center;
	background-size: cover;
	background-attachment: fixed;

	> .side {
		width: 500px;
		height: 100vh;

		> .kanban {
			position: fixed;
			top: 0;
			left: 0;
			width: 500px;
			height: 100vh;
			overflow: auto;
		}
	}

	> .main {
		flex: 1;
		min-width: 0;

		> .banner {
		}

		> .contents {
			position: relative;
			z-index: 1;

			> .powered-by {
				padding: 28px;
				font-size: 14px;
				text-align: center;
				border-top: 1px solid var(--divider);

				> small {
					display: block;
					margin-top: 8px;
					opacity: 0.5;
				}
			}
		}
	}

	> .menu-back {
		position: fixed;
		z-index: 1001;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
	}

	> .menu {
		position: fixed;
		z-index: 1001;
		top: 0;
		left: 0;
		width: 240px;
		height: 100vh;
		background: var(--panel);

		> .link {
			display: block;
			padding: 16px;

			> .icon {
				margin-right: 1em;
			}
		}

		> .action {
			padding: 16px;

			> button {
				display: block;
				width: 100%;
				padding: 10px;
				box-sizing: border-box;
				text-align: center;
				border-radius: 999px;

				&._button {
					background: var(--panel);
				}

				&:first-child {
					margin-bottom: 16px;
				}
			}
		}
	}
}
</style>
