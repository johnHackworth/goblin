<template>
	<div v-if="visible" class="info" :class="{ warn, card }">
		<i v-if="warn" class="ph-warning ph-bold ph-lg"></i>
		<i
			v-else
			class="ph-bold ph-lg"
			:class="icon ? `ph-${icon}` : 'ph-info'"
		></i>
		<slot></slot>
		<button
			v-if="closeable"
			v-tooltip="i18n.ts.close"
			class="_buttonIcon close"
			@click.stop="close"
			:aria-label="i18n.t('close')"
		>
			<i class="ph-x ph-bold ph-lg"></i>
		</button>
	</div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { i18n } from "@/i18n";

const visible = ref(true);

defineProps<{
	icon?: string;
	warn?: boolean;
	card?: boolean;
	closeable?: boolean;
}>();

const emit = defineEmits<{
	(ev: "close"): void;
}>();

function close() {
	visible.value = false;
	emit("close");
}
</script>

<style lang="scss" scoped>
.info {
	padding: 16px;
	font-size: 90%;
	background: var(--infoBg);
	color: var(--infoFg);
	border-radius: var(--radius);
	display: flex;
	align-items: center;
	gap: 0.4em;

	&.warn {
		background: var(--infoWarnBg);
		color: var(--infoWarnFg);
	}

	&.card {
		display: block;
		background: var(--panel);
		color: var(--fg);
		padding: 48px;
		font-size: 1em;
		text-align: center;
		> i {
			display: block;
			font-size: 4em;
			margin: 0;
		}
		> :deep(*) {
			margin-inline: auto;
		}
		> :deep(:not(:last-child)) {
			margin-bottom: 20px;
		}
		> :deep(p) {
			max-width: 30em;
		}
	}

	> i {
		margin-right: 4px;
	}
	> .close {
		margin-left: auto;
		float: right;
	}
}
</style>
