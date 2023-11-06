<template>
	<MkModal
		ref="modal"
		v-slot="{ type, maxHeight }"
		:z-priority="'middle'"
		:prefer-type="
			asReactionPicker &&
			defaultStore.state.reactionPickerUseDrawerForMobile === false
				? 'popup'
				: 'auto'
		"
		:transparent-bg="true"
		:manual-showing="manualShowing"
		:src="src"
		@click="checkForShift"
		@opening="opening"
		@close="emit('close')"
		@closed="emit('closed')"
	>
		<MkEmojiPicker
			ref="picker"
			class="ryghynhb _popup _shadow"
			:class="{ drawer: type === 'drawer' }"
			:show-pinned="showPinned"
			:as-reaction-picker="asReactionPicker"
			:as-drawer="type === 'drawer'"
			:max-height="maxHeight"
			@chosen="chosen"
		/>
	</MkModal>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import MkModal from "@/components/MkModal.vue";
import MkEmojiPicker from "@/components/MkEmojiPicker.vue";
import { defaultStore } from "@/store";

withDefaults(
	defineProps<{
		manualShowing?: boolean | null;
		src?: HTMLElement;
		showPinned?: boolean;
		asReactionPicker?: boolean;
	}>(),
	{
		manualShowing: null,
		showPinned: true,
		asReactionPicker: false,
	},
);

const emit = defineEmits<{
	(ev: "done", v: any): void;
	(ev: "close"): void;
	(ev: "closed"): void;
}>();

const modal = ref<InstanceType<typeof MkModal>>();
const picker = ref<InstanceType<typeof MkEmojiPicker>>();

function checkForShift(ev?: MouseEvent) {
	if (ev?.shiftKey) return;
	modal.value?.close(ev);
}

function chosen(emoji: any, ev: MouseEvent) {
	emit("done", emoji);
	checkForShift(ev);
}

function opening() {
	try {
		picker.value?.reset();
	} catch (e) {
		console.error("Something's wrong with resetting the emoji picker", e);
	}
	picker.value?.focus();
}
</script>

<style lang="scss" scoped>
.ryghynhb {
	&.drawer {
		border-radius: 24px;
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 0;
	}
}
</style>
