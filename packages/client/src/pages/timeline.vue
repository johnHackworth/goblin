<template>
	<MkStickyContainer>
		<template #header>
			<MkPageHeader
				v-model:tab="src"
				:actions="headerActions"
				:tabs="headerTabs"
				:display-my-avatar="true"
			/>
		</template>
		<MkSpacer :content-max="800">
			<div ref="rootEl" v-hotkey.global="keymap" class="cmuxhskf">
				<XPostForm
					v-if="$store.reactiveState.showFixedPostForm.value"
					class="post-form _block"
					fixed
				/>
				<!-- <div v-if="!isMobile" class="tl _block">
				<XTimeline
					ref="tl"
					:key="src"
					class="tl"
					:src="src"
					:sound="true"
					@queue="queueUpdated"
				/>
			</div> *v-else on next div* -->
				<div class="tl _block">
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
						<swiper-slide
							v-for="index in timelines"
							:key="index"
							:virtual-index="index"
						>
							<XTimeline
								v-if="index == timelines[swiperRef.activeIndex]"
								ref="tl"
								:key="src"
								class="tl"
								:src="src"
								:sound="true"
							/>
						</swiper-slide>
					</swiper>
				</div>
			</div>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from "vue";
import { Virtual } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/vue";
import XTutorial from "@/components/MkTutorialDialog.vue";
import XTimeline from "@/components/MkTimeline.vue";
import XPostForm from "@/components/MkPostForm.vue";
import * as os from "@/os";
import { defaultStore } from "@/store";
import { i18n } from "@/i18n";
import { instance } from "@/instance";
import { $i } from "@/account";
import { definePageMetadata } from "@/scripts/page-metadata";
import { deviceKind } from "@/scripts/device-kind";
import "swiper/scss";
import "swiper/scss/virtual";

if (defaultStore.reactiveState.tutorial.value !== -1) {
	os.popup(XTutorial, {}, {}, "closed");
}

const isLocalTimelineAvailable =
	!instance.disableLocalTimeline ||
	($i != null && ($i.isModerator || $i.isAdmin));
const isRecommendedTimelineAvailable = !instance.disableRecommendedTimeline;
const isGlobalTimelineAvailable =
	!instance.disableGlobalTimeline ||
	($i != null && ($i.isModerator || $i.isAdmin));
const keymap = {
	t: focus,
};

let timelines = ["home"];

if (isLocalTimelineAvailable) {
	timelines.push("local");
}
if (isLocalTimelineAvailable) {
	timelines.push("social");
}
if (isRecommendedTimelineAvailable) {
	timelines.push("recommended");
}
if (isGlobalTimelineAvailable) {
	timelines.push("global");
}

const MOBILE_THRESHOLD = 500;

// デスクトップでウィンドウを狭くしたときモバイルUIが表示されて欲しいことはあるので deviceKind === 'desktop' の判定は行わない
const isMobile = ref(
	deviceKind === "smartphone" || window.innerWidth <= MOBILE_THRESHOLD,
);
window.addEventListener("resize", () => {
	isMobile.value =
		deviceKind === "smartphone" || window.innerWidth <= MOBILE_THRESHOLD;
});

const tlComponent = $ref<InstanceType<typeof XTimeline>>();
const rootEl = $ref<HTMLElement>();

const src = $computed({
	get: () => defaultStore.reactiveState.tl.value.src,
	set: (x) => {
		saveSrc(x);
		syncSlide(timelines.indexOf(x));
	},
});

const lists = os.api("users/lists/list");
async function chooseList(ev: MouseEvent) {
	await lists.then((res) => {
		const items = [
			{
				type: "link" as const,
				text: i18n.ts.manageLists,
				icon: "ph-faders-horizontal ph-bold ph-lg",
				to: "/my/lists",
			},
		].concat(
			res.map((list) => ({
				type: "link" as const,
				text: list.name,
				icon: "",
				to: `/timeline/list/${list.id}`,
			})),
		);
		os.popupMenu(items, ev.currentTarget ?? ev.target);
	});
}

const antennas = os.api("antennas/list");
async function chooseAntenna(ev: MouseEvent) {
	await antennas.then((res) => {
		const items = [
			{
				type: "link" as const,
				indicate: false,
				text: i18n.ts.manageAntennas,
				icon: "ph-faders-horizontal ph-bold ph-lg",
				to: "/my/antennas",
			},
		].concat(
			res.map((antenna) => ({
				type: "link" as const,
				text: antenna.name,
				icon: "",
				indicate: antenna.hasUnreadNote,
				to: `/timeline/antenna/${antenna.id}`,
			})),
		);
		os.popupMenu(items, ev.currentTarget ?? ev.target);
	});
}

function saveSrc(
	newSrc: "home" | "local" | "social" | "recommended" | "global",
): void {
	defaultStore.set("tl", {
		...defaultStore.state.tl,
		src: newSrc,
	});
}

async function timetravel(): Promise<void> {
	const { canceled, result: date } = await os.inputDate({
		title: i18n.ts.date,
	});
	if (canceled) return;

	tlComponent.timetravel(date);
}

function focus(): void {
	tlComponent.focus();
}

const headerActions = $computed(() => [
	{
		icon: "ph-list-bullets ph-bold ph-lg",
		title: i18n.ts.lists,
		text: i18n.ts.lists,
		iconOnly: true,
		handler: chooseList,
	},
	{
		icon: "ph-flying-saucer ph-bold ph-lg",
		title: i18n.ts.antennas,
		text: i18n.ts.antennas,
		iconOnly: true,
		handler: chooseAntenna,
	} /* **TODO: fix timetravel** {
	icon: 'ph-calendar-blank ph-bold ph-lg',
	title: i18n.ts.jumpToSpecifiedDate,
	iconOnly: true,
	handler: timetravel,
}*/,
]);

const headerTabs = $computed(() => [
	{
		key: "home",
		title: i18n.ts._timelines.home,
		icon: "ph-house ph-bold ph-lg",
		iconOnly: true,
	},
	...(isLocalTimelineAvailable
		? [
				{
					key: "local",
					title: i18n.ts._timelines.local,
					icon: "ph-users ph-bold ph-lg",
					iconOnly: true,
				},
		  ]
		: []),
	...(isLocalTimelineAvailable
		? [
				{
					key: "social",
					title: i18n.ts._timelines.social,
					icon: "ph-handshake ph-bold ph-lg",
					iconOnly: true,
				},
		  ]
		: []),
	...(isRecommendedTimelineAvailable
		? [
				{
					key: "recommended",
					title: i18n.ts._timelines.recommended,
					icon: "ph-thumbs-up ph-bold ph-lg",
					iconOnly: true,
				},
		  ]
		: []),
	...(isGlobalTimelineAvailable
		? [
				{
					key: "global",
					title: i18n.ts._timelines.global,
					icon: "ph-planet ph-bold ph-lg",
					iconOnly: true,
				},
		  ]
		: []),
]);

definePageMetadata(
	computed(() => ({
		title: i18n.ts.timeline,
		icon:
			src === "local"
				? "ph-users ph-bold ph-lg"
				: src === "social"
				? "ph-handshake ph-bold ph-lg"
				: src === "recommended"
				? "ph-thumbs-up ph-bold ph-lg"
				: src === "global"
				? "ph-planet ph-bold ph-lg"
				: "ph-house ph-bold ph-lg",
	})),
);

let swiperRef: any = null;

function setSwiperRef(swiper) {
	swiperRef = swiper;
	syncSlide(timelines.indexOf(src));
}

function onSlideChange() {
	saveSrc(timelines[swiperRef.activeIndex]);
}

function syncSlide(index) {
	swiperRef.slideTo(index);
}

onMounted(() => {
	syncSlide(timelines.indexOf(swiperRef.activeIndex));
});
</script>

<style lang="scss" scoped>
.cmuxhskf {
	--swiper-theme-color: var(--accent);
	> .tl {
		background: none;
	}
}
</style>
