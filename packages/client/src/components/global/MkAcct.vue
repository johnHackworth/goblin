<template>
	<span class="mk-acct">
		<span class="name">{{ user.username.endsWith('_at_tumblr_com') ? user.username.replace('_at_tumblr_com', '.tumblr.com') : `@${user.username}` }}</span>
		<span
			v-if="(user.host || detail || $store.state.showFullAcct) && !user.username.endsWith('_at_tumblr_com')"
			class="host"
			>@{{ user.host || host }}
		</span>
	</span>
</template>

<script lang="ts" setup>
import type * as misskey from "firefish-js";
import { toUnicode } from "punycode/";
import { host as hostRaw } from "@/config";

defineProps<{
	user: misskey.entities.UserDetailed;
	detail?: boolean;
}>();

const host = toUnicode(hostRaw);
</script>

<style lang="scss" scoped>
.mk-acct {
	> .host {
		opacity: 0.5;
	}
}
</style>
