<template>
	<button
		v-tooltip.noDelay.bottom="i18n.ts._gallery.like"
		class="button _button"
		@click.stop="star($event)"
	>
		<svg
			v-if="defaultStore.state.woozyMode === true"
			width="1.1em"
			height="1.1em"
			viewBox="0 0 36 36"
		>
			<g fill="currentColor">
				<path
					d="m17.809-0.20898c-9.9294 2.3e-7 -18 8.0706-18 18 5.8e-7 9.9294 8.0706 18 18 18 9.9294 0 18-8.0706 18-18 0-9.9294-8.0706-18-18-18zm0 1.9785c8.8604 1e-7 16.021 7.1611 16.021 16.021 0 8.8604-7.1611 16.023-16.021 16.023-8.8604 0-16.021-7.163-16.021-16.023-3e-7 -8.8604 7.1611-16.021 16.021-16.021z"
				/>
				<path
					d="m6.001 11c-0.552 0-1-0.448-1-1 0-0.551 0.445-0.998 0.996-1 0.156-2e-3 3.569-0.086 6.205-3.6 0.331-0.44 0.957-0.532 1.4-0.2 0.442 0.331 0.531 0.958 0.2 1.4-3.263 4.35-7.617 4.4-7.801 4.4zm24.986 2.393c0.128 0.537-0.204 1.077-0.741 1.205-0.536 0.128-1.074-0.202-1.204-0.737-0.038-0.151-0.911-3.452-4.941-5.201-0.505-0.22-0.739-0.808-0.519-1.315s0.809-0.739 1.315-0.519c4.989 2.165 6.047 6.388 6.09 6.567z"
				/>
				<path
					d="m23.186 29.526c-0.993 0-1.952-0.455-2.788-1.339-2.816-2.985-3.569-2.333-4.817-1.251-0.781 0.679-1.754 1.523-3.205 1.523-2.351 0-3.969-2.302-4.036-2.4-0.314-0.454-0.2-1.077 0.254-1.391 0.451-0.312 1.074-0.2 1.39 0.251 0.301 0.429 1.317 1.54 2.393 1.54 0.704 0 1.256-0.479 1.895-1.033 1.816-1.578 3.764-2.655 7.583 1.388 0.823 0.873 1.452 0.774 1.908 0.592 1.659-0.665 3.205-3.698 3.197-5.15-3e-3 -0.552 0.442-1.002 0.994-1.005h6e-3c0.55 0 0.997 0.444 1 0.995 0.012 2.103-1.854 5.976-4.454 7.017-0.443 0.175-0.885 0.262-1.32 0.263z"
				/>
				<path
					d="m14.815 15.375c-0.584 2.114-1.642 3.083-3.152 2.666-1.509-0.417-2.343-1.909-1.76-4.023 0.583-2.112 2.175-3.363 3.684-2.946 1.511 0.417 1.812 2.19 1.228 4.303zm11.416-0.755c0.473 2.141-0.675 4.838-2.204 5.176s-3.28-1.719-3.753-3.86c-0.473-2.14 0.419-3.971 1.948-4.309s3.536 0.853 4.009 2.993z"
				/>
			</g>
		</svg>
		<i
			v-else-if="instance.defaultReaction === '👍'"
			class="ph-thumbs-up ph-bold ph-lg"
		></i>
		<i
			v-else-if="instance.defaultReaction === '❤️'"
			class="ph-heart ph-bold ph-lg"
		></i>
		<i v-else class="ph-star ph-bold ph-lg"></i>
	</button>
</template>

<script lang="ts" setup>
import type { Note } from "firefish-js/built/entities";
import Ripple from "@/components/MkRipple.vue";
import { pleaseLogin } from "@/scripts/please-login";
import * as os from "@/os";
import { defaultStore } from "@/store";
import { i18n } from "@/i18n";
import { instance } from "@/instance";

const props = defineProps<{
	note: Note;
}>();

function star(ev?: MouseEvent): void {
	pleaseLogin();
	os.api("notes/reactions/create", {
		noteId: props.note.id,
		reaction:
			defaultStore.state.woozyMode === true
				? "🥴"
				: instance.defaultReaction,
	});
	const el =
		ev &&
		((ev.currentTarget ?? ev.target) as HTMLElement | null | undefined);
	if (el) {
		const rect = el.getBoundingClientRect();
		const x = rect.left + el.offsetWidth / 2;
		const y = rect.top + el.offsetHeight / 2;
		os.popup(Ripple, { x, y }, {}, "end");
	}
}
</script>
