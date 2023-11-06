<template>
	<XPostForm
		class="_panel mkw-postForm"
		:fixed="true"
		:autofocus="false"
		:show-mfm-cheat-sheet="true"
	/>
</template>

<script lang="ts" setup>
import {} from "vue";
import type { Widget, WidgetComponentExpose } from "./widget";
import {
	WidgetComponentEmits,
	WidgetComponentProps,
	useWidgetPropsManager,
} from "./widget";
import type { GetFormResultType } from "@/scripts/form";
import XPostForm from "@/components/MkPostForm.vue";

const name = "postForm";

const widgetPropsDef = {};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

// 現時点ではvueの制限によりimportしたtypeをジェネリックに渡せない
// const props = defineProps<WidgetComponentProps<WidgetProps>>();
// const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();
const props = defineProps<{ widget?: Widget<WidgetProps> }>();
const emit = defineEmits<{ (ev: "updateProps", props: WidgetProps) }>();

const { widgetProps, configure } = useWidgetPropsManager(
	name,
	widgetPropsDef,
	props,
	emit,
);

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>
