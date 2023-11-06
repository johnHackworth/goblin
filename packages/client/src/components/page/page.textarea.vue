<template>
	<MkTextarea :model-value="text" readonly></MkTextarea>
</template>

<script lang="ts" setup>
import { watch } from "vue";
import MkTextarea from "../form/textarea.vue";
import { TextBlock } from "@/scripts/hpml/block";
import { Hpml } from "@/scripts/hpml/evaluator";

const props = defineProps<{
	block: TextBlock;
	hpml: Hpml;
}>();

let text = $ref("");

watch(
	props.hpml.vars,
	() => {
		text = props.hpml.interpolate(props.block.text) as string;
	},
	{
		deep: true,
		immediate: true,
	},
);
</script>
