<template>
	<div v-size="{ min: [350, 500] }" class="yohlumlk">
		<MkAvatar class="avatar" :user="note.user" />
		<div class="main">
			<XNoteHeader class="header" :note="note" :mini="true" />
			<div class="body">
				<NoteContent class="text" :note="note" />
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import {} from "vue";
import * as misskey from "goblin-js";
import XNoteHeader from "@/components/MkNoteHeader.vue";
import NoteContent from "@/components/note/NoteContent.vue";

const props = defineProps<{
	note: misskey.entities.Note;
	pinned?: boolean;
}>();
</script>

<style lang="scss" scoped>
.yohlumlk {
	display: flex;
	margin: 0;
	padding: 0;
	overflow: clip;
	font-size: 0.95em;
	border: 0px;

	&.min-width_350px {
		> .avatar {
			margin: 0 10px 0 0;
			width: 44px;
			height: 44px;
		}
	}

	&.min-width_500px {
		> .avatar {
			margin: 0 12px 0 0;
			width: 48px;
			height: 48px;
		}
	}

	> .avatar {
		flex-shrink: 0;
		display: block;
		margin: 0 10px 0 0;
		width: 40px;
		height: 40px;
		border-radius: 8px;
	}

	> .main {
		flex: 1;
		min-width: 0;

		> .header {
			margin-bottom: 2px;
		}
	}
}
</style>
