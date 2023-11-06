<template>
	<button
		v-if="canRenote && $store.state.seperateRenoteQuote"
		v-tooltip.noDelay.bottom="i18n.ts.quote"
		class="eddddedb _button"
		@click.stop="quote()"
	>
		<i class="ph-quotes ph-bold ph-lg"></i>
	</button>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import type { Note } from "firefish-js/built/entities";
import { pleaseLogin } from "@/scripts/please-login";
import * as os from "@/os";
import { $i } from "@/account";
import { i18n } from "@/i18n";

const props = defineProps<{
	note: Note;
}>();

const canRenote = computed(
	() =>
		["public", "home"].includes(props.note.visibility) ||
		props.note.userId === $i?.id,
);

function quote(): void {
	pleaseLogin();
	os.post({
		renote: props.note,
	});
}
</script>

<style lang="scss" scoped>
.eddddedb {
	display: inline-block;
	height: 32px;
	margin: 2px;
	padding: 0 6px;
	border-radius: 4px;

	&.renoted {
		background: var(--accent);
	}

	> .count {
		display: inline;
		margin-left: 8px;
		opacity: 0.7;
	}
}
</style>
