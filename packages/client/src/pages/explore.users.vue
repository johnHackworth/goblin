4.8 KiB
<template>
	<MkSpacer :content-max="1200">
		<MkTab v-model="origin" style="margin-bottom: var(--margin)">
			<option value="local">{{ i18n.ts.local }}</option>
			<option value="remote">{{ i18n.ts.remote }}</option>
		</MkTab>
		<div v-if="origin === 'local'">
			<template v-if="tag == null">
				<MkFolder class="_gap" persist-key="explore-pinned-users">
					<template #header
						><i
							class="ph-bookmark ph-bold ph-lg ph-fw"
							style="margin-right: 0.5em"
						></i
						>{{ i18n.ts.pinnedUsers }}</template
					>
					<XUserList :pagination="pinnedUsers" />
				</MkFolder>
				<MkFolder
					v-if="$i != null"
					class="_gap"
					persist-key="explore-popular-users"
				>
					<template #header
						><i
							class="ph-chart-line-up ph-bold ph-lg ph-fw"
							style="margin-right: 0.5em"
						></i
						>{{ i18n.ts.popularUsers }}</template
					>
					<XUserList :pagination="popularUsers" />
				</MkFolder>
				<MkFolder
					v-if="$i != null"
					class="_gap"
					persist-key="explore-recently-updated-users"
				>
					<template #header
						><i
							class="ph-activity ph-bold ph-lg ph-fw"
							style="margin-right: 0.5em"
						></i
						>{{ i18n.ts.recentlyUpdatedUsers }}</template
					>
					<XUserList :pagination="recentlyUpdatedUsers" />
				</MkFolder>
				<MkFolder
					v-if="$i != null"
					class="_gap"
					persist-key="explore-recently-registered-users"
				>
					<template #header
						><i
							class="ph-butterfly ph-bold ph-lg ph-fw"
							style="margin-right: 0.5em"
						></i
						>{{ i18n.ts.recentlyRegisteredUsers }}</template
					>
					<XUserList :pagination="recentlyRegisteredUsers" />
				</MkFolder>
			</template>
		</div>
		<div v-else>
			<MkFolder
				ref="tagsEl"
				:foldable="true"
				:expanded="false"
				class="_gap"
			>
				<template #header
					><i
						class="ph-compass ph-bold ph-lg ph-fw"
						style="margin-right: 0.5em"
					></i
					>{{ i18n.ts.popularTags }}</template
				>

				<div class="vxjfqztj">
					<span v-for="tag in tagsLocal">
						<MkA
                                                v-if="tag.mostPopular"
                                                :key="'local:mostPopular:' + tag.tag"
                                                :to="`/tags/${tag.tag}`"
                                                class="local mostPopular"
                                                >{{ tag.tag }}</MkA
                                        >
						<MkA
                                                v-else-if="tag.popular"
                                                :key="'local:popular:' + tag.tag"
                                                :to="`/tags/${tag.tag}`"
                                                class="local popular"
                                                >{{ tag.tag }}</MkA
                                        >
						<MkA
                                                v-else
                                                :key="'local:normal:' + tag.tag"
                                                :to="`/tags/${tag.tag}`"
                                                class="local"
                                                >{{ tag.tag }}</MkA
                                        >
					</span>
					
					<span v-for="tag in tagsRemote">
						<MkA
                                                v-if="tag.mostPopular"
                                                :key="'remote:mostPopular:' + tag.tag"
                                                :to="`/tags/${tag.tag}`"
                                                class="remote mostPopular"
                                                >{{ tag.tag }}</MkA
								>
						<MkA
                                                v-else-if="tag.popular"
                                                :key="'remote:popular:' + tag.tag"
                                                :to="`/tags/${tag.tag}`"
                                                class="remote popular"
                                                >{{ tag.tag }}</MkA
                                        >
						<MkA
                                                v-else
                                                :key="'remote:normal:' + tag.tag"
                                                :to="`/tags/${tag.tag}`"
                                                class="remote"
                                                >{{ tag.tag }}</MkA
                                        >
					</span>
				</div>
			</MkFolder>

			<MkFolder v-if="tag != null" :key="`${tag}`" class="_gap">
				<template #header
					><i
						class="ph-hash ph-bold ph-lg ph-fw"
						style="margin-right: 0.5em"
					></i
					>{{ tag }}</template
				>
				<XUserList :pagination="tagUsers" />
			</MkFolder>

			<template v-if="tag == null && $i != null">
				<MkFolder class="_gap">
					<template #header
						><i
							class="ph-chart-line-up ph-bold ph-lg ph-fw"
							style="margin-right: 0.5em"
						></i
						>{{ i18n.ts.popularUsers }}</template
					>
					<XUserList :pagination="popularUsersF" />
				</MkFolder>
				<MkFolder class="_gap">
					<template #header
						><i
							class="ph-activity ph-bold ph-lg ph-fw"
							style="margin-right: 0.5em"
						></i
						>{{ i18n.ts.recentlyUpdatedUsers }}</template
					>
					<XUserList :pagination="recentlyUpdatedUsersF" />
				</MkFolder>
				<MkFolder class="_gap">
					<template #header
						><i
							class="ph-rocke-launch ph-bold ph-lg ph-fw"
							style="margin-right: 0.5em"
						></i
						>{{ i18n.ts.recentlyDiscoveredUsers }}</template
					>
					<XUserList :pagination="recentlyRegisteredUsersF" />
				</MkFolder>
			</template>
		</div>
	</MkSpacer>
</template>

<script lang="ts" setup>
import { watch } from "vue";
import XUserList from "@/components/MkUserList.vue";
import MkFolder from "@/components/MkFolder.vue";
import MkTab from "@/components/MkTab.vue";
import * as os from "@/os";
import { i18n } from "@/i18n";
import { $i } from "@/account";

const props = defineProps<{
	tag?: string;
}>();

let origin = $ref("local");
let tagsEl = $ref<InstanceType<typeof MkFolder>>();
let tagsLocal = $ref([]);
let tagsRemote = $ref([]);

watch(
	() => props.tag,
	() => {
		if (tagsEl) tagsEl.toggleContent(props.tag == null);
	},
);

const calculateDistribution = (tags, field) => {
	if (tags.length === 0) {
		return { mean: 0, max: 0 }
	} else {
		return {
			mean: tags.map(x => x[field]).reduce((i, a) => i + a) / tags.length,
			max: tags.map(x => x[field]).reduce((i, a) => Math.max(i, a))
		}
	}
}

const tagUsers = $computed(() => ({
	endpoint: "hashtags/users" as const,
	limit: 30,
	params: {
		tag: props.tag,
		origin: "combined",
		sort: "+follower",
	},
}));

const pinnedUsers = { endpoint: "pinned-users" };
const popularUsers = {
	endpoint: "users",
	limit: 10,
	noPaging: true,
	params: {
		state: "alive",
		origin: "local",
		sort: "+follower",
	},
};
const recentlyUpdatedUsers = {
	endpoint: "users",
	limit: 10,
	noPaging: true,
	params: {
		origin: "local",
		sort: "+updatedAt",
	},
};
const recentlyRegisteredUsers = {
	endpoint: "users",
	limit: 10,
	noPaging: true,
	params: {
		origin: "local",
		state: "alive",
		sort: "+createdAt",
	},
};
const popularUsersF = {
	endpoint: "users",
	limit: 10,
	noPaging: true,
	params: {
		state: "alive",
		origin: "remote",
		sort: "+follower",
	},
};
const recentlyUpdatedUsersF = {
	endpoint: "users",
	limit: 10,
	noPaging: true,
	params: {
		origin: "combined",
		sort: "+updatedAt",
	},
};
const recentlyRegisteredUsersF = {
	endpoint: "users",
	limit: 10,
	noPaging: true,
	params: {
		origin: "combined",
		sort: "+createdAt",
	},
};

os.api("hashtags/list", {
	sort: "+attachedLocalUsers",
	attachedToLocalUserOnly: true,
	limit: 30,
}).then((tags) => {
	const dist = calculateDistribution(tags, "attachedLocalUsersCount");
	tagsLocal = tags
		.sort((a, b) => a.tag < b.tag ? -1 : 1)
		.map(x => {
			return {
				...x,
				popular: x.attachedLocalUsersCount > dist.mean,
				mostPopular: x.attachedLocalUsersCount === dist.max,
			}
		});
	});
os.api("hashtags/list", {
	sort: "+attachedRemoteUsers",
	attachedToRemoteUserOnly: true,
	limit: 30,
}).then((tags) => {
	const dist = calculateDistribution(tags, "attachedRemoteUsersCount");
	tagsRemote = tags
		.sort((a, b) => a.tag < b.tag ? -1 : 1)
		.map(x => {
			return {
				...x,
				popular: x.attachedRemoteUsersCount > dist.mean,
				mostPopular: x.attachedRemoteUsersCount === dist.max
			}
		});
	});
</script>

<style lang="scss" scoped>
.vxjfqztj {
	> * {
		margin-right: 16px;
		color: var(--panelHighlight);
	}

	a {
			&.local { font-weight: bold; }
			&.popular { font-size: 150%; }
			&.mostPopular { font-size: 200%; }
	}
}
</style>
