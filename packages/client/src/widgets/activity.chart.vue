<template>
	<svg
		:viewBox="`0 0 ${viewBoxX} ${viewBoxY}`"
		@mousedown.prevent="onMousedown"
	>
		<polyline
			:points="pointsNote"
			fill="none"
			stroke-width="1"
			stroke="#c4a7e7"
		/>
		<polyline
			:points="pointsReply"
			fill="none"
			stroke-width="1"
			stroke="#eb6f92"
		/>
		<polyline
			:points="pointsRenote"
			fill="none"
			stroke-width="1"
			stroke="#ebbcba"
		/>
		<polyline
			:points="pointsTotal"
			fill="none"
			stroke-width="1"
			stroke="#6e6a86"
			stroke-dasharray="2 2"
		/>
	</svg>
</template>

<script lang="ts" setup>
const props = defineProps<{
	activity: any[];
}>();

const viewBoxX: number = $ref(147);
const viewBoxY: number = $ref(60);
let zoom: number = $ref(1),
	pos: number = $ref(0),
	pointsNote: any = $ref(null),
	pointsReply: any = $ref(null),
	pointsRenote: any = $ref(null),
	pointsTotal: any = $ref(null);

function dragListen(fn) {
	window.addEventListener("mousemove", fn);
	window.addEventListener("mouseleave", dragClear.bind(null, fn));
	window.addEventListener("mouseup", dragClear.bind(null, fn));
}

function dragClear(fn) {
	window.removeEventListener("mousemove", fn);
	window.removeEventListener("mouseleave", dragClear);
	window.removeEventListener("mouseup", dragClear);
}

function onMousedown(ev) {
	const clickX = ev.clientX;
	const clickY = ev.clientY;
	const baseZoom = zoom;
	const basePos = pos;

	// 動かした時
	dragListen((me) => {
		const moveLeft = me.clientX - clickX;
		const moveTop = me.clientY - clickY;

		zoom = Math.max(1, baseZoom + -moveTop / 20);
		pos = Math.min(0, basePos + moveLeft);
		if (pos < -((props.activity.length - 1) * zoom - viewBoxX))
			pos = -((props.activity.length - 1) * zoom - viewBoxX);

		render();
	});
}

function render() {
	const peak = Math.max(...props.activity.map((d) => d.total));
	if (peak !== 0) {
		const activity = props.activity.slice().reverse();
		pointsNote = activity
			.map(
				(d, i) =>
					`${i * zoom + pos},${(1 - d.notes / peak) * viewBoxY}`,
			)
			.join(" ");
		pointsReply = activity
			.map(
				(d, i) =>
					`${i * zoom + pos},${(1 - d.replies / peak) * viewBoxY}`,
			)
			.join(" ");
		pointsRenote = activity
			.map(
				(d, i) =>
					`${i * zoom + pos},${(1 - d.renotes / peak) * viewBoxY}`,
			)
			.join(" ");
		pointsTotal = activity
			.map(
				(d, i) =>
					`${i * zoom + pos},${(1 - d.total / peak) * viewBoxY}`,
			)
			.join(" ");
	}
}
</script>

<style lang="scss" scoped>
svg {
	display: block;
	padding: 16px;
	width: 100%;
	box-sizing: border-box;
	cursor: all-scroll;
}
</style>
