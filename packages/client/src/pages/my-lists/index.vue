<template>
	<MkStickyContainer>
		<template #header
			><MkPageHeader
				:actions="headerActions"
				:tabs="headerTabs"
				:display-back-button="true"
		/></template>
		<MkSpacer :content-max="700">
			<div class="qkcjvfiv">
				<MkInfo class="_gap" :icon="'list-bullets'" :card="true">
					<p>{{ i18n.ts.listsDesc }}</p>
					<MkButton primary class="add" @click="create"
						><i class="ph-plus ph-bold ph-lg"></i>
						{{ i18n.ts.createList }}</MkButton
					>
				</MkInfo>

				<MkPagination
					v-slot="{ items }"
					ref="pagingComponent"
					:pagination="pagination"
					class="lists _content"
				>
					<MkA
						v-for="list in items"
						:key="list.id"
						class="list _panel"
						:to="`/my/lists/${list.id}`"
					>
						<div class="name">{{ list.name }}</div>
						<MkAvatars :user-ids="list.userIds" />
					</MkA>
					<MkButton @click="deleteAll"
						><i class="ph-trash ph-bold ph-lg"></i>
						{{ i18n.ts.deleteAll }}</MkButton
					>
				</MkPagination>
			</div>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import {} from "vue";
import MkPagination from "@/components/MkPagination.vue";
import MkButton from "@/components/MkButton.vue";
import MkAvatars from "@/components/MkAvatars.vue";
import MkInfo from "@/components/MkInfo.vue";
import * as os from "@/os";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";

const pagingComponent = $ref<InstanceType<typeof MkPagination>>();

const pagination = {
	endpoint: "users/lists/list" as const,
	limit: 10,
};

async function create() {
	const { canceled, result: name } = await os.inputText({
		title: i18n.ts.enterListName,
	});
	if (canceled) return;
	await os.apiWithDialog("users/lists/create", { name: name });
	pagingComponent.reload();
}

async function deleteAll() {
	const { canceled } = await os.confirm({
		type: "warning",
		text: i18n.t("removeAreYouSure", { x: "all lists" }),
	});
	if (canceled) return;

	await os.api("users/lists/delete-all");
	os.success();
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.manageLists,
	icon: "ph-list-bullets ph-bold ph-lg",
	action: {
		icon: "ph-plus ph-bold ph-lg",
		handler: create,
	},
});
</script>

<style lang="scss" scoped>
.qkcjvfiv {
	> .lists {
		> .list {
			display: block;
			padding: 16px;
			border: solid 1px var(--divider);
			border-radius: 6px;

			&:hover {
				border: solid 1px var(--accent);
				text-decoration: none;
			}

			> .name {
				margin-bottom: 4px;
			}
		}
	}
}
</style>
