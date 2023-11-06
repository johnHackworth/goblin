<template>
	<div class="_formRoot">
		<FormSwitch v-model="enableEmojiReactions" class="_formBlock">
			{{ i18n.ts.enableEmojiReactions }}
		</FormSwitch>

		<div v-if="enableEmojiReactions">
			<FromSlot class="_formBlock">
				<template #label>{{
					i18n.ts.reactionSettingDescription
				}}</template>
				<div v-panel style="border-radius: 6px">
					<VueDraggable
						v-model="reactions"
						class="zoaiodol"
						animation="150"
						delay="100"
						@end="save"
						delay-on-touch-only="true"
					>
						<div
							v-for="item in reactions"
							:key="item"
							class="_button item"
							@click="remove(item, $event)"
						>
							<MkEmoji
								:emoji="item"
								style="height: 1.7em"
								class="emoji"
							/>
						</div>
					</VueDraggable>
					<button class="_button add" @click="chooseEmoji">
						<i class="ph-plus ph-bold ph-lg"></i>
					</button>
				</div>
				<template #caption
					>{{ i18n.ts.reactionSettingDescription2 }}
					<button class="_textButton" @click="preview">
						{{ i18n.ts.preview }}
					</button></template
				>
			</FromSlot>

			<FormRadios v-model="reactionPickerSkinTone" class="_formBlock">
				<template #label>{{ i18n.ts.reactionPickerSkinTone }}</template>
				<option :value="1" :aria-label="i18n.ts._skinTones.yellow">
					<MkEmoji style="height: 1.7em" emoji="✌️" />
				</option>
				<option :value="6" :aria-label="i18n.ts._skinTones.dark">
					<MkEmoji style="height: 1.7em" emoji="✌🏿" />
				</option>
				<option :value="5" :aria-label="i18n.ts._skinTones.mediumDark">
					<MkEmoji style="height: 1.7em" emoji="✌🏾" />
				</option>
				<option :value="4" :aria-label="i18n.ts._skinTones.medium">
					<MkEmoji style="height: 1.7em" emoji="✌🏽" />
				</option>
				<option :value="3" :aria-label="i18n.ts._skinTones.mediumLight">
					<MkEmoji style="height: 1.7em" emoji="✌🏼" />
				</option>
				<option :value="2" :aria-label="i18n.ts._skinTones.light">
					<MkEmoji style="height: 1.7em" emoji="✌🏻" />
				</option>
			</FormRadios>
			<FormRadios v-model="reactionPickerSize" class="_formBlock">
				<template #label>{{ i18n.ts.size }}</template>
				<option :value="1">{{ i18n.ts.small }}</option>
				<option :value="2">{{ i18n.ts.medium }}</option>
				<option :value="3">{{ i18n.ts.large }}</option>
			</FormRadios>
			<FormRadios v-model="reactionPickerWidth" class="_formBlock">
				<template #label>{{ i18n.ts.numberOfColumn }}</template>
				<option :value="1">5</option>
				<option :value="2">6</option>
				<option :value="3">7</option>
				<option :value="4">8</option>
				<option :value="5">9</option>
			</FormRadios>
			<FormRadios v-model="reactionPickerHeight" class="_formBlock">
				<template #label>{{ i18n.ts.height }}</template>
				<option :value="1">{{ i18n.ts.small }}</option>
				<option :value="2">{{ i18n.ts.medium }}</option>
				<option :value="3">{{ i18n.ts.large }}</option>
				<option :value="4">{{ i18n.ts.xl }}</option>
			</FormRadios>

			<FormSwitch
				v-model="reactionPickerUseDrawerForMobile"
				class="_formBlock"
			>
				{{ i18n.ts.useDrawerReactionPickerForMobile }}
				<template #caption>{{ i18n.ts.needReloadToApply }}</template>
			</FormSwitch>

			<FormSection>
				<div style="display: flex; gap: var(--margin); flex-wrap: wrap">
					<FormButton inline @click="preview"
						><i class="ph-eye ph-bold ph-lg"></i>
						{{ i18n.ts.preview }}</FormButton
					>
					<FormButton inline danger @click="setDefault"
						><i
							class="ph-arrow-counter-clockwise ph-bold ph-lg"
						></i>
						{{ i18n.ts.default }}</FormButton
					>
				</div>
			</FormSection>
		</div>
		<div v-else>
			<FormSwitch
				v-model="showEmojisInReactionNotifications"
				class="_formBlock"
			>
				{{ i18n.ts.showEmojisInReactionNotifications }}
			</FormSwitch>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, watch } from "vue";
import { VueDraggable } from "vue-draggable-plus";
import FormRadios from "@/components/form/radios.vue";
import FromSlot from "@/components/form/slot.vue";
import FormButton from "@/components/MkButton.vue";
import FormSection from "@/components/form/section.vue";
import FormSwitch from "@/components/form/switch.vue";
import * as os from "@/os";
import { defaultStore } from "@/store";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import { deepClone } from "@/scripts/clone";
import { unisonReload } from "@/scripts/unison-reload";
import { addSkinTone } from "@/scripts/emojilist";

async function reloadAsk() {
	const { canceled } = await os.confirm({
		type: "info",
		text: i18n.ts.reloadToApplySetting,
	});
	if (canceled) return;

	unisonReload();
}

let reactions = $ref(deepClone(defaultStore.state.reactions));

const reactionPickerSkinTone = $computed(
	defaultStore.makeGetterSetter("reactionPickerSkinTone"),
);
const reactionPickerSize = $computed(
	defaultStore.makeGetterSetter("reactionPickerSize"),
);
const reactionPickerWidth = $computed(
	defaultStore.makeGetterSetter("reactionPickerWidth"),
);
const reactionPickerHeight = $computed(
	defaultStore.makeGetterSetter("reactionPickerHeight"),
);
const reactionPickerUseDrawerForMobile = $computed(
	defaultStore.makeGetterSetter("reactionPickerUseDrawerForMobile"),
);
const enableEmojiReactions = $computed(
	defaultStore.makeGetterSetter("enableEmojiReactions"),
);
const showEmojisInReactionNotifications = $computed(
	defaultStore.makeGetterSetter("showEmojisInReactionNotifications"),
);

function save() {
	defaultStore.set("reactions", reactions);
}

function remove(reaction, ev: MouseEvent) {
	os.popupMenu(
		[
			{
				text: i18n.ts.remove,
				action: () => {
					reactions = reactions.filter((x) => x !== reaction);
					save();
				},
			},
		],
		ev.currentTarget ?? ev.target,
	);
}

function preview(ev: MouseEvent) {
	os.popup(
		defineAsyncComponent(
			() => import("@/components/MkEmojiPickerDialog.vue"),
		),
		{
			asReactionPicker: true,
			src: ev.currentTarget ?? ev.target,
		},
		{},
		"closed",
	);
}

async function setDefault() {
	const { canceled } = await os.confirm({
		type: "warning",
		text: i18n.ts.resetAreYouSure,
	});
	if (canceled) return;

	reactions = deepClone(defaultStore.def.reactions.default);
}

function chooseEmoji(ev: MouseEvent) {
	os.pickEmoji(ev.currentTarget ?? ev.target, {
		showPinned: false,
	}).then((emoji) => {
		if (!reactions.includes(emoji)) {
			reactions.push(emoji);
			save();
		}
	});
}

watch(enableEmojiReactions, async () => {
	await reloadAsk();
});

watch(reactionPickerSkinTone, async () => {
	reactions.forEach((emoji) => {
		addSkinTone(emoji, reactionPickerSkinTone.value);
	});
	await reloadAsk();
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.reaction,
	icon: "ph-smiley ph-bold ph-lg",
});
</script>

<style lang="scss" scoped>
.zoaiodol {
	padding: 12px;
	font-size: 1.1em;

	> .item {
		display: inline-block;
		padding: 8px;
		cursor: move;
	}
}

.add {
	display: inline-block;
	padding: 8px;
	margin-left: 12px;
	margin-bottom: 12px;
}
</style>
