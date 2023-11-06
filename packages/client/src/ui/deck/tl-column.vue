<template>
	<XColumn
		:menu="menu"
		:column="column"
		:is-stacked="isStacked"
		:indicated="indicated"
		@change-active-state="onChangeActiveState"
		@parent-focus="($event) => emit('parent-focus', $event)"
	>
		<template #header>
			<i v-if="column.tl === 'home'" class="ph-house ph-bold ph-lg"></i>
			<i
				v-else-if="column.tl === 'local'"
				class="ph-chats-circle ph-bold ph-lg"
			></i>
			<i
				v-else-if="column.tl === 'social'"
				class="ph-share-network ph-bold ph-lg"
			></i>
			<i
				v-else-if="column.tl === 'global'"
				class="ph-planet ph-bold ph-lg"
			></i>
			<span style="margin-left: 8px">{{ column.name }}</span>
		</template>

		<div v-if="disabled" class="iwaalbte">
			<p>
				<i class="ph-minus-circle ph-bold ph-lg"></i>
				{{ i18n.t("disabled-timeline.title") }}
			</p>
			<p class="desc">{{ i18n.t("disabled-timeline.description") }}</p>
		</div>
		<XTimeline
			v-else-if="column.tl"
			ref="timeline"
			:key="column.tl"
			:src="column.tl"
			@after="() => emit('loaded')"
			@queue="queueUpdated"
			@note="onNote"
		/>
	</XColumn>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import XColumn from "./column.vue";
import type { Column } from "./deck-store";
import { removeColumn, updateColumn } from "./deck-store";
import XTimeline from "@/components/MkTimeline.vue";
import * as os from "@/os";
import { $i } from "@/account";
import { instance } from "@/instance";
import { i18n } from "@/i18n";

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const emit = defineEmits<{
	(ev: "loaded"): void;
	(ev: "parent-focus", direction: "up" | "down" | "left" | "right"): void;
}>();

let disabled = $ref(false),
	indicated = $ref(false),
	columnActive = $ref(true);

onMounted(() => {
	if (props.column.tl == null) {
		setType();
	} else if ($i) {
		disabled =
			!$i.isModerator &&
			!$i.isAdmin &&
			((instance.disableLocalTimeline &&
				["local", "social"].includes(props.column.tl)) ||
				(instance.disableRecommendedTimeline &&
					["recommended"].includes(props.column.tl)) ||
				(instance.disableGlobalTimeline &&
					["global"].includes(props.column.tl)));
	}
});

async function setType() {
	const { canceled, result: src } = await os.select({
		title: i18n.ts.timeline,
		items: [
			{
				value: "home" as const,
				text: i18n.ts._timelines.home,
			},
			{
				value: "local" as const,
				text: i18n.ts._timelines.local,
			},
			{
				value: "recommended" as const,
				text: i18n.ts._timelines.recommended,
			},
			{
				value: "social" as const,
				text: i18n.ts._timelines.social,
			},
			{
				value: "global" as const,
				text: i18n.ts._timelines.global,
			},
		],
	});
	if (canceled) {
		if (props.column.tl == null) {
			removeColumn(props.column.id);
		}
		return;
	}
	updateColumn(props.column.id, {
		tl: src,
	});
}

function queueUpdated(q) {
	if (columnActive) {
		indicated = q !== 0;
	}
}

function onNote() {
	if (!columnActive) {
		indicated = true;
	}
}

function onChangeActiveState(state) {
	columnActive = state;

	if (columnActive) {
		indicated = false;
	}
}

const menu = [
	{
		icon: "ph-pencil ph-bold ph-lg",
		text: i18n.ts.timeline,
		action: setType,
	},
];
</script>

<style lang="scss" scoped>
.iwaalbte {
	text-align: center;

	> p {
		margin: 16px;

		&.desc {
			font-size: 14px;
		}
	}
}
</style>
