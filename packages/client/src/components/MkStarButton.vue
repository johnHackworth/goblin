<template>
	<button
		v-tooltip.noDelay.bottom="i18n.ts._gallery.like"
		class="button _button"
		:class="props.note.myReaction === instance.defaultReaction? 'isFull': null"
		@click.stop="toggle($event)"
	>
		<i
			class="ph-star ph-bold ph-lg"
			:class="props.note.myReaction === instance.defaultReaction? 'ph-fill': null"
		></i>
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
	isFull: Boolean;
}>();

const emit = defineEmits<{
	(ev: "reacted", v): void;
}>();

function toggle(ev?: MouseEvent): void {
	const oldReaction = props.note.myReaction;
	if (oldReaction) {
		os.api("notes/reactions/delete", {
			noteId: props.note.id,
		}).then(()=>{
		props.note.myReaction = null;
		emit("reacted");
	});
	} else {
		star(ev);
	}
}

function star(ev?: MouseEvent): void {
	pleaseLogin();
	os.api("notes/reactions/create", {
		noteId: props.note.id,
		reaction: instance.defaultReaction,
	}).then(()=>{
		props.note.myReaction = instance.defaultReaction;
		emit("reacted");
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


<style lang="scss" scoped>
	.isFull {
		i {
			color: var(--infoWarnFg);
		}
	}
</style>