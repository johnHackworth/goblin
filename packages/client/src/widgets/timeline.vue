<template>
	<MkContainer
		:show-header="widgetProps.showHeader"
		:style="`height: ${widgetProps.height}px;`"
		:scrollable="true"
		class="mkw-timeline"
	>
		<template #header>
			<button class="_button" @click="choose">
				<i
					v-if="widgetProps.src === 'home'"
					class="ph-house ph-bold ph-lg"
				></i>
				<i
					v-else-if="widgetProps.src === 'local'"
					class="ph-chats-circle ph-bold ph-lg"
				></i>
				<i
					v-else-if="widgetProps.src === 'social'"
					class="ph-share-network ph-bold ph-lg"
				></i>
				<i
					v-else-if="widgetProps.src === 'global'"
					class="ph-planet ph-bold ph-lg"
				></i>
				<i
					v-else-if="widgetProps.src === 'list'"
					class="ph-list-bullets ph-bold ph-lg"
				></i>
				<i
					v-else-if="widgetProps.src === 'antenna'"
					class="ph-television ph-bold ph-lg"
				></i>
				<span style="margin-left: 8px">{{
					widgetProps.src === "list"
						? widgetProps.list.name
						: widgetProps.src === "antenna"
						? widgetProps.antenna.name
						: i18n.t("_timelines." + widgetProps.src)
				}}</span>
				<i
					:class="
						menuOpened
							? 'ph-caret-up ph-bold ph-lg'
							: 'ph-caret-down ph-bold ph-lg'
					"
					style="margin-left: 8px"
				></i>
			</button>
		</template>

		<div>
			<XTimeline
				:key="
					widgetProps.src === 'list'
						? `list:${widgetProps.list.id}`
						: widgetProps.src === 'antenna'
						? `antenna:${widgetProps.antenna.id}`
						: widgetProps.src
				"
				:src="widgetProps.src"
				:list="widgetProps.list ? widgetProps.list.id : null"
				:antenna="widgetProps.antenna ? widgetProps.antenna.id : null"
			/>
		</div>
	</MkContainer>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, reactive, ref, watch } from "vue";
import type { Widget, WidgetComponentExpose } from "./widget";
import {
	WidgetComponentEmits,
	WidgetComponentProps,
	useWidgetPropsManager,
} from "./widget";
import type { GetFormResultType } from "@/scripts/form";
import * as os from "@/os";
import MkContainer from "@/components/MkContainer.vue";
import XTimeline from "@/components/MkTimeline.vue";
import { $i } from "@/account";
import { i18n } from "@/i18n";

const name = "timeline";

const widgetPropsDef = {
	showHeader: {
		type: "boolean" as const,
		default: true,
	},
	height: {
		type: "number" as const,
		default: 300,
	},
	src: {
		type: "string" as const,
		default: "home",
		hidden: true,
	},
	antenna: {
		type: "object" as const,
		default: null,
		hidden: true,
	},
	list: {
		type: "object" as const,
		default: null,
		hidden: true,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

// 現時点ではvueの制限によりimportしたtypeをジェネリックに渡せない
// const props = defineProps<WidgetComponentProps<WidgetProps>>();
// const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();
const props = defineProps<{ widget?: Widget<WidgetProps> }>();
const emit = defineEmits<{ (ev: "updateProps", props: WidgetProps) }>();

const { widgetProps, configure, save } = useWidgetPropsManager(
	name,
	widgetPropsDef,
	props,
	emit,
);

const menuOpened = ref(false);

const setSrc = (src) => {
	widgetProps.src = src;
	save();
};

const choose = async (ev) => {
	menuOpened.value = true;
	const [antennas, lists] = await Promise.all([
		os.api("antennas/list"),
		os.api("users/lists/list"),
	]);
	const antennaItems = antennas.map((antenna) => ({
		text: antenna.name,
		icon: "ph-flying-saucer ph-bold ph-lg",
		action: () => {
			widgetProps.antenna = antenna;
			setSrc("antenna");
		},
	}));
	const listItems = lists.map((list) => ({
		text: list.name,
		icon: "ph-list-bullets ph-bold ph-lg",
		action: () => {
			widgetProps.list = list;
			setSrc("list");
		},
	}));
	os.popupMenu(
		[
			{
				text: i18n.ts._timelines.home,
				icon: "ph-house ph-bold ph-lg",
				action: () => {
					setSrc("home");
				},
			},
			{
				text: i18n.ts._timelines.local,
				icon: "ph-chats-teardrop ph-bold ph-lg",
				action: () => {
					setSrc("local");
				},
			},
			{
				text: i18n.ts._timelines.social,
				icon: "ph-share-network ph-bold ph-lg",
				action: () => {
					setSrc("social");
				},
			},
			{
				text: i18n.ts._timelines.global,
				icon: "ph-planet ph-bold ph-lg",
				action: () => {
					setSrc("global");
				},
			},
			antennaItems.length > 0 ? null : undefined,
			...antennaItems,
			listItems.length > 0 ? null : undefined,
			...listItems,
		],
		ev.currentTarget ?? ev.target,
	).then(() => {
		menuOpened.value = false;
	});
};

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>
