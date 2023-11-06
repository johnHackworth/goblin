<template>
	<button
		v-if="count > 0"
		ref="buttonRef"
		v-ripple="canToggle"
		class="hkzvhatu _button"
		:class="{
			reacted: note.myReaction == reaction,
			canToggle,
			newlyAdded: !isInitial,
		}"
		@click.stop="toggleReaction()"
	>
		<XReactionIcon
			class="icon"
			:reaction="reaction"
			:custom-emojis="note.emojis"
		/>
		<span class="count">{{ count }}</span>
	</button>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import * as misskey from "firefish-js";
import XDetails from "@/components/MkReactionsViewer.details.vue";
import XReactionIcon from "@/components/MkReactionIcon.vue";
import * as os from "@/os";
import { useTooltip } from "@/scripts/use-tooltip";
import { $i } from "@/account";

const props = defineProps<{
	reaction: string;
	count: number;
	isInitial: boolean;
	note: misskey.entities.Note;
}>();

const emit = defineEmits<{
	(ev: "reacted", v): void;
}>();

const buttonRef = ref<HTMLElement>();

const canToggle = computed(() => !props.reaction.match(/@\w/) && $i);

const toggleReaction = () => {
	if (!canToggle.value) return;

	const oldReaction = props.note.myReaction;
	if (oldReaction) {
		os.api("notes/reactions/delete", {
			noteId: props.note.id,
		}).then(() => {
			if (oldReaction !== props.reaction) {
				os.api("notes/reactions/create", {
					noteId: props.note.id,
					reaction: props.reaction,
				});
			}
		});
	} else {
		os.api("notes/reactions/create", {
			noteId: props.note.id,
			reaction: props.reaction,
		});
		emit("reacted");
	}
};

useTooltip(
	buttonRef,
	async (showing) => {
		const reactions = await os.apiGet("notes/reactions", {
			noteId: props.note.id,
			type: props.reaction,
			limit: 11,
			_cacheKey_: props.count,
		});

		const users = reactions.map((x) => x.user);

		os.popup(
			XDetails,
			{
				showing,
				reaction: props.reaction,
				emojis: props.note.emojis,
				users,
				count: props.count,
				targetElement: buttonRef.value,
			},
			{},
			"closed",
		);
	},
	100,
);
</script>

<style lang="scss" scoped>
.hkzvhatu {
	position: relative;
	display: inline-block;
	height: 32px;
	margin-block: 2px;
	padding: 0 8px;
	pointer-events: all;
	min-width: max-content;
	&::before {
		content: "";
		position: absolute;
		inset: 0 2px;
		border-radius: 4px;
		z-index: -1;
	}
	&.newlyAdded {
		animation: scaleInSmall 0.3s cubic-bezier(0, 0, 0, 1.2);
		:deep(.mk-emoji) {
			animation: scaleIn 0.4s cubic-bezier(0.7, 0, 0, 1.5);
		}
	}
	:deep(.mk-emoji) {
		transition: transform 0.4s cubic-bezier(0, 0, 0, 6);
	}
	&.reacted :deep(.mk-emoji) {
		transition: transform 0.4s cubic-bezier(0, 0, 0, 1);
	}
	&:active {
		:deep(.mk-emoji) {
			transition: transform 0.4s cubic-bezier(0, 0, 0, 1);
			transform: scale(0.85);
		}
	}
	&.canToggle {
		&::before {
			background: rgba(0, 0, 0, 0.05);
		}
		&:hover:not(.reacted)::before {
			background: rgba(0, 0, 0, 0.1);
		}
	}

	&:not(.canToggle) {
		cursor: default;
	}

	&.reacted {
		order: -1;
		&::before {
			background: var(--accent);
		}

		> .count {
			color: var(--fgOnAccent);
			font-weight: 600;
		}

		> .icon {
			filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
		}
	}

	> .count {
		font-size: 0.9em;
		line-height: 32px;
		margin: 0 0 0 4px;
	}
}
</style>
