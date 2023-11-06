<template>
	<MkStickyContainer>
		<template #header
			><MkPageHeader
				:actions="headerActions"
				:tabs="headerTabs"
				:display-back-button="true"
		/></template>
		<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
			<FormSuspense :p="init">
				<MkInfo class="_formBlock">{{
					i18n.ts.proxyAccountDescription
				}}</MkInfo>
				<MkKeyValue class="_formBlock">
					<template #key>{{ i18n.ts.proxyAccount }}</template>
					<template #value>{{
						proxyAccount
							? `@${proxyAccount.username}`
							: i18n.ts.none
					}}</template>
				</MkKeyValue>

				<MkButton
					primary
					class="_formBlock"
					@click="chooseProxyAccount"
					>{{ i18n.ts.selectAccount }}</MkButton
				>
				<MkButton danger class="_formBlock" @click="del">{{
					i18n.ts.remove
				}}</MkButton>
			</FormSuspense>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import {} from "vue";
import MkKeyValue from "@/components/MkKeyValue.vue";
import MkButton from "@/components/MkButton.vue";
import MkInfo from "@/components/MkInfo.vue";
import FormSuspense from "@/components/form/suspense.vue";
import * as os from "@/os";
import { fetchInstance } from "@/instance";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";

let proxyAccount: any = $ref(null);
let proxyAccountId: any = $ref(null);

async function init() {
	const meta = await os.api("admin/meta");
	proxyAccountId = meta.proxyAccountId;
	if (proxyAccountId) {
		proxyAccount = await os.api("users/show", { userId: proxyAccountId });
	}
}

function chooseProxyAccount() {
	os.selectLocalUser().then((user) => {
		proxyAccount = user;
		proxyAccountId = user.id;
		save();
	});
}

function save() {
	os.apiWithDialog("admin/update-meta", {
		proxyAccountId: proxyAccountId,
	}).then(() => {
		fetchInstance();
	});
}

function del() {
	os.apiWithDialog("admin/update-meta", {
		proxyAccountId: null,
	}).then(() => {
		fetchInstance();
	});
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.proxyAccount,
	icon: "ph-ghost ph-bold ph-lg",
});
</script>
