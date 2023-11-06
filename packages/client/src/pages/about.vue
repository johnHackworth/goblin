<template>
	<MkStickyContainer>
		<template #header
			><MkPageHeader
				v-model:tab="tab"
				:actions="headerActions"
				:tabs="headerTabs"
		/></template>
		<MkSpacer :content-max="600" :margin-min="20">
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
					<div class="_formRoot">
						<div
							class="_formBlock fwhjspax"
							:style="{
								backgroundImage: `url(${$instance.bannerUrl})`,
							}"
						>
							<div class="content">
								<img
									ref="instanceIcon"
									:src="
										$instance.iconUrl ||
										$instance.faviconUrl ||
										'/favicon.ico'
									"
									aria-label="none"
									class="icon"
									:class="instanceIconAnimation"
									@click="easterEgg"
								/>
								<div class="name">
									<b>{{ $instance.name || host }}</b>
								</div>
							</div>
						</div>

						<MkKeyValue class="_formBlock">
							<template #key>{{ i18n.ts.description }}</template>
							<template #value
								><div v-html="$instance.description"></div
							></template>
						</MkKeyValue>

						<FormSection>
							<MkKeyValue class="_formBlock" :copy="version">
								<template #key>Firefish</template>
								<template #value>{{ version }}</template>
							</MkKeyValue>
							<FormLink to="/about-firefish">{{
								i18n.ts.aboutFirefish
							}}</FormLink>
						</FormSection>

						<FormSection>
							<FormSplit>
								<MkKeyValue class="_formBlock">
									<template #key>{{
										i18n.ts.administrator
									}}</template>
									<template #value>{{
										$instance.maintainerName
									}}</template>
								</MkKeyValue>
								<MkKeyValue class="_formBlock">
									<template #key>{{
										i18n.ts.contact
									}}</template>
									<template #value>{{
										$instance.maintainerEmail
									}}</template>
								</MkKeyValue>
							</FormSplit>
							<FormLink
								v-if="$instance.tosUrl"
								:to="$instance.tosUrl"
								class="_formBlock"
								external
								>{{ i18n.ts.tos }}</FormLink
							>
							<FormLink
								v-if="$instance.donationLink"
								:to="$instance.donationLink"
								external
							>
								<template #icon
									><i class="ph-money ph-bold ph-lg"></i
								></template>
								{{
									i18n.t("_aboutFirefish.donateHost", {
										host: $instance.name || host,
									})
								}}
								<template #suffix>Donate</template>
							</FormLink>
						</FormSection>

						<FormSuspense :p="initStats">
							<FormSection>
								<template #label>{{
									i18n.ts.statistics
								}}</template>
								<FormSplit>
									<MkKeyValue class="_formBlock">
										<template #key>{{
											i18n.ts.users
										}}</template>
										<template #value>{{
											number(stats.originalUsersCount)
										}}</template>
									</MkKeyValue>
									<MkKeyValue class="_formBlock">
										<template #key>{{
											i18n.ts.notes
										}}</template>
										<template #value>{{
											number(stats.originalNotesCount)
										}}</template>
									</MkKeyValue>
								</FormSplit>
							</FormSection>
						</FormSuspense>

						<FormSection>
							<template #label>Well-known resources</template>
							<div class="_formLinks">
								<FormLink
									:to="`/.well-known/host-meta`"
									external
									>host-meta</FormLink
								>
								<FormLink
									:to="`/.well-known/host-meta.json`"
									external
									>host-meta.json</FormLink
								>
								<FormLink :to="`/.well-known/nodeinfo`" external
									>nodeinfo</FormLink
								>
								<FormLink :to="`/robots.txt`" external
									>robots.txt</FormLink
								>
								<FormLink :to="`/manifest.json`" external
									>manifest.json</FormLink
								>
							</div>
						</FormSection>
					</div>
				</swiper-slide>
				<swiper-slide>
					<XEmojis />
				</swiper-slide>
				<swiper-slide>
					<MkInstanceStats :chart-limit="500" :detailed="true" />
				</swiper-slide>
				<swiper-slide>
					<XFederation />
				</swiper-slide>
			</swiper>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from "vue";
import { Virtual } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/vue";
import XEmojis from "./about.emojis.vue";
import XFederation from "./about.federation.vue";
import { version, instanceName, host } from "@/config";
import FormLink from "@/components/form/link.vue";
import FormSection from "@/components/form/section.vue";
import FormSuspense from "@/components/form/suspense.vue";
import FormSplit from "@/components/form/split.vue";
import MkKeyValue from "@/components/MkKeyValue.vue";
import MkInstanceStats from "@/components/MkInstanceStats.vue";
import * as os from "@/os";
import number from "@/filters/number";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import { deviceKind } from "@/scripts/device-kind";
import { iAmModerator } from "@/account";
import { instance } from "@/instance";
import { defaultStore } from "@/store";
import "swiper/scss";
import "swiper/scss/virtual";

withDefaults(
	defineProps<{
		initialTab?: string;
	}>(),
	{
		initialTab: "overview",
	},
);

let stats = $ref(null);
let instanceIcon = $ref<HTMLImageElement>();
let instanceIconAnimation = "none";
let iconClicks = 0;
let tabs = ["overview", "emojis", "charts"];
let tab = $ref(tabs[0]);
watch($$(tab), () => syncSlide(tabs.indexOf(tab)));

if (iAmModerator) tabs.push("federation");

const initStats = () =>
	os.api("stats", {}).then((res) => {
		stats = res;
	});

const headerActions = $computed(() => []);

let theTabs = [
	{
		key: "overview",
		title: i18n.ts.overview,
		icon: "ph-map-trifold ph-bold ph-lg",
	},
	{
		key: "emojis",
		title: i18n.ts.customEmojis,
		icon: "ph-smiley ph-bold ph-lg",
	},
	{
		key: "charts",
		title: i18n.ts.charts,
		icon: "ph-chart-bar ph-bold ph-lg",
	},
];

if (iAmModerator) {
	theTabs.push({
		key: "federation",
		title: i18n.ts.federation,
		icon: "ph-planet ph-bold ph-lg",
	});
}

let headerTabs = $computed(() => theTabs);

definePageMetadata(
	computed(() => ({
		title: i18n.ts.instanceInfo,
		icon: "ph-info ph-bold ph-lg",
	})),
);

async function sleep(seconds) {
	return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

onMounted(() => {
	if (defaultStore.state.woozyMode) {
		instanceIcon.src = "/static-assets/woozy.png";
	}
});

function easterEgg() {
	iconClicks++;
	instanceIconAnimation = "noAnimation";
	console.log(instanceIconAnimation);
	sleep(0.1);
	const normalizedCount = (iconClicks % 3) + 1;
	instanceIconAnimation = `shake${normalizedCount}`;
	if (iconClicks % 3 === 0) {
		defaultStore.state.woozyMode = !defaultStore.state.woozyMode;
		sleep(0.4);
		instanceIconAnimation = "noAnimation";
		instanceIconAnimation = "doSpinY";
		console.log(instanceIconAnimation);
		if (iconClicks % 6 === 0) {
			instanceIcon.src =
				instance.iconUrl || instance.faviconUrl || "/favicon.ico";
		} else {
			instanceIcon.src = "/static-assets/woozy.png";
		}
	}
}

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

<style lang="scss" scoped>
@keyframes iconShake1 {
	0% {
		transform: translate(2px, 0px) rotate(-1deg);
	}
	10% {
		transform: translate(2px, -3px) rotate(5deg);
	}
	20% {
		transform: translate(-1px, -3px) rotate(3deg);
	}
	30% {
		transform: translate(-2px, 0px) rotate(-1deg);
	}
	40% {
		transform: translate(-2px, -1px) rotate(4deg);
	}
	50% {
		transform: translate(-1px, -1px) rotate(1deg);
	}
	60% {
		transform: translate(-2px, 0px) rotate(-8deg);
	}
	70% {
		transform: translate(1px, 2px) rotate(-2deg);
	}
	80% {
		transform: translate(-1px, 2px) rotate(4deg);
	}
	90% {
		transform: translate(-1px, 1px) rotate(11deg);
	}
	100% {
		transform: translate(-3px, -3px) rotate(-5deg);
	}
}

@keyframes iconShake2 {
	0% {
		transform: translate(-1px, 5px) rotate(33deg);
	}
	10% {
		transform: translate(-2px, 7px) rotate(20deg);
	}
	20% {
		transform: translate(8px, 5px) rotate(31deg);
	}
	30% {
		transform: translate(-2px, 5px) rotate(3deg);
	}
	40% {
		transform: translate(4px, 6px) rotate(16deg);
	}
	50% {
		transform: translate(8px, -3px) rotate(19deg);
	}
	60% {
		transform: translate(7px, -2px) rotate(0deg);
	}
	70% {
		transform: translate(4px, 4px) rotate(8deg);
	}
	80% {
		transform: translate(7px, -3px) rotate(13deg);
	}
	90% {
		transform: translate(6px, 7px) rotate(4deg);
	}
	100% {
		transform: translate(4px, -2px) rotate(-2deg);
	}
}

@keyframes iconShake3 {
	0% {
		transform: translate(12px, -2px) rotate(57deg);
	}
	10% {
		transform: translate(10px, 2px) rotate(12deg);
	}
	20% {
		transform: translate(10px, 4px) rotate(3deg);
	}
	30% {
		transform: translate(17px, 11px) rotate(15deg);
	}
	40% {
		transform: translate(12px, 20px) rotate(-11deg);
	}
	50% {
		transform: translate(5px, 12px) rotate(43deg);
	}
	60% {
		transform: translate(16px, 8px) rotate(-4deg);
	}
	70% {
		transform: translate(14px, 11px) rotate(22deg);
	}
	80% {
		transform: translate(9px, 19px) rotate(-3deg);
	}
	90% {
		transform: translate(0px, 12px) rotate(-3deg);
	}
	100% {
		transform: translate(17px, 3px) rotate(57deg);
	}
}

@keyframes spinY {
	0% {
		transform: perspective(128px) rotateY(0deg);
	}
	100% {
		transform: perspective(128px) rotateY(360deg);
	}
}

.fwhjspax {
	text-align: center;
	border-radius: 10px;
	overflow: clip;
	background-size: cover;
	background-position: center center;

	> .content {
		overflow: hidden;

		> .icon {
			display: block;
			margin: 16px auto 0 auto;
			height: 64px;
			border-radius: 8px;

			&.noAnimation {
				animation: none;
			}

			&.shake1 {
				animation: iconShake1 0.1s 1;
			}

			&.shake2 {
				animation: iconShake2 0.2s 1;
			}

			&.shake3 {
				animation: iconShake3 0.3s 1;
			}

			&.doSpinY {
				animation: spinY 0.9s 1;
			}
		}

		> .name {
			display: block;
			padding: 16px;
			color: #e0def4;
			text-shadow: 0 0 8px var(--shadow);
			background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
		}
	}
}
</style>
