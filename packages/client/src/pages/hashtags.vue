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
					<MkPagination
						:pagination="followingPagination"
						class="hashtags">
						<template #empty>
							You aren't following any hashtags.
						</template>

						<template #default="{ items }">
							<template v-for="tag in items">
								<MkHashtagSummary :tag="tag" />
							</template>	
						</template>
					</MkPagination>
				</swiper-slide>
				<swiper-slide>
					<MkPagination
						:pagination="blockingPagination"
						class="hashtags">
						<template #empty>
							You aren't blocking any hashtags.
						</template>
						<template #default="{ items }">
							<template v-for="tag in items">
								<MkHashtagSummary :tag="tag" />
							</template>	
						</template>
					</MkPagination>
				</swiper-slide>
			</swiper>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { Virtual } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/vue";
import MkHashtagSummary from "@/components/MkHashtagSummary.vue";
import MkPagination from "@/components/MkPagination.vue";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import { deviceKind } from "@/scripts/device-kind";
import { defaultStore } from "@/store";
import "swiper/scss";
import "swiper/scss/virtual";

const tabs = ["following", "blocking"];
let tab = $ref(tabs[0]);
watch($$(tab), () => syncSlide(tabs.indexOf(tab)));

const MOBILE_THRESHOLD = 500;
const isMobile = ref(
	deviceKind === "smartphone" || window.innerWidth <= MOBILE_THRESHOLD,
);
window.addEventListener("resize", () => {
	isMobile.value =
		deviceKind === "smartphone" || window.innerWidth <= MOBILE_THRESHOLD;
});

const followingPagination = {
	endpoint: "hashtags/following" as const,
	limit: 10
};

const blockingPagination = {
	endpoint: "hashtags/blocking" as const,
	limit: 10
};

const headerActions = $computed(() =>
	[]
);

const headerTabs = $computed(() => [
	{
		key: "following",
		title: i18n.ts.following,
		icon: "ph-bell ph-bold ph-lg",
	},
	{
		key: "blocking",
		title: i18n.ts.blocked,
		icon: "ph-circle-wavy-warning ph-bold ph-lg",
	}
]);

definePageMetadata(
	computed(() => ({
		title: i18n.ts.hashtags,
		icon: "ph-hash ph-bold ph-lg",
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
