<template>
	<button
		v-tooltip.noDelay.bottom="i18n.ts._gallery.like"
		class="button _button"
		:class="$style.root"
		ref="buttonRef"
		@click.stop="toggleStar($event)"
	>
		<span v-if="!reacted">
			<i
				v-if="instance.defaultReaction === '👍'"
				class="ph-thumbs-up ph-bold ph-lg"
			></i>
			<i
				v-else-if="instance.defaultReaction === '❤️'"
				class="ph-heart ph-bold ph-lg"
			></i>
			<i v-else class="ph-star ph-bold ph-lg"></i>
		</span>
		<span v-else>
			<i
				v-if="instance.defaultReaction === '👍'"
				class="ph-thumbs-up ph-bold ph-lg ph-fill"
				:class="$style.yellow"
			></i>
			<i
				v-else-if="instance.defaultReaction === '❤️'"
				class="ph-heart ph-bold ph-lg ph-fill"
				:class="$style.red"
			></i>
			<i
				v-else
				class="ph-star ph-bold ph-lg ph-fill"
				:class="$style.yellow"
			></i>
		</span>
		<template v-if="count > 0"
			><p class="count">{{ count }}</p></template
		>
	</button>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type { Note } from "firefish-js/built/entities";
import Ripple from "@/components/MkRipple.vue";
import XDetails from "@/components/MkUsersTooltip.vue";
import { pleaseLogin } from "@/scripts/please-login";
import * as os from "@/os";
import { defaultStore } from "@/store";
import { i18n } from "@/i18n";
import { instance } from "@/instance";
import { useTooltip } from "@/scripts/use-tooltip";

const props = defineProps<{
	note: Note;
	count: number;
	reacted: boolean;
}>();

const buttonRef = ref<HTMLElement>();

function toggleStar(ev?: MouseEvent): void {
	pleaseLogin();

	if (!props.reacted) {
		os.api("notes/reactions/create", {
			noteId: props.note.id,
			reaction: instance.defaultReaction,
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
	} else {
		os.api("notes/reactions/delete", {
			noteId: props.note.id,
		});
	}
}

useTooltip(buttonRef, async (showing) => {
	const reactions = await os.apiGet("notes/reactions", {
		noteId: props.note.id,
		limit: 11,
		_cacheKey_: props.count,
	});

	const users = reactions.map((x) => x.user);

	if (users.length < 1) return;

	os.popup(
		XDetails,
		{
			showing,
			users,
			count: props.count,
			targetElement: buttonRef.value,
		},
		{},
		"closed",
	);
});
</script>

<style lang="scss" module>
.yellow {
	color: var(--warn);
}

.red {
	color: var(--error);
}
</style>
