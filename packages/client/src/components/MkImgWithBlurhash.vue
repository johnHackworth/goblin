<template>
	<canvas
		v-if="!loaded"
		ref="canvas"
		:width="size"
		:height="size"
		:title="title"
	/>
	<img
		v-if="src"
		:src="src"
		:title="title"
		:type="type"
		:alt="alt"
		:class="{ cover }"
		:style="{ 'object-fit': cover ? 'cover' : null }"
		loading="lazy"
		@load="onLoad"
	/>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import { decodeBlurHash } from "fast-blurhash";

const props = withDefaults(
	defineProps<{
		src?: string | null;
		hash?: string;
		alt?: string;
		type?: string | null;
		title?: string | null;
		size?: number;
		cover?: boolean;
	}>(),
	{
		src: null,
		type: null,
		alt: "",
		title: null,
		size: 64,
		cover: true,
	},
);

const canvas = $ref<HTMLCanvasElement>();
let loaded = $ref(false);

function draw() {
	if (props.hash == null || canvas == null) return;
	const pixels = decodeBlurHash(props.hash, props.size, props.size);
	const ctx = canvas.getContext("2d");
	const imageData = ctx!.createImageData(props.size, props.size);
	imageData.data.set(pixels);
	ctx!.putImageData(imageData, 0, 0);
}

function onLoad() {
	loaded = true;
}

onMounted(() => {
	draw();
});
</script>

<style lang="scss" scoped>
canvas,
img {
	display: block;
	width: 100%;
	height: 100%;
}

canvas {
	position: absolute;
	inset: 0;
	object-fit: cover;
}

img {
	object-fit: contain;
}
</style>
