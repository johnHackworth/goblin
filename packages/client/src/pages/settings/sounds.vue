<template>
	<div class="_formRoot">
		<FormRange
			v-model="masterVolume"
			:min="0"
			:max="1"
			:step="0.05"
			:text-converter="(v) => `${Math.floor(v * 100)}%`"
			class="_formBlock"
		>
			<template #label>{{ i18n.ts.masterVolume }}</template>
		</FormRange>

		<FormSection>
			<template #label>{{ i18n.ts.sounds }}</template>
			<div class="_formLinksGrid">
				<FormButton
					v-for="type in Object.keys(sounds)"
					:key="type"
					@click="edit(type)"
				>
					{{ i18n.t("_sfx." + type) }}
					<template #suffix>{{
						sounds[type].type || i18n.ts.none
					}}</template>
					<template #suffixIcon
						><i class="ph-caret-down ph-bold ph-lg"></i
					></template>
				</FormButton>
			</div>
		</FormSection>

		<FormButton danger class="_formBlock" @click="reset()"
			><i class="ph-arrow-clockwise ph-bold ph-lg"></i>
			{{ i18n.ts.default }}</FormButton
		>
	</div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import FormRange from "@/components/form/range.vue";
import FormButton from "@/components/MkButton.vue";
import FormSection from "@/components/form/section.vue";
import * as os from "@/os";
import { ColdDeviceStorage } from "@/store";
import { playFile } from "@/scripts/sound";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";

const masterVolume = computed({
	get: () => {
		return ColdDeviceStorage.get("sound_masterVolume");
	},
	set: (value) => {
		ColdDeviceStorage.set("sound_masterVolume", value);
	},
});

const volumeIcon = computed(() =>
	masterVolume.value === 0
		? "ph-speaker-none ph-bold ph-lg"
		: "ph-speaker-high ph-bold ph-lg",
);

const sounds = ref({
	note: ColdDeviceStorage.get("sound_note"),
	noteMy: ColdDeviceStorage.get("sound_noteMy"),
	notification: ColdDeviceStorage.get("sound_notification"),
	chat: ColdDeviceStorage.get("sound_chat"),
	chatBg: ColdDeviceStorage.get("sound_chatBg"),
	antenna: ColdDeviceStorage.get("sound_antenna"),
	channel: ColdDeviceStorage.get("sound_channel"),
});

const soundsTypes = await os.api("get-sounds");

async function edit(type) {
	const { canceled, result } = await os.form(i18n.t("_sfx." + type), {
		type: {
			type: "enum",
			enum: soundsTypes.map((x) => ({
				value: x,
				label: x == null ? i18n.ts.none : x,
			})),
			label: i18n.ts.sound,
			default: sounds.value[type].type,
		},
		volume: {
			type: "range",
			min: 0,
			max: 1,
			step: 0.05,
			textConverter: (v) => `${Math.floor(v * 100)}%`,
			label: i18n.ts.volume,
			default: sounds.value[type].volume,
		},
		listen: {
			type: "button",
			content: i18n.ts.listen,
			action: (_, values) => {
				playFile(values.type, values.volume);
			},
		},
	});
	if (canceled) return;

	const v = {
		type: result.type,
		volume: result.volume,
	};

	ColdDeviceStorage.set("sound_" + type, v);
	sounds.value[type] = v;
}

function reset() {
	for (const sound of Object.keys(sounds.value)) {
		const v = ColdDeviceStorage.default["sound_" + sound];
		ColdDeviceStorage.set("sound_" + sound, v);
		sounds.value[sound] = v;
	}
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.sounds,
	icon: "ph-speaker-high ph-bold ph-lg",
});
</script>
