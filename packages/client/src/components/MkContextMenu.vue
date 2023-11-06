<template>
	<transition :name="$store.state.animation ? 'fade' : ''" appear>
		<div
			ref="rootEl"
			class="nvlagfpb"
			:style="{ zIndex }"
			@contextmenu.prevent.stop="() => {}"
		>
			<MkMenu :items="items" :align="'left'" @close="$emit('closed')" />
		</div>
	</transition>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted } from "vue";
import MkMenu from "./MkMenu.vue";
import type { MenuItem } from "./types/menu.vue";
import contains from "@/scripts/contains";
import * as os from "@/os";

const props = defineProps<{
	items: MenuItem[];
	ev: MouseEvent;
}>();

const emit = defineEmits<{
	(ev: "closed"): void;
}>();

const rootEl = $ref<HTMLDivElement>();

const zIndex = $ref<number>(os.claimZIndex("high"));

onMounted(() => {
	let left = props.ev.pageX + 1, // 間違って右ダブルクリックした場合に意図せずアイテムがクリックされるのを防ぐため + 1
		top = props.ev.pageY + 1; // 間違って右ダブルクリックした場合に意図せずアイテムがクリックされるのを防ぐため + 1

	const width = rootEl.offsetWidth;
	const height = rootEl.offsetHeight;

	if (left + width - window.pageXOffset > window.innerWidth) {
		left = window.innerWidth - width + window.pageXOffset;
	}

	if (top + height - window.pageYOffset > window.innerHeight) {
		top = window.innerHeight - height + window.pageYOffset;
	}

	if (top < 0) {
		top = 0;
	}

	if (left < 0) {
		left = 0;
	}

	rootEl.style.top = `${top}px`;
	rootEl.style.left = `${left}px`;

	document.body.addEventListener("mousedown", onMousedown);
});

onBeforeUnmount(() => {
	document.body.removeEventListener("mousedown", onMousedown);
});

function onMousedown(evt: Event) {
	if (!contains(rootEl, evt.target) && rootEl !== evt.target) emit("closed");
}
</script>

<style lang="scss" scoped>
.nvlagfpb {
	position: absolute;
}

.fade-enter-active,
.fade-leave-active {
	transition:
		opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
		transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	transform-origin: left top;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
	transform: scale(0.9);
}
</style>
