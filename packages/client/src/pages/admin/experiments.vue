<template>
	<MkStickyContainer>
		<template #header
			><MkPageHeader
				:actions="headerActions"
				:tabs="headerTabs"
				:display-back-button="true"
		/></template>
		<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
			<FormSuspense :p="init">
				<FormSwitch
					v-model="enablePostImports"
					@update:modelValue="save"
					class="_formBlock"
				>
					<template #label>
						<i class="ph-download-simple ph-bold ph-lg"></i>
						{{ i18n.ts._experiments.enablePostImports }}
					</template>
					<template #caption>{{
						i18n.ts._experiments.postImportsCaption
					}}</template>
				</FormSwitch>
			</FormSuspense>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import {} from "vue";
import MkStickyContainer from "@/components/global/MkStickyContainer.vue";
import FormSuspense from "@/components/form/suspense.vue";
import FormSwitch from "@/components/form/switch.vue";
import * as os from "@/os";
import { fetchInstance } from "@/instance";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";

let enablePostImports = $ref(false);
let meta = $ref<MetaExperiments | null>(null);

type MetaExperiments = {
	experimentalFeatures?: {
		postImports?: boolean;
	};
};

async function init() {
	meta = (await os.api("admin/meta")) as MetaExperiments;
	if (!meta) return;

	enablePostImports = meta.experimentalFeatures?.postImports ?? false;
}

function save() {
	const experiments: MetaExperiments = {
		experimentalFeatures: {
			postImports: enablePostImports,
		},
	};
	os.apiWithDialog("admin/update-meta", experiments).then(() => {
		fetchInstance();
	});
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts._experiments.title,
	icon: "ph-flask ph-bold ph-lg",
});
</script>
