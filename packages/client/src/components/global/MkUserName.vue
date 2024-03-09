<template>
	<Mfm
		:class="$style.root"
		:text="(user.username.endsWith('_at_tumblr_com') && user.username.replace('_at_tumblr_com', ' (Tumblr)')) || user.name || user.username"
		:plain="true"
		:nowrap="nowrap"
		:custom-emojis="user.emojis"
	/>
</template>

<script lang="ts" setup>
import {} from "vue";
import type * as misskey from "firefish-js";

const props = withDefaults(
	defineProps<{
		user: misskey.entities.User;
		nowrap?: boolean;
	}>(),
	{
		nowrap: true,
	},
);
</script>

<style lang="scss" module>
.root {
	unicode-bidi: isolate;
}
</style>
