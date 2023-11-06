<template>
	<XContainer :draggable="true" @remove="() => $emit('remove')">
		<template #header
			><i class="ph-paint-brush-household ph-bold ph-lg"></i>
			{{ i18n.ts._pages.blocks.canvas }}</template
		>

		<section style="padding: 0 16px 0 16px">
			<MkInput v-model="value.name">
				<template #prefix
					><i class="ph-magic-wand ph-bold ph-lg"></i
				></template>
				<template #label>{{
					i18n.ts._pages.blocks._canvas.id
				}}</template>
			</MkInput>
			<MkInput v-model="value.width" type="number">
				<template #label>{{
					i18n.ts._pages.blocks._canvas.width
				}}</template>
				<template #suffix>px</template>
			</MkInput>
			<MkInput v-model="value.height" type="number">
				<template #label>{{
					i18n.ts._pages.blocks._canvas.height
				}}</template>
				<template #suffix>px</template>
			</MkInput>
		</section>
	</XContainer>
</template>

<script lang="ts" setup>
import {} from "vue";
import XContainer from "../page-editor.container.vue";
import MkInput from "@/components/form/input.vue";
import { i18n } from "@/i18n";

withDefaults(
	defineProps<{
		value: any;
	}>(),
	{
		value: {
			name: "",
			width: 300,
			height: 200,
		},
	},
);
</script>
