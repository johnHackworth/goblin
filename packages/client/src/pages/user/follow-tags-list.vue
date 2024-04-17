<template>
	<div>
		<MkPagination
			v-slot="{ items }"
			ref="list"
			:pagination="
				type === 'following' ? followingPagination : blockedPagination
			"
			class="mk-following-or-followers"
		>
			<div class="tags">
				<MkTagInfo
					v-for="tag in items"
					:key="tag.id"
					class="tag"
					:tag="tag"
				/>
			</div>
		</MkPagination>
	</div>
</template>

<script lang="ts" setup>
import MkTagInfo from "@/components/MkTagInfo.vue";
import MkPagination from "@/components/MkPagination.vue";

const props = defineProps<{
	type: "following" | "followers";
}>();

const followingPagination = {
	endpoint: "hashtags/timeline/followed" as const,
	limit: 20
};

const blockedPagination = {
	endpoint: "hashtags/timeline/blocked" as const,
	limit: 20
};
</script>

<style lang="scss" scoped>
.mk-following-or-followers {
	> .tags {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		grid-gap: var(--margin);
	}
}
</style>
