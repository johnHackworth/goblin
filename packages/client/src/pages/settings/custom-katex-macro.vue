<template>
	<div class="_formRoot">
		<FormInfo class="_formBlock">{{
			i18n.ts.customKaTeXMacroDescription
		}}</FormInfo>

		<FormTextarea
			v-model="localCustomKaTeXMacro"
			manual-save
			tall
			class="_monospace _formBlock"
			style="tab-size: 2"
		>
			<template #label>{{ i18n.ts.customKaTeXMacro }}</template>
		</FormTextarea>

		<FormSwitch v-model="enableCustomKaTeXMacro" class="_formBlock">{{
			i18n.ts.enableCustomKaTeXMacro
		}}</FormSwitch>
	</div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import FormTextarea from "@/components/form/textarea.vue";
import FormInfo from "@/components/MkInfo.vue";
import FormSwitch from "@/components/form/switch.vue";
import * as os from "@/os";
import { unisonReload } from "@/scripts/unison-reload";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import { parseKaTeXMacros } from "@/scripts/katex-macro";
import { defaultStore } from "@/store";

const localCustomKaTeXMacro = ref(
	localStorage.getItem("customKaTeXMacro") ?? "",
);
const enableCustomKaTeXMacro = computed(
	defaultStore.makeGetterSetter("enableCustomKaTeXMacro"),
);

async function apply() {
	localStorage.setItem("customKaTeXMacro", localCustomKaTeXMacro.value);
	localStorage.setItem(
		"customKaTeXMacroParsed",
		parseKaTeXMacros(localCustomKaTeXMacro.value),
	);

	const { canceled } = await os.confirm({
		type: "info",
		text: i18n.ts.reloadToApplySetting,
	});
	if (canceled) return;

	unisonReload();
}

watch(localCustomKaTeXMacro, async () => {
	await apply();
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.customKaTeXMacro,
	icon: "ph-radical ph-bold ph-lg",
});
</script>
