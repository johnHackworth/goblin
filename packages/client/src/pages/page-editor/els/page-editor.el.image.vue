<template>
	<XContainer :draggable="true" @remove="() => $emit('remove')">
		<template #header
			><i class="ph-image ph-bold ph-lg"></i>
			{{ i18n.ts._pages.blocks.image }}</template
		>
		<template #func>
			<button @click="choose()">
				<i class="ph-folder-notch-open ph-bold ph-lg"></i>
			</button>
		</template>

		<section class="oyyftmcf">
			<MkDriveFileThumbnail
				v-if="file"
				class="preview"
				:file="file"
				fit="contain"
				@click="choose()"
			/>
		</section>
	</XContainer>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import XContainer from "../page-editor.container.vue";
import MkDriveFileThumbnail from "@/components/MkDriveFileThumbnail.vue";
import * as os from "@/os";
import { i18n } from "@/i18n";

const props = withDefaults(
	defineProps<{
		value: any;
	}>(),
	{
		value: {
			fileId: null,
		},
	},
);

let file: any = $ref(null);

async function choose() {
	os.selectDriveFile(false).then((fileResponse: any) => {
		file = fileResponse;
		props.value.fileId = fileResponse.id;
	});
}

onMounted(async () => {
	if (props.value.fileId == null) {
		await choose();
	} else {
		os.api("drive/files/show", {
			fileId: props.value.fileId,
		}).then((fileResponse) => {
			file = fileResponse;
		});
	}
});
</script>

<style lang="scss" scoped>
.oyyftmcf {
	> .preview {
		height: 150px;
	}
}
</style>
