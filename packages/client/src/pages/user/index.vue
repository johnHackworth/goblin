<template>
	<MkStickyContainer>
		<div v-if="props.slug">
			<NotePage :slug="props.slug" :acct="props.acct" />
		</div>
		<div v-else>
			<transition name="fade" mode="out-in">
				<div v-if="user">
					<XHome
						:user="user"
						@refresh="fetchUser()"
					/>
				</div>
				<MkError v-else-if="error" @retry="fetchUser()" />
				<MkLoading v-else />
			</transition>
		</div>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, computed, watch } from "vue";
import calcAge from "s-age";
import * as Acct from "firefish-js/built/acct";
import type * as misskey from "firefish-js";
import { getScrollPosition } from "@/scripts/scroll";
import number from "@/filters/number";
import { userPage, acct as getAcct } from "@/filters/user";
import * as os from "@/os";
import { useRouter } from "@/router";
import { definePageMetadata } from "@/scripts/page-metadata";
import { i18n } from "@/i18n";
import { $i } from "@/account";
import NotePage from "@/pages/note/bySlug.vue";

const XHome = defineAsyncComponent(() => import("./home.vue"));

const props = defineProps<{
	acct: string;
	slug?: string;
}>();

const router = useRouter();

let user = $ref<null | misskey.entities.UserDetailed>(null);
let error = $ref(null);

function fetchUser(): void {
	if (props.acct == null) return;
	user = null;
	os.api("users/show", Acct.parse(props.acct))
		.then((u) => {
			user = u;
		})
		.catch((err) => {
			error = err;
		});
}

watch(() => props.acct, fetchUser, {
	immediate: true,
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() =>
	user
		? [
				{
					key: "home",
					title: i18n.ts.overview,
					icon: "ph-user ph-bold ph-lg",
				},
		  ]
		: null,
);

definePageMetadata(
	computed(() =>
		user
			? {
					icon: "ph-user ph-bold ph-lg",
					title: user.name
						? `${user.name} (@${user.username})`
						: `@${user.username}`,
					subtitle: `@${getAcct(user)}`,
					userName: user,
					avatar: user,
					path: `/@${user.username}`,
					share: {
						title: user.name,
					},
			  }
			: null,
	),
);
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.125s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
