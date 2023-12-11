<template>
	<button
		v-if="canRenote"
		ref="buttonRef"
		v-tooltip.noDelay.bottom="i18n.ts.renote"
		class="button _button canRenote"
		:class="{ renoted: hasRenotedBefore }"
		@click.stop="renote(false, $event)"
	>
		<i class="ph-repeat ph-bold ph-lg"></i>
		<p v-if="count > 0 && !detailedView" class="count">{{ count }}</p>
	</button>
	<button
		v-else
		class="eddddedb _button"
		disabled="true"
		v-tooltip.noDelay.bottom="i18n.ts.disabled"
	>
		<i class="ph-repeat ph-bold ph-lg"></i>
	</button>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import type * as misskey from "firefish-js";
import Ripple from "@/components/MkRipple.vue";
import XDetails from "@/components/MkUsersTooltip.vue";
import { pleaseLogin } from "@/scripts/please-login";
import * as os from "@/os";
import { $i } from "@/account";
import { useTooltip } from "@/scripts/use-tooltip";
import { i18n } from "@/i18n";
import { defaultStore } from "@/store";
import { MenuItem } from "@/types/menu";

const props = defineProps<{
	note: misskey.entities.Note;
	count: number;
	detailedView?;
}>();

const buttonRef = ref<HTMLElement>();

const canRenote = computed(
	() =>
		["public", "home"].includes(props.note.visibility) ||
		props.note.userId === $i.id,
);

useTooltip(buttonRef, async (showing) => {
	const renotes = await os.api("notes/renotes", {
		noteId: props.note.id,
		limit: 11,
	});

	const users = renotes.map((x) => x.user);

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

let hasRenotedBefore = $ref(false);
os.api("notes/renotes", {
	noteId: props.note.id,
	userId: $i.id,
	limit: 1,
}).then((res) => {
	hasRenotedBefore = res.length > 0;
});

const renote = (viaKeyboard = false, ev?: MouseEvent) => {
	if(ev && ev.ctrlKey) {
		return directRenote(viaKeyboard, ev);
	} else {
		pleaseLogin();
		os.post({
			renote: props.note,
		});
	}
}

const directRenote  = (viaKeyboard = false, ev?: MouseEvent) => {
	let buttonActions: Array<MenuItem> = [];

	if (props.note.visibility === "public") {
		buttonActions.push({
			text: i18n.ts.renote,
			icon: "ph-repeat ph-bold ph-lg",
			danger: false,
			action: () => {
				os.api("notes/create", {
					renoteId: props.note.id,
					visibility: "public",
				});
				hasRenotedBefore = true;
				const el =
					ev &&
					((ev.currentTarget ?? ev.target) as
						| HTMLElement
						| null
						| undefined);
				if (el) {
					const rect = el.getBoundingClientRect();
					const x = rect.left + el.offsetWidth / 2;
					const y = rect.top + el.offsetHeight / 2;
					os.popup(Ripple, { x, y }, {}, "end");
				}
			},
		});
	}

	if (["public", "home"].includes(props.note.visibility)) {
		buttonActions.push({
			text: `${i18n.ts.renote} (${i18n.ts._visibility.home})`,
			icon: "ph-house ph-bold ph-lg",
			danger: false,
			action: () => {
				os.api("notes/create", {
					renoteId: props.note.id,
					visibility: "home",
				});
				hasRenotedBefore = true;
				const el =
					ev &&
					((ev.currentTarget ?? ev.target) as
						| HTMLElement
						| null
						| undefined);
				if (el) {
					const rect = el.getBoundingClientRect();
					const x = rect.left + el.offsetWidth / 2;
					const y = rect.top + el.offsetHeight / 2;
					os.popup(Ripple, { x, y }, {}, "end");
				}
			},
		});
	}

	if (props.note.visibility === "specified") {
		buttonActions.push({
			text: `${i18n.ts.renote} (${i18n.ts.recipient})`,
			icon: "ph-envelope-simple-open ph-bold ph-lg",
			danger: false,
			action: () => {
				os.api("notes/create", {
					renoteId: props.note.id,
					visibility: "specified",
					visibleUserIds: props.note.visibleUserIds,
				});
				hasRenotedBefore = true;
				const el =
					ev &&
					((ev.currentTarget ?? ev.target) as
						| HTMLElement
						| null
						| undefined);
				if (el) {
					const rect = el.getBoundingClientRect();
					const x = rect.left + el.offsetWidth / 2;
					const y = rect.top + el.offsetHeight / 2;
					os.popup(Ripple, { x, y }, {}, "end");
				}
			},
		});
	} else {
		buttonActions.push({
			text: `${i18n.ts.renote} (${i18n.ts._visibility.followers})`,
			icon: "ph-lock ph-bold ph-lg",
			danger: false,
			action: () => {
				os.api("notes/create", {
					renoteId: props.note.id,
					visibility: "followers",
				});
				hasRenotedBefore = true;
				const el =
					ev &&
					((ev.currentTarget ?? ev.target) as
						| HTMLElement
						| null
						| undefined);
				if (el) {
					const rect = el.getBoundingClientRect();
					const x = rect.left + el.offsetWidth / 2;
					const y = rect.top + el.offsetHeight / 2;
					os.popup(Ripple, { x, y }, {}, "end");
				}
			},
		});
	}

	if (canRenote) {
		buttonActions.push({
			text: `${i18n.ts.renote} (${i18n.ts.local})`,
			icon: "ph-hand-fist ph-bold ph-lg",
			danger: false,
			action: () => {
				os.api(
					"notes/create",
					props.note.visibility === "specified"
						? {
								renoteId: props.note.id,
								visibility: props.note.visibility,
								visibleUserIds: props.note.visibleUserIds,
								localOnly: true,
						  }
						: {
								renoteId: props.note.id,
								visibility: props.note.visibility,
								localOnly: true,
						  },
				);
				hasRenotedBefore = true;
				const el =
					ev &&
					((ev.currentTarget ?? ev.target) as
						| HTMLElement
						| null
						| undefined);
				if (el) {
					const rect = el.getBoundingClientRect();
					const x = rect.left + el.offsetWidth / 2;
					const y = rect.top + el.offsetHeight / 2;
					os.popup(Ripple, { x, y }, {}, "end");
				}
			},
		});
	}


	if (hasRenotedBefore) {
		buttonActions.push({
			text: i18n.ts.unrenote,
			icon: "ph-trash ph-bold ph-lg",
			danger: true,
			action: () => {
				os.api("notes/unrenote", {
					noteId: props.note.id,
				});
				hasRenotedBefore = false;
			},
		});
	}

	buttonActions[0].textStyle = "font-weight: bold";

	os.popupMenu(buttonActions, buttonRef.value, { viaKeyboard });
};
</script>

<style lang="scss" scoped>
.button {
	&:not(.canRenote) {
		cursor: default;
	}
	&.renoted {
		color: var(--accent) !important;
		opacity: 1 !important;
		font-weight: 700;
	}
}
</style>
