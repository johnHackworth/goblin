<template>
	<MkStickyContainer v-if="props.acct === $i.username">
		<template #header
			><MkPageHeader :actions="headerActions" :tabs="headerTabs"
		/></template>
		<MkSpacer :content-max="1000">
			<transition name="fade" mode="out-in">
				<div v-if="user">
					<XHashtagFollowList />
				</div>
				<MkError v-else-if="error" @retry="fetchUser()" />
				<MkLoading v-else />
			</transition>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import {
	defineAsyncComponent,
	computed,
	inject,
	onMounted,
	onUnmounted,
	watch,
} from "vue";
import * as misskey from "firefish-js";
import XHashtagFollowList from "./follow-hashtags-list.vue";
import * as os from "@/os";
import { definePageMetadata } from "@/scripts/page-metadata";
import { i18n } from "@/i18n";
import { $i } from "@/account";

const props = withDefaults(
	defineProps<{
		acct: string;
	}>(),
	{},
);

let user = $ref<null | misskey.entities.UserDetailed>(null);
let error = $ref(null);

function fetchUser(): void {
	user = null;
	os.api("users/show", $i.username)
		.then((u) => {
			user = u;
		})
		.catch((err) => {
			error = err;
		});
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(
	computed(() => {
			return {
					icon: "ph-user ph-bold ph-lg",
					title: $i.name
						? `${$i.name} (@${$i.username})`
						: `@${$i.username}`,
					subtitle: "Hashtags",
					userName: $i.username,
					avatar: user
			  }}
	)
);
</script>

<style lang="scss" scoped></style>
