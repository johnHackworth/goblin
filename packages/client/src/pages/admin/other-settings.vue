<template>
	<MkStickyContainer>
		<template #header
			><MkPageHeader
				:actions="headerActions"
				:tabs="headerTabs"
				:display-back-button="true"
		/></template>
		<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
			<FormSuspense :p="init"> none </FormSuspense>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import {} from "vue";
import FormSuspense from "@/components/form/suspense.vue";
import * as os from "@/os";
import { fetchInstance } from "@/instance";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";

async function init() {
	await os.api("admin/meta");
}

function save() {
	os.apiWithDialog("admin/update-meta").then(() => {
		fetchInstance();
	});
}

const headerActions = $computed(() => [
	{
		asFullButton: true,
		icon: "ph-check ph-bold ph-lg",
		text: i18n.ts.save,
		handler: save,
	},
]);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.other,
	icon: "ph-gear-six ph-bold ph-lg",
});
</script>
