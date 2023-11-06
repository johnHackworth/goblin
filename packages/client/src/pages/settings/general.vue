<template>
	<div class="_formRoot">
		<FormSelect v-model="lang" class="_formBlock">
			<template #label>{{ i18n.ts.uiLanguage }}</template>
			<option v-for="x in langs" :key="x[0]" :value="x[0]">
				{{ x[1] }}
			</option>
			<template #caption>
				<I18n :src="i18n.ts.i18nInfo" tag="span">
					<template #link>
						<MkLink url="https://hosted.weblate.org/engage/firefish/"
							>Weblate</MkLink
						>
					</template>
				</I18n>
			</template>
		</FormSelect>

		<FormRadios v-model="overridedDeviceKind" class="_formBlock">
			<template #label>{{ i18n.ts.overridedDeviceKind }}</template>
			<option :value="null">{{ i18n.ts.auto }}</option>
			<option value="smartphone">
				<i class="ph-device-mobile ph-bold ph-lg" />
				{{ i18n.ts.smartphone }}
			</option>
			<option value="tablet">
				<i class="ph-device-tablet ph-bold ph-lg" />
				{{ i18n.ts.tablet }}
			</option>
			<option value="desktop">
				<i class="ph-desktop ph-bold ph-lg" /> {{ i18n.ts.desktop }}
			</option>
		</FormRadios>

		<FormSection>
			<template #label>{{ i18n.ts.behavior }}</template>
			<FormSwitch v-model="imageNewTab" class="_formBlock">{{
				i18n.ts.openImageInNewTab
			}}</FormSwitch>
			<FormSwitch v-model="enableInfiniteScroll" class="_formBlock">{{
				i18n.ts.enableInfiniteScroll
			}}</FormSwitch>
			<FormSwitch
				v-model="useReactionPickerForContextMenu"
				class="_formBlock"
				>{{ i18n.ts.useReactionPickerForContextMenu }}</FormSwitch
			>
			<FormSwitch
				v-if="deviceKind !== 'desktop'"
				v-model="swipeOnMobile"
				class="_formBlock"
				>{{ i18n.ts.swipeOnMobile }}</FormSwitch
			>
			<FormSwitch
				v-if="deviceKind === 'desktop'"
				v-model="swipeOnDesktop"
				class="_formBlock"
				>{{ i18n.ts.swipeOnDesktop }}</FormSwitch
			>
			<FormSwitch v-model="enterSendsMessage" class="_formBlock">{{
				i18n.ts.enterSendsMessage
			}}</FormSwitch>
			<FormSwitch v-model="disablePagesScript" class="_formBlock">{{
				i18n.ts.disablePagesScript
			}}</FormSwitch>
			<FormSwitch v-model="showTimelineReplies" class="_formBlock"
				>{{ i18n.ts.flagShowTimelineReplies
				}}<template #caption
					>{{ i18n.ts.flagShowTimelineRepliesDescription }}
					{{ i18n.ts.reflectMayTakeTime }}</template
				></FormSwitch
			>

			<FormSelect v-model="serverDisconnectedBehavior" class="_formBlock">
				<template #label>{{ i18n.ts.whenServerDisconnected }}</template>
				<option value="reload">
					{{ i18n.ts._serverDisconnectedBehavior.reload }}
				</option>
				<option value="dialog">
					{{ i18n.ts._serverDisconnectedBehavior.dialog }}
				</option>
				<option value="quiet">
					{{ i18n.ts._serverDisconnectedBehavior.quiet }}
				</option>
				<option value="nothing">
					{{ i18n.ts._serverDisconnectedBehavior.nothing }}
				</option>
			</FormSelect>
		</FormSection>

		<FormSection>
			<template #label>{{ i18n.ts.accessibility }}</template>
			<FormSwitch v-model="expandOnNoteClick" class="_formBlock"
				>{{ i18n.ts.expandOnNoteClick
				}}<template #caption>{{
					i18n.ts.expandOnNoteClickDesc
				}}</template>
			</FormSwitch>
			<FormSwitch v-model="advancedMfm" class="_formBlock">
				{{ i18n.ts._mfm.advanced
				}}<template #caption>{{
					i18n.ts._mfm.advancedDescription
				}}</template>
			</FormSwitch>
			<FormSwitch v-model="autoplayMfm" class="_formBlock">
				{{ i18n.ts._mfm.alwaysPlay }}
				<template #caption>
					<i
						class="ph-warning ph-bold ph-lg"
						style="color: var(--warn)"
					></i>
					{{ i18n.ts._mfm.warn }}
				</template>
			</FormSwitch>
			<FormSwitch v-model="reduceAnimation" class="_formBlock">{{
				i18n.ts.reduceUiAnimation
			}}</FormSwitch>
			<FormSwitch
				v-model="disableShowingAnimatedImages"
				class="_formBlock"
				>{{ i18n.ts.disableShowingAnimatedImages }}</FormSwitch
			>
			<FormRadios v-model="fontSize" class="_formBlock">
				<template #label>{{ i18n.ts.fontSize }}</template>
				<option :value="null">
					<span style="font-size: 14px">14</span>
				</option>
				<option value="15">
					<span style="font-size: 15px">15</span>
				</option>
				<option value="16">
					<span style="font-size: 16px">16</span>
				</option>
				<option value="17">
					<span style="font-size: 17px">17</span>
				</option>
				<option value="18">
					<span style="font-size: 18px">18</span>
				</option>
			</FormRadios>

			<!-- <FormRange
				v-model="fontSize"
				:min="12"
				:max="18"
				:step="1"
				:value="fontSize ? fontSize : 14"
				easing
				:showTicks="true"
				class="_formBlock"
			>
				<template #label>{{ i18n.ts.fontSize }}</template>
			</FormRange> -->
		</FormSection>

		<FormSection>
			<template #label>{{ i18n.ts.appearance }}</template>
			<FormSwitch v-model="showAds" class="_formBlock">{{
				i18n.ts.showAds
			}}</FormSwitch>
			<FormSwitch v-model="useBlurEffect" class="_formBlock">{{
				i18n.ts.useBlurEffect
			}}</FormSwitch>
			<FormSwitch v-model="useBlurEffectForModal" class="_formBlock">{{
				i18n.ts.useBlurEffectForModal
			}}</FormSwitch>
			<FormSwitch
				v-model="showGapBetweenNotesInTimeline"
				class="_formBlock"
				>{{ i18n.ts.showGapBetweenNotesInTimeline }}</FormSwitch
			>
			<FormSwitch v-model="loadRawImages" class="_formBlock">{{
				i18n.ts.loadRawImages
			}}</FormSwitch>
			<FormSwitch v-model="squareAvatars" class="_formBlock">{{
				i18n.ts.squareAvatars
			}}</FormSwitch>
			<FormSwitch v-model="seperateRenoteQuote" class="_formBlock">{{
				i18n.ts.seperateRenoteQuote
			}}</FormSwitch>
			<FormSwitch v-model="useSystemFont" class="_formBlock">{{
				i18n.ts.useSystemFont
			}}</FormSwitch>
			<FormSwitch v-model="useOsNativeEmojis" class="_formBlock">
				{{ i18n.ts.useOsNativeEmojis }}
				<div>
					<Mfm :key="useOsNativeEmojis" text="🍮🍦🍭🍩🍰🍫🍬🥞🍪" />
				</div>
			</FormSwitch>
			<FormSwitch v-model="disableDrawer" class="_formBlock">{{
				i18n.ts.disableDrawer
			}}</FormSwitch>
			<FormSwitch v-model="showUpdates" class="_formBlock">{{
				i18n.ts.showUpdates
			}}</FormSwitch>
			<FormSwitch v-model="showFixedPostForm" class="_formBlock">{{
				i18n.ts.showFixedPostForm
			}}</FormSwitch>
			<FormSwitch
				v-if="$i?.isAdmin"
				v-model="showAdminUpdates"
				class="_formBlock"
				>{{ i18n.ts.showAdminUpdates }}</FormSwitch
			>
			<FormSelect v-model="instanceTicker" class="_formBlock">
				<template #label>{{ i18n.ts.instanceTicker }}</template>
				<option value="none">{{ i18n.ts._instanceTicker.none }}</option>
				<option value="remote">
					{{ i18n.ts._instanceTicker.remote }}
				</option>
				<option value="always">
					{{ i18n.ts._instanceTicker.always }}
				</option>
			</FormSelect>

			<FormSelect v-model="nsfw" class="_formBlock">
				<template #label>{{ i18n.ts.nsfw }}</template>
				<option value="respect">{{ i18n.ts._nsfw.respect }}</option>
				<option value="ignore">{{ i18n.ts._nsfw.ignore }}</option>
				<option value="force">{{ i18n.ts._nsfw.force }}</option>
			</FormSelect>
		</FormSection>

		<FormRange
			v-model="numberOfPageCache"
			:min="1"
			:max="10"
			:step="1"
			easing
			class="_formBlock"
		>
			<template #label>{{ i18n.ts.numberOfPageCache }}</template>
			<template #caption>{{
				i18n.ts.numberOfPageCacheDescription
			}}</template>
		</FormRange>

		<FormLink to="/settings/deck" class="_formBlock">{{
			i18n.ts.deck
		}}</FormLink>

		<FormLink to="/settings/custom-katex-macro" class="_formBlock"
			><template #icon><i class="ph-radical ph-bold ph-lg"></i></template
			>{{ i18n.ts.customKaTeXMacro }}</FormLink
		>
	</div>
</template>

<script lang="ts" setup>
import { reactive, computed, ref, watch } from "vue";
import { $i } from "@/account";
import FormSwitch from "@/components/form/switch.vue";
import FormSelect from "@/components/form/select.vue";
import FormRadios from "@/components/form/radios.vue";
import FormRange from "@/components/form/range.vue";
import FormSection from "@/components/form/section.vue";
import FormLink from "@/components/form/link.vue";
import MkLink from "@/components/MkLink.vue";
import { langs } from "@/config";
import { defaultStore } from "@/store";
import * as os from "@/os";
import { unisonReload } from "@/scripts/unison-reload";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import { deviceKind } from "@/scripts/device-kind";

const lang = ref(localStorage.getItem("lang"));
const fontSize = ref(localStorage.getItem("fontSize"));
const useSystemFont = ref(localStorage.getItem("useSystemFont") != null);

async function reloadAsk() {
	const { canceled } = await os.confirm({
		type: "info",
		text: i18n.ts.reloadToApplySetting,
	});
	if (canceled) return;

	unisonReload();
}

const overridedDeviceKind = computed(
	defaultStore.makeGetterSetter("overridedDeviceKind"),
);
const serverDisconnectedBehavior = computed(
	defaultStore.makeGetterSetter("serverDisconnectedBehavior"),
);
const reduceAnimation = computed(
	defaultStore.makeGetterSetter(
		"animation",
		(v) => !v,
		(v) => !v,
	),
);
const useBlurEffectForModal = computed(
	defaultStore.makeGetterSetter("useBlurEffectForModal"),
);
const useBlurEffect = computed(defaultStore.makeGetterSetter("useBlurEffect"));
const showGapBetweenNotesInTimeline = computed(
	defaultStore.makeGetterSetter("showGapBetweenNotesInTimeline"),
);
const showAds = computed(defaultStore.makeGetterSetter("showAds"));
const advancedMfm = computed(defaultStore.makeGetterSetter("advancedMfm"));
const autoplayMfm = computed(
	defaultStore.makeGetterSetter(
		"animatedMfm",
		(v) => !v,
		(v) => !v,
	),
);
const useOsNativeEmojis = computed(
	defaultStore.makeGetterSetter("useOsNativeEmojis"),
);
const disableDrawer = computed(defaultStore.makeGetterSetter("disableDrawer"));
const disableShowingAnimatedImages = computed(
	defaultStore.makeGetterSetter("disableShowingAnimatedImages"),
);
const loadRawImages = computed(defaultStore.makeGetterSetter("loadRawImages"));
const imageNewTab = computed(defaultStore.makeGetterSetter("imageNewTab"));
const nsfw = computed(defaultStore.makeGetterSetter("nsfw"));
const disablePagesScript = computed(
	defaultStore.makeGetterSetter("disablePagesScript"),
);
const expandOnNoteClick = computed(
	defaultStore.makeGetterSetter("expandOnNoteClick"),
);
const showFixedPostForm = computed(
	defaultStore.makeGetterSetter("showFixedPostForm"),
);
const numberOfPageCache = computed(
	defaultStore.makeGetterSetter("numberOfPageCache"),
);
const instanceTicker = computed(
	defaultStore.makeGetterSetter("instanceTicker"),
);
const enableInfiniteScroll = computed(
	defaultStore.makeGetterSetter("enableInfiniteScroll"),
);
const enterSendsMessage = computed(
	defaultStore.makeGetterSetter("enterSendsMessage"),
);
const useReactionPickerForContextMenu = computed(
	defaultStore.makeGetterSetter("useReactionPickerForContextMenu"),
);
const seperateRenoteQuote = computed(
	defaultStore.makeGetterSetter("seperateRenoteQuote"),
);
const squareAvatars = computed(defaultStore.makeGetterSetter("squareAvatars"));
const showUpdates = computed(defaultStore.makeGetterSetter("showUpdates"));
const swipeOnDesktop = computed(
	defaultStore.makeGetterSetter("swipeOnDesktop"),
);
const swipeOnMobile = computed(defaultStore.makeGetterSetter("swipeOnMobile"));
const showAdminUpdates = computed(
	defaultStore.makeGetterSetter("showAdminUpdates"),
);
const showTimelineReplies = computed(
	defaultStore.makeGetterSetter("showTimelineReplies"),
);

watch(swipeOnDesktop, () => {
	defaultStore.set("swipeOnMobile", true);
});

watch(lang, () => {
	localStorage.setItem("lang", lang.value as string);
	localStorage.removeItem("locale");
});

watch(fontSize, () => {
	if (fontSize.value == null) {
		localStorage.removeItem("fontSize");
	} else {
		localStorage.setItem("fontSize", fontSize.value);
	}
});

watch(useSystemFont, () => {
	if (useSystemFont.value) {
		localStorage.setItem("useSystemFont", "t");
	} else {
		localStorage.removeItem("useSystemFont");
	}
});

watch(
	[
		lang,
		fontSize,
		useSystemFont,
		enableInfiniteScroll,
		squareAvatars,
		showGapBetweenNotesInTimeline,
		instanceTicker,
		overridedDeviceKind,
		showAds,
		showUpdates,
		swipeOnMobile,
		swipeOnDesktop,
		seperateRenoteQuote,
		showAdminUpdates,
		advancedMfm,
		autoplayMfm,
		expandOnNoteClick,
	],
	async () => {
		await reloadAsk();
	},
);

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.general,
	icon: "ph-gear-six ph-bold ph-lg",
});
</script>
