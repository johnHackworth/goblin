<template>
	<div class="sticky-container">
		<div ref="headerEl">
			<slot name="header"></slot>
		</div>
		<div ref="bodyEl" :data-sticky-container-header-height="headerHeight">
			<slot></slot>
		</div>
	</div>
</template>

<script lang="ts">
// なんか動かない
// const CURRENT_STICKY_TOP = Symbol('CURRENT_STICKY_TOP');
const CURRENT_STICKY_TOP = "CURRENT_STICKY_TOP";
</script>

<script lang="ts" setup>
import type { Ref } from "vue";
import { inject, onMounted, onUnmounted, provide, ref, watch } from "vue";

const headerEl = $ref<HTMLElement>();
const bodyEl = $ref<HTMLElement>();

let headerHeight = $ref<string | undefined>(),
	childStickyTop = $ref(0);
const parentStickyTop = inject<Ref<number>>(CURRENT_STICKY_TOP, ref(0));
provide(CURRENT_STICKY_TOP, $$(childStickyTop));

const calc = () => {
	childStickyTop = parentStickyTop.value + headerEl.offsetHeight;
	headerHeight = headerEl.offsetHeight.toString();
};

const observer = new ResizeObserver(() => {
	window.setTimeout(() => {
		calc();
	}, 100);
});

onMounted(() => {
	calc();

	watch(parentStickyTop, calc);

	watch(
		$$(childStickyTop),
		() => {
			bodyEl.style.setProperty("--stickyTop", `${childStickyTop}px`);
		},
		{
			immediate: true,
		},
	);

	observer.observe(headerEl);
});

onUnmounted(() => {
	observer.disconnect();
});
</script>

<style lang="scss">
.sticky-container {
	display: flex;
	flex-direction: column;
	> div:first-child {
		position: sticky;
		top: var(--stickyTop, 0);
		z-index: 1000;
	}
	> div:last-child {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
	}
}
</style>
