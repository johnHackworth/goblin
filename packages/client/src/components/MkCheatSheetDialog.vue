<template>
	<XModalWindow
		ref="dialog"
		:width="600"
		@close="dialog?.close()"
		@closed="$emit('closed')"
	>
		<template #header>{{ i18n.ts._mfm.cheatSheet }}</template>
		<XCheatSheet :popup="true" style="background: var(--bg)" />
	</XModalWindow>
</template>

<script lang="ts" setup>
import XModalWindow from "@/components/MkModalWindow.vue";
import XCheatSheet from "@/pages/mfm-cheat-sheet.vue";
import { i18n } from "@/i18n";

const emit = defineEmits<{
	(ev: "done"): void;
	(ev: "closed"): void;
}>();

const dialog = $ref<InstanceType<typeof XModalWindow>>();

function close(res) {
	dialog.close();
}
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.2s ease-in-out;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
