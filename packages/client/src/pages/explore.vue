<template>
	<MkStickyContainer>
		<template #header
			><MkPageHeader
				v-model:tab="tab"
				:actions="headerActions"
				:tabs="headerTabs"
		/></template>
		<div class="lznhrdub">
			<MkSpacer :content-max="1200">
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
						<XUsers />
					</swiper-slide>
					<swiper-slide>
						<XFeatured />
					</swiper-slide>
				</swiper>
			</MkSpacer>
		</div>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch, onMounted } from "vue";
import { Virtual } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/vue";
import XFeatured from "./explore.featured.vue";
import XUsers from "./explore.users.vue";
import { definePageMetadata } from "@/scripts/page-metadata";
import { deviceKind } from "@/scripts/device-kind";
import { i18n } from "@/i18n";
import { defaultStore } from "@/store";
import "swiper/scss";
import "swiper/scss/virtual";

const tabs = ["users", "featured"];
let tab = $ref(tabs[0]);
watch($$(tab), () => syncSlide(tabs.indexOf(tab)));

const headerActions = $computed(() => []);

const headerTabs = $computed(() => [
	{
		key: "users",
		icon: "ph-users ph-bold ph-lg",
		title: i18n.ts.users,
	},
	{
		key: "featured",
		icon: "ph-lightning ph-bold ph-lg",
		title: i18n.ts.featured,
	},
]);

definePageMetadata(
	computed(() => ({
		title: i18n.ts.explore,
		icon: "ph-compass ph-bold ph-lg",
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

onMounted(() => {
	syncSlide(tabs.indexOf(swiperRef.activeIndex));
});
</script>
