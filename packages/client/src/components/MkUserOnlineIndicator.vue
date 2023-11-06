<template>
	<div v-tooltip="text" class="fzgwjkgc" :class="user.onlineStatus"></div>
</template>

<script lang="ts" setup>
import {} from "vue";
import * as misskey from "firefish-js";
import { i18n } from "@/i18n";

const props = defineProps<{
	user: misskey.entities.User;
}>();

const text = $computed(() => {
	switch (props.user.onlineStatus) {
		case "online":
			return i18n.ts.online;
		case "active":
			return i18n.ts.active;
		case "offline":
			return i18n.ts.offline;
		case "unknown":
			return i18n.ts.unknown;
	}
});
</script>

<style lang="scss" scoped>
.fzgwjkgc {
	box-shadow: 0 0 0 3px var(--panel);
	border-radius: 120%; // Blinkのバグか知らんけど、100%ぴったりにすると何故か若干楕円でレンダリングされる

	&.online {
		background: #9ccfd8;
	}

	&.active {
		background: #f6c177;
	}

	&.offline {
		background: #eb6f92;
	}

	&.unknown {
		background: #6e6a86;
	}
}
</style>
