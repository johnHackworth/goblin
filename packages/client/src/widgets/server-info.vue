<template>
	<div class="_panel">
		<div
			:class="$style.container"
			:style="{
				backgroundImage: `url(${$instance.bannerUrl})`,
			}"
		>
			<div :class="$style.iconContainer">
				<img
					:src="
						$instance.iconUrl ||
						$instance.faviconUrl ||
						'/favicon.ico'
					"
					alt="Instance logo"
					:class="$style.icon"
				/>
			</div>
			<div :class="$style.bodyContainer">
				<div :class="$style.body">
					<MkA :class="$style.name" to="/about" behavior="window">{{
						$instance.name
					}}</MkA>
					<div :class="$style.host">{{ host }}</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import type { Widget, WidgetComponentExpose } from "./widget";
import {
	WidgetComponentEmits,
	WidgetComponentProps,
	useWidgetPropsManager,
} from "./widget";
import type { GetFormResultType } from "@/scripts/form";
import { host } from "@/config";

const name = "serverInfo";

const widgetPropsDef = {};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

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

<style lang="scss" module>
.container {
	position: relative;
	background-size: cover;
	background-position: center;
	display: flex;
}

.iconContainer {
	display: inline-block;
	text-align: center;
	padding: 16px;
}

.icon {
	display: inline-block;
	width: 60px;
	height: 60px;
	border-radius: 8px;
	box-sizing: border-box;
	border: solid 3px var(--panelBorder);
}

.bodyContainer {
	display: flex;
	align-items: center;
	min-width: 0;
	padding: 0 16px 0 0;
}

.body {
	text-overflow: ellipsis;
	overflow: clip;
}

.name,
.host {
	color: var(--fg);
	text-shadow:
		-1px -1px 0 var(--bg),
		1px -1px 0 var(--bg),
		-1px 1px 0 var(--bg),
		1px 1px 0 var(--bg);
}

.name {
	font-weight: bold;
}
</style>
