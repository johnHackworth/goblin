<template>
	<div class="civpbkhh">
		<div
			ref="scroll"
			class="scrollbox"
			v-bind:class="{ scroll: isScrolling }"
		>
			<div v-for="note in notes" class="note">
				<div class="content _panel" v-if="note.cw == null">
							<NoteContent
							class="welcomeNote"
							:note="note"
							:detailed="false"
							:parentId="note.parentId"></NoteContent>
						<!-- <MkA v-if="note.renoteId" class="rp" :to="`/notes/${note.renoteId}`">RN: ...</MkA> -->
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import XReactionsViewer from "@/components/MkReactionsViewer.vue";
import XMediaList from "@/components/MkMediaList.vue";
import NoteContent from "@/components/note/NoteContent.vue";
import XPoll from "@/components/MkPoll.vue";
import * as os from "@/os";

export default defineComponent({
	components: {
		XReactionsViewer,
		XMediaList,
		XPoll,
		NoteContent,
	},

	data() {
		return {
			notes: [],
			isScrolling: false,
		};
	},

	created() {
		os.api("notes/featured").then((notes) => {
			this.notes = notes;
		});
	},

	updated() {
		if (this.$refs.scroll.clientHeight > window.innerHeight) {
			this.isScrolling = true;
		}
	},
});
</script>

<style lang="scss" scoped>
@keyframes scroll {
	0% {
		transform: translate3d(0, 0, 0);
	}
	5% {
		transform: translate3d(0, 0, 0);
	}
	75% {
		transform: translate3d(0, calc(-100% + 90vh), 0);
	}
	90% {
		transform: translate3d(0, calc(-100% + 90vh), 0);
	}
}

.civpbkhh {
	text-align: right;

	> .scrollbox {
		&.scroll {
			animation: scroll 45s linear infinite;
		}

		> .note {
			margin: 16px 0 16px auto;

			> .content {
				padding: 16px;
				margin: 0;
				max-width: 100%;
				border-radius: 16px;

				> .richcontent {
					min-width: 250px;
				}
			}
		}
	}
}
</style>
