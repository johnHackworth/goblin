<template>
	<XModalWindow
		ref="dialog"
		:width="800"
		@close="dialog?.close()"
		@closed="$emit('closed')"
	>
		<template #header>{{ i18n.ts._tutorial.title }}</template>


	</XModalWindow>
</template>

<script lang="ts" setup>
import { reactive, computed } from "vue";
import XSettings from "@/pages/settings/profile.vue";
import XModalWindow from "@/components/MkModalWindow.vue";
import MkButton from "@/components/MkButton.vue";
import XFeaturedUsers from "@/pages/explore.users.vue";
import XPostForm from "@/components/MkPostForm.vue";
import MkSparkle from "@/components/MkSparkle.vue";
import MkPushNotificationAllowButton from "@/components/MkPushNotificationAllowButton.vue";
import FormSwitch from "@/components/form/switch.vue";
import { defaultStore } from "@/store";
import { i18n } from "@/i18n";
import { $i } from "@/account";
import { instance } from "@/instance";

const isLocalTimelineAvailable =
	!instance.disableLocalTimeline ||
	($i != null && ($i.isModerator || $i.isAdmin));
const isRecommendedTimelineAvailable =
	!instance.disableRecommendedTimeline ||
	($i != null && ($i.isModerator || $i.isAdmin));
const isGlobalTimelineAvailable =
	!instance.disableGlobalTimeline ||
	($i != null && ($i.isModerator || $i.isAdmin));

let timelines = ["home"];

if (isLocalTimelineAvailable) {
	timelines.push("local");
}
if (isLocalTimelineAvailable) {
	timelines.push("social");
}
if (isRecommendedTimelineAvailable) {
	timelines.push("recommended");
}
if (isGlobalTimelineAvailable) {
	timelines.push("global");
}

const emit = defineEmits<{
	(ev: "done"): void;
	(ev: "closed"): void;
}>();

const dialog = $ref<InstanceType<typeof XModalWindow>>();

const tutorial = computed({
	get() {
		return defaultStore.reactiveState.tutorial.value || 0;
	},
	set(value) {
		defaultStore.set("tutorial", value);
	},
});

const autoplayMfm = computed(
	defaultStore.makeGetterSetter(
		"animatedMfm",
		(v) => !v,
		(v) => !v,
	),
);
const reduceAnimation = computed(
	defaultStore.makeGetterSetter(
		"animation",
		(v) => !v,
		(v) => !v,
	),
);

function close(res) {
	tutorial.value = -1;
	dialog.close();
}
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.2s ease-in-out;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.tbkwesmv {
	> ._content {
		> small {
			opacity: 0.7;
		}
	}

	> .navigation {
		display: flex;
		flex-direction: row;
		align-items: baseline;

		> .step {
			> .arrow {
				padding: 4px;

				&:disabled {
					opacity: 0.5;
				}

				&:first-child {
					padding-right: 8px;
				}

				&:last-child {
					padding-left: 8px;
				}
			}

			> span {
				margin: 0 4px;
			}
		}

		> .ok {
			margin-left: auto;
		}
	}
}
</style>
