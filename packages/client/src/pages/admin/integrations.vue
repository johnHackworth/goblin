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
				<FormFolder class="_formBlock">
					<template #icon
						><i class="ph-github-logo ph-bold ph-lg"></i
					></template>
					<template #label>GitHub</template>
					<template #suffix>{{
						enableGithubIntegration
							? i18n.ts.enabled
							: i18n.ts.disabled
					}}</template>
					<XGithub />
				</FormFolder>
				<FormFolder class="_formBlock">
					<template #icon
						><i class="ph-discord-logo ph-bold ph-lg"></i
					></template>
					<template #label>Discord</template>
					<template #suffix>{{
						enableDiscordIntegration
							? i18n.ts.enabled
							: i18n.ts.disabled
					}}</template>
					<XDiscord />
				</FormFolder>
			</FormSuspense>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import {} from "vue";
import XGithub from "./integrations.github.vue";
import XDiscord from "./integrations.discord.vue";
import FormSuspense from "@/components/form/suspense.vue";
import FormFolder from "@/components/form/folder.vue";
import * as os from "@/os";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";

let enableTwitterIntegration: boolean = $ref(false);
let enableGithubIntegration: boolean = $ref(false);
let enableDiscordIntegration: boolean = $ref(false);

async function init() {
	const meta = await os.api("admin/meta");
	enableTwitterIntegration = meta.enableTwitterIntegration;
	enableGithubIntegration = meta.enableGithubIntegration;
	enableDiscordIntegration = meta.enableDiscordIntegration;
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.integration,
	icon: "ph-plug ph-bold ph-lg",
});
</script>
