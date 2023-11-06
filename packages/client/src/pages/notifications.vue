<template>
	<MkStickyContainer>
		<template #header>
			<MkPageHeader
				v-model:tab="tab"
				:actions="headerActions"
				:tabs="headerTabs"
				:display-my-avatar="true"
			/>
		</template>
		<MkSpacer :content-max="800">
			<swiper
				:round-lengths="true"
				:touch-angle="25"
				:threshold="10"
				:centeredSlides="true"
				:modules="[Virtual]"
				:space-between="20"
				:virtual="true"
				:allow-touch-move="
					defaultStore.state.swipeOnMobile &&
					(deviceKind !== 'desktop' ||
						defaultStore.state.swipeOnDesktop)
				"
				@swiper="setSwiperRef"
				@slide-change="onSlideChange"
			>
				<swiper-slide>
					<XNotifications
						class="notifications"
						:include-types="includeTypes"
						:unread-only="false"
					/>
				</swiper-slide>
				<swiper-slide>
					<XNotifications
						class="notifications"
						:include-types="includeTypes"
						:unread-only="true"
					/>
				</swiper-slide>
				<swiper-slide>
					<XNotes :pagination="mentionsPagination" />
				</swiper-slide>
				<swiper-slide>
					<XNotes :pagination="directNotesPagination" />
				</swiper-slide>
			</swiper>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { Virtual } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/vue";
import { notificationTypes } from "firefish-js";
import XNotifications from "@/components/MkNotifications.vue";
import XNotes from "@/components/MkNotes.vue";
import * as os from "@/os";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import { deviceKind } from "@/scripts/device-kind";
import { defaultStore } from "@/store";
import "swiper/scss";
import "swiper/scss/virtual";

const tabs = ["all", "unread", "mentions", "directNotes"];
let tab = $ref(tabs[0]);
watch($$(tab), () => syncSlide(tabs.indexOf(tab)));

let includeTypes = $ref<string[] | null>(null);
let unreadOnly = $computed(() => tab === "unread");
os.api("notifications/mark-all-as-read");

const MOBILE_THRESHOLD = 500;
const isMobile = ref(
	deviceKind === "smartphone" || window.innerWidth <= MOBILE_THRESHOLD,
);
window.addEventListener("resize", () => {
	isMobile.value =
		deviceKind === "smartphone" || window.innerWidth <= MOBILE_THRESHOLD;
});

const mentionsPagination = {
	endpoint: "notes/mentions" as const,
	limit: 10,
};

const directNotesPagination = {
	endpoint: "notes/mentions" as const,
	limit: 10,
	params: {
		visibility: "specified",
	},
};

function setFilter(ev) {
	const typeItems = notificationTypes.map((t) => ({
		text: i18n.t(`_notification._types.${t}`),
		active: includeTypes && includeTypes.includes(t),
		action: () => {
			includeTypes = [t];
		},
	}));
	const items =
		includeTypes != null
			? [
					{
						icon: "ph-x ph-bold ph-lg",
						text: i18n.ts.clear,
						action: () => {
							includeTypes = null;
						},
					},
					null,
					...typeItems,
			  ]
			: typeItems;
	os.popupMenu(items, ev.currentTarget ?? ev.target);
}

const headerActions = $computed(() =>
	[
		tab === "all"
			? {
					text: i18n.ts.filter,
					icon: "ph-funnel ph-bold ph-lg",
					highlighted: includeTypes != null,
					handler: setFilter,
			  }
			: undefined,
		tab === "all"
			? {
					text: i18n.ts.markAllAsRead,
					icon: "ph-check ph-bold ph-lg",
					handler: () => {
						os.apiWithDialog("notifications/mark-all-as-read");
					},
			  }
			: undefined,
	].filter((x) => x !== undefined),
);

const headerTabs = $computed(() => [
	{
		key: "all",
		title: i18n.ts.all,
		icon: "ph-bell ph-bold ph-lg",
	},
	{
		key: "unread",
		title: i18n.ts.unread,
		icon: "ph-circle-wavy-warning ph-bold ph-lg",
	},
	{
		key: "mentions",
		title: i18n.ts.mentions,
		icon: "ph-at ph-bold ph-lg",
	},
	{
		key: "directNotes",
		title: i18n.ts.directNotes,
		icon: "ph-envelope-simple-open ph-bold ph-lg",
	},
]);

definePageMetadata(
	computed(() => ({
		title: i18n.ts.notifications,
		icon: "ph-bell ph-bold ph-lg",
	})),
);

let swiperRef = null;

function setSwiperRef(swiper) {
	swiperRef = swiper;
	syncSlide(tabs.indexOf(tab));
}

function onSlideChange() {
	tab = tabs[swiperRef.activeIndex];
}

function syncSlide(index) {
	swiperRef.slideTo(index);
}
</script>
