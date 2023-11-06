<template>
	<MkStickyContainer>
		<template #header
			><MkPageHeader
				v-model:tab="tab"
				:actions="headerActions"
				:tabs="headerTabs"
		/></template>
		<MkSpacer :content-max="600" :margin-min="16" :margin-max="32">
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
					<div class="cxqhhsmd _formRoot">
						<a
							class="_formBlock thumbnail"
							:href="file.url"
							target="_blank"
						>
							<MkDriveFileThumbnail
								class="thumbnail"
								:file="file"
								fit="contain"
							/>
						</a>
						<div class="_formBlock">
							<MkKeyValue
								:copy="file.type"
								oneline
								style="margin: 1em 0"
							>
								<template #key>MIME Type</template>
								<template #value
									><span class="_monospace">{{
										file.type
									}}</span></template
								>
							</MkKeyValue>
							<MkKeyValue oneline style="margin: 1em 0">
								<template #key>Size</template>
								<template #value
									><span class="_monospace">{{
										bytes(file.size)
									}}</span></template
								>
							</MkKeyValue>
							<MkKeyValue
								:copy="file.id"
								oneline
								style="margin: 1em 0"
							>
								<template #key>ID</template>
								<template #value
									><span class="_monospace">{{
										file.id
									}}</span></template
								>
							</MkKeyValue>
							<MkKeyValue
								:copy="file.md5"
								oneline
								style="margin: 1em 0"
							>
								<template #key>MD5</template>
								<template #value
									><span class="_monospace">{{
										file.md5
									}}</span></template
								>
							</MkKeyValue>
							<MkKeyValue oneline style="margin: 1em 0">
								<template #key>{{
									i18n.ts.createdAt
								}}</template>
								<template #value
									><span class="_monospace"
										><MkTime
											:time="file.createdAt"
											mode="detail"
											style="display: block" /></span
								></template>
							</MkKeyValue>
						</div>
						<MkA
							v-if="file.user"
							class="user"
							:to="`/user-info/${file.user.id}`"
						>
							<MkUserCardMini :user="file.user" />
						</MkA>
						<div class="_formBlock">
							<MkSwitch
								v-model="isSensitive"
								@update:modelValue="toggleIsSensitive"
								>NSFW</MkSwitch
							>
						</div>

						<div class="_formBlock">
							<MkButton danger @click="del"
								><i class="ph-trash ph-bold ph-lg"></i>
								{{ i18n.ts.delete }}</MkButton
							>
						</div>
					</div>
				</swiper-slide>
				<swiper-slide>
					<div v-if="info" class="_formRoot">
						<MkInfo v-if="!iAmAdmin" warn>{{
							i18n.ts.requireAdminForView
						}}</MkInfo>
						<MkKeyValue
							v-if="info.requestIp"
							class="_formBlock _monospace"
							:copy="info.requestIp"
							oneline
						>
							<template #key>IP</template>
							<template #value>{{ info.requestIp }}</template>
						</MkKeyValue>
						<FormSection v-if="info.requestHeaders">
							<template #label>Headers</template>
							<MkKeyValue
								v-for="(v, k) in info.requestHeaders"
								:key="k"
								class="_formBlock _monospace"
							>
								<template #key>{{ k }}</template>
								<template #value>{{ v }}</template>
							</MkKeyValue>
						</FormSection>
					</div>
				</swiper-slide>
				<swiper-slide>
					<div class="_formRoot">
						<MkObjectView v-if="info" tall :value="info">
						</MkObjectView>
					</div>
				</swiper-slide>
			</swiper>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch } from "vue";
import { Virtual } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/vue";
import MkButton from "@/components/MkButton.vue";
import MkSwitch from "@/components/form/switch.vue";
import MkObjectView from "@/components/MkObjectView.vue";
import MkDriveFileThumbnail from "@/components/MkDriveFileThumbnail.vue";
import MkKeyValue from "@/components/MkKeyValue.vue";
import FormSection from "@/components/form/section.vue";
import MkUserCardMini from "@/components/MkUserCardMini.vue";
import MkInfo from "@/components/MkInfo.vue";
import bytes from "@/filters/bytes";
import * as os from "@/os";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import { deviceKind } from "@/scripts/device-kind";
import { acct } from "@/filters/user";
import { iAmAdmin, iAmModerator } from "@/account";
import { defaultStore } from "@/store";
import "swiper/scss";
import "swiper/scss/virtual";

let tabs = ["overview"];
if (iAmModerator) tabs.push("ip");
tabs.push("raw");
let tab = $ref(tabs[0]);
watch($$(tab), () => syncSlide(tabs.indexOf(tab)));

let file: any = $ref(null);
let info: any = $ref(null);
let isSensitive: boolean = $ref(false);

const props = defineProps<{
	fileId: string;
}>();

async function fetch() {
	file = await os.api("drive/files/show", { fileId: props.fileId });
	info = await os.api("admin/drive/show-file", { fileId: props.fileId });
	isSensitive = file.isSensitive;
}

fetch();

async function del() {
	const { canceled } = await os.confirm({
		type: "warning",
		text: i18n.t("removeAreYouSure", { x: file.name }),
	});
	if (canceled) return;

	os.apiWithDialog("drive/files/delete", {
		fileId: file.id,
	});
}

async function toggleIsSensitive(v) {
	await os.api("drive/files/update", {
		fileId: props.fileId,
		isSensitive: v,
	});
	isSensitive = v;
}

const headerActions = $computed(() => [
	{
		text: i18n.ts.openInNewTab,
		icon: "ph-arrow-square-out ph-bold ph-lg",
		handler: () => {
			window.open(file.url, "_blank");
		},
	},
]);

const headerTabs = $computed(() => [
	{
		key: "overview",
		title: i18n.ts.overview,
		icon: "ph-info ph-bold ph-lg",
	},
	iAmModerator
		? {
				key: "ip",
				title: "IP",
				icon: "ph-receipt ph-bold ph-lg",
		  }
		: null,
	{
		key: "raw",
		title: "Raw data",
		icon: "ph-code ph-bold ph-lg",
	},
]);

definePageMetadata(
	computed(() => ({
		title: file ? i18n.ts.file + ": " + file.name : i18n.ts.file,
		icon: "ph-file ph-bold ph-lg",
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

<style lang="scss" scoped>
.cxqhhsmd {
	> .thumbnail {
		display: block;

		> .thumbnail {
			height: 300px;
			max-width: 100%;
		}
	}

	> .user {
		&:hover {
			text-decoration: none;
		}
	}
}
</style>
