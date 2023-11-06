<template>
	<button class="zuvgdzyu _button" @click="menu">
		<img :src="emoji.url" class="img" :alt="emoji.name" />
		<div class="body">
			<div class="name _monospace">{{ emoji.name }}</div>
			<div class="info">{{ emoji.aliases.join(" ") }}</div>
		</div>
	</button>
</template>

<script lang="ts" setup>
import {} from "vue";
import * as os from "@/os";
import copyToClipboard from "@/scripts/copy-to-clipboard";
import { i18n } from "@/i18n";

const props = defineProps<{
	emoji: Record<string, unknown>; // TODO
}>();

function menu(ev) {
	os.popupMenu(
		[
			{
				type: "label",
				text: ":" + props.emoji.name + ":",
			},
			{
				text: i18n.ts.copy,
				icon: "ph-clipboard-text ph-bold ph-lg",
				action: () => {
					copyToClipboard(`:${props.emoji.name}:`);
					os.success();
				},
			},
			{
				text: i18n.ts.license,
				icon: "ph-info ph-bold ph-lg",
				action: () => {
					os.apiGet("emoji", { name: props.emoji.name }).then(
						(res) => {
							os.alert({
								type: "info",
								text: `${res.license || i18n.ts.notSet}`,
							});
						},
					);
				},
			},
		],
		ev.currentTarget ?? ev.target,
	);
}
</script>

<style lang="scss" scoped>
.zuvgdzyu {
	display: flex;
	align-items: center;
	padding: 12px;
	text-align: left;
	background: var(--panel);
	border-radius: 8px;

	&:hover {
		border-color: var(--accent);
	}

	> .img {
		width: 42px;
		height: 42px;
	}

	> .body {
		padding: 0 0 0 8px;
		white-space: nowrap;
		overflow: hidden;

		> .name {
			text-overflow: ellipsis;
			overflow: hidden;
		}

		> .info {
			opacity: 0.5;
			font-size: 0.9em;
			text-overflow: ellipsis;
			overflow: hidden;
		}
	}
}
</style>
