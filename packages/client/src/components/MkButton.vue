<template>
	<button
		v-if="!link"
		class="bghgjjyj _button"
		:class="{ inline, primary, gradate, danger, rounded, full, mini, chip }"
		:type="type"
		@click="emit('click', $event)"
		@mousedown="onMousedown"
	>
		<div ref="ripples" class="ripples"></div>
		<div class="content">
			<slot></slot>
		</div>
	</button>
	<MkA
		v-else
		class="bghgjjyj _button"
		:class="{ inline, primary, gradate, danger, rounded, full, mini }"
		:to="to"
		@mousedown="onMousedown"
	>
		<div ref="ripples" class="ripples"></div>
		<div class="content">
			<slot></slot>
		</div>
	</MkA>
</template>

<script lang="ts" setup>
import { nextTick, onMounted } from "vue";

const props = defineProps<{
	type?: "button" | "submit" | "reset";
	primary?: boolean;
	gradate?: boolean;
	rounded?: boolean;
	inline?: boolean;
	link?: boolean;
	to?: string;
	autofocus?: boolean;
	wait?: boolean;
	danger?: boolean;
	full?: boolean;
	mini?: boolean;
	chip?: boolean;
}>();

const emit = defineEmits<{
	(ev: "click", payload: MouseEvent): void;
}>();

const el = $ref<HTMLElement | null>(null);
const ripples = $ref<HTMLElement | null>(null);

onMounted(() => {
	if (props.autofocus) {
		nextTick(() => {
			el!.focus();
		});
	}
});

function distance(p, q): number {
	return Math.hypot(p.x - q.x, p.y - q.y);
}

function calcCircleScale(boxW, boxH, circleCenterX, circleCenterY): number {
	const origin = { x: circleCenterX, y: circleCenterY };
	const dist1 = distance({ x: 0, y: 0 }, origin);
	const dist2 = distance({ x: boxW, y: 0 }, origin);
	const dist3 = distance({ x: 0, y: boxH }, origin);
	const dist4 = distance({ x: boxW, y: boxH }, origin);
	return Math.max(dist1, dist2, dist3, dist4) * 2;
}

function onMousedown(evt: MouseEvent): void {
	const target = evt.target! as HTMLElement;
	const rect = target.getBoundingClientRect();

	const ripple = document.createElement("div");
	ripple.style.top = (evt.clientY - rect.top - 1).toString() + "px";
	ripple.style.left = (evt.clientX - rect.left - 1).toString() + "px";

	ripples!.appendChild(ripple);

	const circleCenterX = evt.clientX - rect.left;
	const circleCenterY = evt.clientY - rect.top;

	const scale = calcCircleScale(
		target.clientWidth,
		target.clientHeight,
		circleCenterX,
		circleCenterY,
	);

	window.setTimeout(() => {
		ripple.style.transform = "scale(" + scale / 2 + ")";
	}, 1);
	window.setTimeout(() => {
		ripple.style.transition = "all 1s ease";
		ripple.style.opacity = "0";
	}, 1000);
	window.setTimeout(() => {
		if (ripples) ripples.removeChild(ripple);
	}, 2000);
}
</script>

<style lang="scss" scoped>
.bghgjjyj {
	position: relative;
	z-index: 1; // 他コンポーネントのbox-shadowに隠されないようにするため
	display: block;
	min-width: 100px;
	min-height: 35px;
	width: max-content;
	padding: 8px 16px;
	text-align: center;
	font-weight: normal;
	font-size: max(12px, 1em);
	box-shadow: none;
	text-decoration: none;
	background: var(--buttonBg);
	border-radius: 5px;
	overflow: clip;
	box-sizing: border-box;
	transition: background 0.1s ease;
	margin-right: 0.2rem;
	margin-left: 0.2rem;

	&:not(:disabled):hover {
		background: var(--buttonHoverBg);
	}

	&:not(:disabled):active {
		background: var(--buttonHoverBg);
	}

	&.full {
		width: 100%;
	}

	&.rounded {
		border-radius: 999px;
	}

	&.primary {
		font-weight: bold;
		color: var(--fgOnAccent) !important;
		background: var(--accent);

		&:not(:disabled):hover {
			background: var(--X8);
		}

		&:not(:disabled):active {
			background: var(--X8);
		}
	}

	&.gradate {
		font-weight: bold;
		color: var(--fgOnAccent) !important;
		background: linear-gradient(
			90deg,
			var(--buttonGradateA),
			var(--buttonGradateB)
		);

		&:not(:disabled):hover {
			background: linear-gradient(90deg, var(--X8), var(--X8));
		}

		&:not(:disabled):active {
			background: linear-gradient(90deg, var(--X8), var(--X8));
		}
	}

	&.danger {
		color: #eb6f92;

		&.primary {
			color: #e0def4;
			background: #eb6f92;

			&:not(:disabled):hover {
				background: #eb6f92;
			}

			&:not(:disabled):active {
				background: #b4637a;
			}
		}
	}

	&.mini {
		padding: 4px 8px;
		font-size: max(12px, 0.9em);
		border-radius: 100px;
	}

	&.chip {
		padding: 4px 12px;
		font-size: max(12px, 0.9em);
		min-width: unset;
		border-radius: 100px;
	}

	&:disabled {
		opacity: 0.7;
	}

	&:focus-visible {
		outline: auto;
	}

	&.inline {
		display: inline-block;
		width: auto;
		min-width: 100px;
	}

	> .ripples {
		position: absolute;
		z-index: 0;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border-radius: 6px;
		overflow: hidden;

		::v-deep(div) {
			position: absolute;
			width: 2px;
			height: 2px;
			border-radius: 100%;
			background: rgba(0, 0, 0, 0.1);
			opacity: 1;
			transform: scale(1);
			transition: all 0.5s cubic-bezier(0, 0.5, 0, 1);
		}
	}

	&.primary > .ripples ::v-deep(div) {
		background: rgba(0, 0, 0, 0.15);
	}

	> .content {
		position: relative;
		z-index: 1;
	}
}
</style>
