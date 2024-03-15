<template>
	<MkPagination ref="pagingComponent" :pagination="pagination">
		<template #empty>
			<div class="_fullinfo">
				<img
					src="/static-assets/badges/info.png"
					class="_ghost"
					alt="Info"
				/>
				<div>{{ i18n.ts.noNotes }}</div>
			</div>
		</template>

		<template #default="{ items: notes }">
			<div class="giivymft" ref="tlEl">
				<XList
					ref="notes"
					v-slot="{ item: note }"
					:items="notes"
					:direction="pagination.reversed ? 'up' : 'down'"
					:reversed="pagination.reversed"
					:no-gap="false"
					:ad="true"
					class="notes"
				>
					<div>
						<XNoteDetailed
						 	v-if="!noRepetition || !isRepeated(note)"
							:key="note._featuredId_ || note._prId_ || note.id"
							:parentKey="note._featuredId_ || note._prId_ || note.id"
							class="qtqtichx"
							:note="note"
							@toggle="toggleNote"
							:showCloseButton="true"
							:showNotesCounter="true"
							:hideTabs="!expandedNotes[ note._featuredId_ || note._prId_ || note.id ]"
							useReplyTrail="true"
						/>
					</div>
				</XList>
			</div>
		</template>
	</MkPagination>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type { Paging } from "@/components/MkPagination.vue";
import XNote from "@/components/MkNote.vue";
import XNoteDetailed from "@/components/MkNoteDetailed.vue";
import XList from "@/components/MkDateSeparatedList.vue";
import MkPagination from "@/components/MkPagination.vue";
import { i18n } from "@/i18n";
import { scroll } from "@/scripts/scroll";

const tlEl = ref<HTMLElement>();
const expandedNotes = ref({});

const props = defineProps<{
	pagination: Paging;
	noGap?: boolean;
	noReplies?: boolean;
	noRepetition?: boolean;
}>();

const pagingComponent = ref<InstanceType<typeof MkPagination>>();

const postCache = $ref({});

const isRepeated = ( post ) => {
	if( ! post.reblogtrail ) {
		return false;
	}
	let result = true;
	let pointer = postCache;
	for( let i = 0; i < post.reblogtrail.length; i++ ) {
		if( !pointer [ post.reblogtrail[ i ].id ] ) {
			pointer[ post.reblogtrail[ i ].id ] = {};
			result = false;
		} else {
			pointer = pointer[ post.reblogtrail[ i ].id ]
		}
	}
	if( pointer[ post.id ] ) {
		if( Object.keys( pointer[ post.id ]  ).length === 0 ) {
			// the current post + timeline has been rendered already but no
			// downstream reblogs have, so we render the post again
			result = false;
		}
	} else {
		pointer[ post.id ] = {};
		result = false;
	}
	return result;
}

function scrollTop() {
	scroll(tlEl.value, { top: 0, behavior: "smooth" });
}

function toggleNote( noteId ) {
	expandedNotes.value[ noteId ] = !expandedNotes.value[ noteId ]
}

defineExpose({
	pagingComponent,
	scrollTop
});
</script>

<style lang="scss" scoped>
.giivymft {
	&.noGap {
		> .notes {
			background: var(--panel) !important;
			border-radius: var(--radius);

			&.max-width_500px {
				border-radius: 3px;
			}
		}
	}
	&:not(.noGap) {
		> .notes {
			.qtqtichx {
				background: var(--panel);
				border-radius: var(--radius);

				&.max-width_500px {
					border-radius: 5px;
				}

				&.private {
					background-image: linear-gradient(to bottom, #f8b3b3, #f9c6d3, #f6daeb, #f6edf9, #ffffff, #ffffff, #ffffff);
				}

				&.unlisted {
					background-image: linear-gradient(to bottom, #f8f5b3, #ffecca, #ffeeed, #fff7ff, #ffffff);
				}
			}
		}
	}
}
</style>
