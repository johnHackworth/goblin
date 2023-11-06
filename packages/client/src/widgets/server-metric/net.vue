<template>
	<div class="oxxrhrto">
		<svg :viewBox="`0 0 ${viewBoxX} ${viewBoxY}`">
			<polygon
				:points="inPolygonPoints"
				fill="#f6c177"
				fill-opacity="0.5"
			/>
			<polyline
				:points="inPolylinePoints"
				fill="none"
				stroke="#f6c177"
				stroke-width="1"
			/>
			<circle :cx="inHeadX" :cy="inHeadY" r="1.5" fill="#f6c177" />
			<text x="1" y="5">
				NET rx
				<tspan>{{ bytes(inRecent) }}</tspan>
			</text>
		</svg>
		<svg :viewBox="`0 0 ${viewBoxX} ${viewBoxY}`">
			<polygon
				:points="outPolygonPoints"
				fill="#31748f"
				fill-opacity="0.5"
			/>
			<polyline
				:points="outPolylinePoints"
				fill="none"
				stroke="#31748f"
				stroke-width="1"
			/>
			<circle :cx="outHeadX" :cy="outHeadY" r="1.5" fill="#31748f" />
			<text x="1" y="5">
				NET tx
				<tspan>{{ bytes(outRecent) }}</tspan>
			</text>
		</svg>
	</div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted } from "vue";
import bytes from "@/filters/bytes";

const props = defineProps<{
	connection: any;
	meta: any;
}>();

const viewBoxX: number = $ref(50);
const viewBoxY: number = $ref(30);
const stats: any[] = $ref([]);
let inPolylinePoints: string = $ref(""),
	outPolylinePoints: string = $ref(""),
	inPolygonPoints: string = $ref(""),
	outPolygonPoints: string = $ref(""),
	inHeadX: any = $ref(null),
	inHeadY: any = $ref(null),
	outHeadX: any = $ref(null),
	outHeadY: any = $ref(null),
	inRecent: number = $ref(0),
	outRecent: number = $ref(0);

onMounted(() => {
	props.connection.on("stats", onStats);
	props.connection.on("statsLog", onStatsLog);
	props.connection.send("requestLog", {
		id: Math.random().toString().substr(2, 8),
	});
});

onBeforeUnmount(() => {
	props.connection.off("stats", onStats);
	props.connection.off("statsLog", onStatsLog);
});

function onStats(connStats) {
	stats.push(connStats);
	if (stats.length > 50) stats.shift();

	const inPeak = Math.max(1024 * 64, Math.max(...stats.map((s) => s.net.rx)));
	const outPeak = Math.max(
		1024 * 64,
		Math.max(...stats.map((s) => s.net.tx)),
	);

	const inPolylinePointsStats = stats.map((s, i) => [
		viewBoxX - (stats.length - 1 - i),
		(1 - s.net.rx / inPeak) * viewBoxY,
	]);
	const outPolylinePointsStats = stats.map((s, i) => [
		viewBoxX - (stats.length - 1 - i),
		(1 - s.net.tx / outPeak) * viewBoxY,
	]);
	inPolylinePoints = inPolylinePointsStats
		.map((xy) => `${xy[0]},${xy[1]}`)
		.join(" ");
	outPolylinePoints = outPolylinePointsStats
		.map((xy) => `${xy[0]},${xy[1]}`)
		.join(" ");

	inPolygonPoints = `${
		viewBoxX - (stats.length - 1)
	},${viewBoxY} ${inPolylinePoints} ${viewBoxX},${viewBoxY}`;
	outPolygonPoints = `${
		viewBoxX - (stats.length - 1)
	},${viewBoxY} ${outPolylinePoints} ${viewBoxX},${viewBoxY}`;

	inHeadX = inPolylinePointsStats[inPolylinePointsStats.length - 1][0];
	inHeadY = inPolylinePointsStats[inPolylinePointsStats.length - 1][1];
	outHeadX = outPolylinePointsStats[outPolylinePointsStats.length - 1][0];
	outHeadY = outPolylinePointsStats[outPolylinePointsStats.length - 1][1];

	inRecent = connStats.net.rx;
	outRecent = connStats.net.tx;
}

function onStatsLog(statsLog) {
	for (const revStats of [...statsLog].reverse()) {
		onStats(revStats);
	}
}
</script>

<style lang="scss" scoped>
.oxxrhrto {
	display: flex;

	> svg {
		display: block;
		padding: 10px;
		width: 50%;

		&:first-child {
			padding-right: 5px;
		}

		&:last-child {
			padding-left: 5px;
		}

		> text {
			font-size: 5px;
			fill: currentColor;

			> tspan {
				opacity: 0.5;
			}
		}
	}
}
</style>
