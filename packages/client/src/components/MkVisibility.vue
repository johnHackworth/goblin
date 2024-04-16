<template>
	<span v-if="note.localOnly" :class="$style.localOnly">
		<span>
			<i
				class="ph-buildings ph-bold ph-lg"
				v-tooltip="i18n.ts._visibility.localOnly"
			></i> <span class="visibilityNote"> {{ i18n.ts._visibility.localOnlyHeader }}</span>
		</span>
	</span>
	<span v-else="note.visibility !== 'public'" :class="$style.visibility">
		<span	v-if="note.visibility === 'home'">
			<i
				class="ph-house ph-bold ph-lg"
				v-tooltip="i18n.ts._visibility.home"
			></i> <span class="visibilityNote"> {{ i18n.ts._visibility.homeHeader }}</span>
		</span>
		<span	v-else-if="note.visibility === 'followers'">
			<i
				class="ph-lock ph-bold ph-lg"
				v-tooltip="i18n.ts._visibility.followers"
			></i> <span class="visibilityNote"> {{ i18n.ts._visibility.followersHeader }}</span>
		</span>
		<span	v-else-if="note.visibility === 'specified'">
			<i
				ref="specified"
				class="ph-envelope-simple-open ph-bold ph-lg"
			></i> <span class="visibilityNote"> {{ i18n.ts._visibility.specifiedHeader }}</span>
		</span>
	</span>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import XDetails from "@/components/MkUsersTooltip.vue";
import * as os from "@/os";
import { useTooltip } from "@/scripts/use-tooltip";
import { i18n } from "@/i18n";

const props = defineProps<{
	note: {
		visibility: string;
		localOnly?: boolean;
		visibleUserIds?: string[];
	};
}>();

const specified = $ref<HTMLElement>();

if (props.note.visibility === "specified") {
	useTooltip($$(specified), async (showing) => {
		const users = await os.api("users/show", {
			userIds: props.note.visibleUserIds,
			limit: 10,
		});

		os.popup(
			XDetails,
			{
				showing,
				users,
				count: props.note.visibleUserIds.length,
				targetElement: specified,
			},
			{},
			"closed",
		);
	});
}
</script>

<style lang="scss" module>
.visibility,
.localOnly {
	margin-left: 0.5em;
}
</style>
