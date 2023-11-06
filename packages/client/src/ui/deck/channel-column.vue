<template>
	<XColumn
		:menu="menu"
		:column="column"
		:is-stacked="isStacked"
		@parent-focus="($event) => emit('parent-focus', $event)"
	>
		<template #header>
			<i class="ph-television ph-bold ph-lg"></i
			><span style="margin-left: 8px">{{ column.name }}</span>
		</template>

		<XTimeline
			v-if="column.channelId"
			ref="timeline"
			src="channel"
			:channel="column.channelId"
			@after="() => emit('loaded')"
		/>
	</XColumn>
</template>

<script lang="ts" setup>
import {} from "vue";
import XColumn from "./column.vue";
import type { Column } from "./deck-store";
import { updateColumn } from "./deck-store";
import XTimeline from "@/components/MkTimeline.vue";
import * as os from "@/os";
import { i18n } from "@/i18n";

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const emit = defineEmits<{
	(ev: "loaded"): void;
	(ev: "parent-focus", direction: "up" | "down" | "left" | "right"): void;
}>();

const timeline = $ref<InstanceType<typeof XTimeline>>();

if (props.column.channelId == null) {
	setChannel();
}

async function setChannel() {
	const channels = await os.api("channels/followed");
	const { canceled, result: channel } = await os.select({
		title: i18n.ts.selectChannel,
		items: channels.map((x) => ({
			value: x,
			text: x.name,
		})),
		default: props.column.channelId,
	});
	if (canceled) return;
	updateColumn(props.column.id, {
		name: channel.name,
		channelId: channel.id,
	});
}

const menu = [
	{
		icon: "ph-pencil ph-bold ph-lg",
		text: i18n.ts.selectChannel,
		action: setChannel,
	},
];
</script>

<style lang="scss" module></style>
