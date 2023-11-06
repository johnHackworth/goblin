<template>
	<div v-if="note" class="reacted-users">
		<div :class="$style.tabs">
			<button
				v-for="reaction in reactions"
				:key="reaction"
				:class="[$style.tab, { [$style.tabActive]: tab === reaction }]"
				class="_button"
				@click="tab = reaction"
			>
				<MkReactionIcon
					ref="reactionRef"
					:reaction="
						reaction
							? reaction.replace(/^:(\w+):$/, ':$1@.:')
							: reaction
					"
					:custom-emojis="note.emojis"
				/>
				<span style="margin-left: 4px">{{
					note.reactions[reaction]
				}}</span>
			</button>
		</div>
		<MkUserCardMini
			v-for="user in users"
			:key="user.id"
			:user="user"
			:with-chart="false"
		/>
	</div>
	<div v-else>
		<MkLoading />
	</div>
</template>

<script lang="ts" setup>
import { onMounted, watch } from "vue";
import * as misskey from "firefish-js";
import MkReactionIcon from "@/components/MkReactionIcon.vue";
import MkUserCardMini from "@/components/MkUserCardMini.vue";
import { i18n } from "@/i18n";
import * as os from "@/os";

const props = defineProps<{
	noteId: misskey.entities.Note["id"];
}>();

let note = $ref<misskey.entities.Note>();
let tab = $ref<string>();
let reactions = $ref<string[]>();
let users = $ref();

watch($$(tab), async () => {
	const res = await os.api("notes/reactions", {
		noteId: props.noteId,
		type: tab,
		limit: 30,
	});

	users = res.map((x) => x.user);
});

onMounted(() => {
	os.api("notes/show", {
		noteId: props.noteId,
	}).then((res) => {
		reactions = Object.keys(res.reactions);
		tab = reactions[0];
		note = res;
	});
});
</script>

<style lang="scss" module>
.tabs {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
}

.tab {
	padding: 4px 6px;
	border: solid 1px var(--divider);
	border-radius: 6px;
}

.tabActive {
	border-color: var(--accent);
}
</style>
