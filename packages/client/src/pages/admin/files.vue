<template>
	<div>
		<MkStickyContainer>
			<template #header
				><MkPageHeader :actions="headerActions"
			/></template>
			<MkSpacer :content-max="900">
				<div class="xrmjdkdw">
					<div>
						<div
							class="inputs"
							style="
								display: flex;
								gap: var(--margin);
								flex-wrap: wrap;
							"
						>
							<MkSelect
								v-model="origin"
								style="margin: 0; flex: 1"
							>
								<template #label>{{
									i18n.ts.instance
								}}</template>
								<option value="combined">
									{{ i18n.ts.all }}
								</option>
								<option value="local">
									{{ i18n.ts.local }}
								</option>
								<option value="remote">
									{{ i18n.ts.remote }}
								</option>
							</MkSelect>
							<MkInput
								v-model="searchHost"
								:debounce="true"
								type="search"
								style="margin: 0; flex: 1"
								:disabled="pagination.params.origin === 'local'"
							>
								<template #label>{{ i18n.ts.host }}</template>
							</MkInput>
						</div>
						<div
							class="inputs"
							style="
								display: flex;
								gap: var(--margin);
								flex-wrap: wrap;
								padding-top: 1.2em;
							"
						>
							<MkInput
								v-model="userId"
								:debounce="true"
								type="search"
								style="margin: 0; flex: 1"
							>
								<template #label>User ID</template>
							</MkInput>
							<MkInput
								v-model="type"
								:debounce="true"
								type="search"
								style="margin: 0; flex: 1"
							>
								<template #label>MIME type</template>
							</MkInput>
						</div>
						<MkFileListForAdmin
							:pagination="pagination"
							:view-mode="viewMode"
						/>
					</div>
				</div>
			</MkSpacer>
		</MkStickyContainer>
	</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent } from "vue";
import * as Acct from "firefish-js/built/acct";
import MkButton from "@/components/MkButton.vue";
import MkInput from "@/components/form/input.vue";
import MkSelect from "@/components/form/select.vue";
import MkFileListForAdmin from "@/components/MkFileListForAdmin.vue";
import { lookupFile } from "@/scripts/lookup-file";
import * as os from "@/os";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";

let origin = $ref("local");
let type = $ref(null);
let searchHost = $ref("");
let userId = $ref("");
let viewMode = $ref("grid");
const pagination = {
	endpoint: "admin/drive/files" as const,
	limit: 10,
	params: computed(() => ({
		type: type && type !== "" ? type : null,
		userId: userId && userId !== "" ? userId : null,
		origin: origin,
		hostname: searchHost && searchHost !== "" ? searchHost : null,
	})),
};

function clear() {
	os.confirm({
		type: "warning",
		text: i18n.ts.clearCachedFilesConfirm,
	}).then(({ canceled }) => {
		if (canceled) return;

		os.apiWithDialog("admin/drive/clean-remote-files", {});
	});
}

const headerActions = $computed(() => [
	{
		text: i18n.ts.lookup,
		icon: "ph-magnifying-glass ph-bold ph-lg",
		handler: lookupFile,
	},
	{
		text: i18n.ts.clearCachedFiles,
		icon: "ph-trash ph-bold ph-lg",
		handler: clear,
	},
]);

const headerTabs = $computed(() => []);

definePageMetadata(
	computed(() => ({
		title: i18n.ts.files,
		icon: "ph-cloud ph-bold ph-lg",
	})),
);
</script>

<style lang="scss" scoped>
.xrmjdkdw {
	margin: var(--margin);
}
</style>
