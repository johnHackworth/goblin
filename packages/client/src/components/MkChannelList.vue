<template>
	<MkPagination :pagination="pagination">
		<template #empty>
			<div class="_fullinfo">
				<img
					src="/static-assets/badges/not-found.png"
					class="_ghost"
					:alt="i18n.ts.notFound"
				/>
				<div>{{ i18n.ts.notFound }}</div>
			</div>
		</template>

		<template #default="{ items }">
			<MkChannelPreview
				v-for="item in items"
				:key="item.id"
				class="_margin"
				:channel="extractor(item)"
			/>
		</template>
	</MkPagination>
</template>

<script lang="ts" setup>
import MkChannelPreview from "@/components/MkChannelPreview.vue";
import type { Paging } from "@/components/MkPagination.vue";
import MkPagination from "@/components/MkPagination.vue";
import { i18n } from "@/i18n";

const props = withDefaults(
	defineProps<{
		pagination: Paging;
		noGap?: boolean;
		extractor?: (item: any) => any;
	}>(),
	{
		extractor: (item) => item,
	},
);
</script>

<style lang="scss" scoped></style>
