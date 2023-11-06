<template>
	<XContainer :draggable="true" @remove="() => $emit('remove')">
		<template #header
			><i class="ph-paper-plane-tilt ph-bold ph-lg"></i>
			{{ i18n.ts._pages.blocks.post }}</template
		>

		<section style="padding: 16px">
			<MkTextarea v-model="value.text"
				><template #label>{{
					i18n.ts._pages.blocks._post.text
				}}</template></MkTextarea
			>
			<MkSwitch v-model="value.attachCanvasImage"
				><span>{{
					i18n.ts._pages.blocks._post.attachCanvasImage
				}}</span></MkSwitch
			>
			<MkInput v-if="value.attachCanvasImage" v-model="value.canvasId"
				><template #label>{{
					i18n.ts._pages.blocks._post.canvasId
				}}</template></MkInput
			>
		</section>
	</XContainer>
</template>

<script lang="ts" setup>
import {} from "vue";
import XContainer from "../page-editor.container.vue";
import MkTextarea from "@/components/form/textarea.vue";
import MkInput from "@/components/form/input.vue";
import MkSwitch from "@/components/form/switch.vue";
import { i18n } from "@/i18n";

withDefaults(
	defineProps<{
		value: any;
	}>(),
	{
		value: {
			text: "",
			attachCanvasImage: false,
			canvasId: "",
		},
	},
);
</script>
