<template>
	<details class="dwzlatin" :open="defaultOpen">
		<summary class="header _button">
			<span class="icon"><slot name="icon"></slot></span>
			<span class="text"><slot name="label"></slot></span>
			<span class="right">
				<span class="text"><slot name="suffix"></slot></span>
				<i v-if="opened" class="ph-caret-up ph-bold ph-lg icon"></i>
				<i v-else class="ph-caret-down ph-bold ph-lg icon"></i>
			</span>
		</summary>
		<div class="body">
			<MkSpacer :margin-min="14" :margin-max="22">
				<slot></slot>
			</MkSpacer>
		</div>
	</details>
</template>

<script lang="ts" setup>
defineProps<{
	defaultOpen: boolean;
}>();
</script>

<style lang="scss" scoped>
.dwzlatin {
	display: block;
	overflow: clip;
	border-radius: 6px;

	> .header {
		display: flex;
		align-items: center;
		width: 100%;
		box-sizing: border-box;
		padding: 12px 14px 12px 14px;
		background: var(--buttonBg);

		&:hover {
			text-decoration: none;
			background: var(--buttonHoverBg);
		}

		&.active {
			color: var(--accent);
			background: var(--buttonHoverBg);
		}

		> .icon {
			margin-right: 0.75em;
			flex-shrink: 0;
			text-align: center;
			opacity: 0.8;

			&:empty {
				display: none;

				& + .text {
					padding-left: 4px;
				}
			}
		}

		> .text {
			white-space: nowrap;
			text-overflow: ellipsis;
			overflow: hidden;
			padding-right: 12px;
		}

		> .right {
			margin-left: auto;
			opacity: 0.7;
			white-space: nowrap;

			> .text:not(:empty) {
				margin-right: 0.75em;
			}
		}
	}

	> .body {
		background: var(--panel);
		border-radius: 0 0 6px 6px;
	}
}
</style>
