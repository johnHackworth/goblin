<template>
	<button ref="thumbnail" class="zdjebgpv">
		<ImgWithBlurhash
			v-if="isThumbnailAvailable"
			:hash="file.blurhash"
			:src="file.thumbnailUrl"
			:alt="file.name"
			:title="file.name"
			:cover="fit !== 'contain'"
		/>
		<i
			v-else-if="is === 'image'"
			class="ph-file-image ph-bold ph-lg icon"
		></i>
		<i
			v-else-if="is === 'video'"
			class="ph-file-video ph-bold ph-lg icon"
		></i>
		<i
			v-else-if="is === 'audio' || is === 'midi'"
			class="ph-file-audio ph-bold ph-lg icon"
		></i>
		<i v-else-if="is === 'csv'" class="ph-file-csv ph-bold ph-lg icon"></i>
		<i v-else-if="is === 'pdf'" class="ph-file-pdf ph-bold ph-lg icon"></i>
		<i
			v-else-if="is === 'textfile'"
			class="ph-file-text ph-bold ph-lg icon"
		></i>
		<i
			v-else-if="is === 'archive'"
			class="ph-file-zip ph-bold ph-lg icon"
		></i>
		<i v-else class="ph-file ph-bold ph-lg icon"></i>

		<i
			v-if="isThumbnailAvailable && is === 'video'"
			class="ph-file-video ph-bold ph-lg icon-sub"
		></i>
	</button>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import type * as Misskey from "firefish-js";
import ImgWithBlurhash from "@/components/MkImgWithBlurhash.vue";

const props = defineProps<{
	file: Misskey.entities.DriveFile;
	fit: string;
}>();

const is = computed(() => {
	if (props.file.type.startsWith("image/")) return "image";
	if (props.file.type.startsWith("video/")) return "video";
	if (props.file.type === "audio/midi") return "midi";
	if (props.file.type.startsWith("audio/")) return "audio";
	if (props.file.type.endsWith("/csv")) return "csv";
	if (props.file.type.endsWith("/pdf")) return "pdf";
	if (props.file.type.startsWith("text/")) return "textfile";
	if (
		[
			"application/zip",
			"application/x-cpio",
			"application/x-bzip",
			"application/x-bzip2",
			"application/java-archive",
			"application/x-rar-compressed",
			"application/x-tar",
			"application/gzip",
			"application/x-7z-compressed",
		].some((archiveType) => archiveType === props.file.type)
	)
		return "archive";
	return "unknown";
});

const isThumbnailAvailable = computed(() => {
	return props.file.thumbnailUrl
		? is.value === ("image" as const) || is.value === "video"
		: false;
});
</script>

<style lang="scss" scoped>
.zdjebgpv {
	position: relative;
	display: flex;
	background: var(--panel);
	border-radius: 8px;
	overflow: clip;
	border: 0;
	padding: 0;
	cursor: pointer;

	> .icon-sub {
		position: absolute;
		width: 30%;
		height: auto;
		margin: 0;
		right: 4%;
		bottom: 4%;
	}

	> .icon {
		pointer-events: none;
		margin: auto;
		font-size: 32px;
		color: #777;
	}
}
</style>
