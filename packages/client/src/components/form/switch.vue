<template>
	<label class="ziffeomt">
		<input
			type="checkbox"
			:checked="modelValue"
			:disabled="disabled"
			@change="(x) => toggle(x)"
		/>
		<div class="button">
			<div class="knob"></div>
		</div>
		<span class="label">
			<!-- TODO: 無名slotの方は廃止 -->
			<span><slot name="label"></slot><slot></slot></span>
			<p class="caption"><slot name="caption"></slot></p>
		</span>
	</label>
</template>

<script lang="ts" setup>
import type { Ref } from "vue";

const props = defineProps<{
	modelValue: boolean | Ref<boolean>;
	disabled?: boolean;
}>();

const emit = defineEmits<{
	(ev: "update:modelValue", v: boolean): void;
}>();

function toggle(x) {
	if (props.disabled) return;
	emit("update:modelValue", x.target.checked);
}
</script>

<style lang="scss" scoped>
.ziffeomt {
	position: relative;
	display: flex;
	transition: all 0.2s ease;

	> * {
		user-select: none;
	}

	> input {
		position: absolute;
		width: 32px;
		height: 23px;
		opacity: 0;
		margin: 0;
	}

	> .button {
		position: relative;
		display: inline-flex;
		flex-shrink: 0;
		margin: 0;
		box-sizing: border-box;
		width: 32px;
		height: 23px;
		outline: none;
		background: var(--swutchOffBg);
		background-clip: content-box;
		border: solid 1px var(--swutchOffBg);
		border-radius: 999px;
		transition: inherit;
		user-select: none;
		pointer-events: none;

		> .knob {
			position: absolute;
			top: 3px;
			left: 3px;
			width: 15px;
			height: 15px;
			background: var(--swutchOffFg);
			border-radius: 999px;
			transition: all 0.2s ease;
		}
	}

	&:hover {
		> .button {
			border-color: var(--inputBorderHover) !important;
		}
	}
	&:focus-within > .button {
		outline: auto;
	}

	> .label {
		margin-left: 12px;
		margin-top: 2px;
		display: block;
		transition: inherit;
		color: var(--fg);

		> span {
			display: block;
			line-height: 20px;
			cursor: pointer;
			transition: inherit;
		}

		> .caption {
			margin: 8px 0 0 0;
			color: var(--fgTransparentWeak);
			font-size: 0.85em;

			&:empty {
				display: none;
			}
		}
	}

	> input:disabled ~ * {
		opacity: 0.6;
		cursor: not-allowed;
	}

	> input:checked ~ .button {
		background-color: var(--swutchOnBg) !important;
		border-color: var(--swutchOnBg) !important;

		> .knob {
			left: 12px;
			background: var(--swutchOnFg);
		}
	}
}
</style>
