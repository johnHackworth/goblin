<template>
	<MkSpacer :content-max="800">
		<MkTab v-model="tab" style="margin-bottom: var(--margin)">
			<option value="local">{{ i18n.ts.local }}</option>
			<option value="remote">{{ i18n.ts.remote }}</option>
		</MkTab>
		<XNotes v-if="tab === 'local'" :pagination="paginationForLocal" />
		<XNotes
			v-else-if="tab === 'remote'"
			:pagination="paginationForRemote"
		/>
	</MkSpacer>
</template>

<script lang="ts" setup>
import XNotes from "@/components/MkNotes.vue";
import MkTab from "@/components/MkTab.vue";
import { i18n } from "@/i18n";

const paginationForLocal = {
	endpoint: "notes/featured" as const,
	limit: 10,
	origin: "local",
	offsetMode: true,
	params: {
		days: 14,
	},
};

const paginationForRemote = {
	endpoint: "notes/featured" as const,
	limit: 20,
	offsetMode: true,
	params: {
		origin: "remote",
		days: 7,
	},
};

// const paginationForRemote = {
// 	endpoint: 'notes/polls/recommendation' as const,
// 	limit: 10,
// 	offsetMode: true,
// };

let tab = $ref("local");
</script>
