<template>
	<XContainer :draggable="true" @remove="() => $emit('remove')">
		<template #header
			><i class="ph-lightning ph-bold ph-lg"></i>
			{{ i18n.ts._pages.blocks.radioButton }}</template
		>

		<section style="padding: 0 16px 16px 16px">
			<MkInput v-model="value.name"
				><template #prefix
					><i class="ph-magic-wand ph-bold ph-lg"></i></template
				><template #label>{{
					i18n.ts._pages.blocks._radioButton.name
				}}</template></MkInput
			>
			<MkInput v-model="value.title"
				><template #label>{{
					i18n.ts._pages.blocks._radioButton.title
				}}</template></MkInput
			>
			<MkTextarea v-model="values"
				><template #label>{{
					i18n.ts._pages.blocks._radioButton.values
				}}</template></MkTextarea
			>
			<MkInput v-model="value.default"
				><template #label>{{
					i18n.ts._pages.blocks._radioButton.default
				}}</template></MkInput
			>
		</section>
	</XContainer>
</template>

<script lang="ts" setup>
import { watch } from "vue";
import XContainer from "../page-editor.container.vue";
import MkTextarea from "@/components/form/textarea.vue";
import MkInput from "@/components/form/input.vue";
import { i18n } from "@/i18n";

const props = withDefaults(
	defineProps<{
		value: any;
	}>(),
	{
		value: {
			name: "",
			title: "",
			values: [],
		},
	},
);

let values: string = $ref(props.value.values.join("\n"));

watch(
	values,
	() => {
		props.value.values = values.split("\n");
	},
	{
		deep: true,
	},
);
</script>
