<template>
	<MkModal
		ref="modal"
		:prefer-type="'dialog'"
		@click="onBgClick"
		@keyup.esc="$emit('close')"
		@closed="$emit('closed')"
	>
		<FocusTrap v-model:active="isActive">
			<div
				ref="rootEl"
				class="ebkgoccj"
				:style="{
					width: `${props.width}px`,
					height: scroll
						? height
							? `${props.height}px`
							: null
						: height
						? `min(${props.height}px, 100%)`
						: '100%',
				}"
				tabindex="-1"
			>
				<div ref="headerEl" class="header">
					<button
						v-if="props.withOkButton"
						:aria-label="i18n.t('close')"
						class="_button"
						@click="$emit('close')"
						v-tooltip="i18n.ts.close"
					>
						<i class="ph-x ph-bold ph-lg"></i>
					</button>
					<span class="title">
						<slot name="header"></slot>
					</span>
					<button
						v-if="!props.withOkButton"
						:aria-label="i18n.t('close')"
						class="_button"
						@click="$emit('close')"
					>
						<i class="ph-x ph-bold ph-lg"></i>
					</button>
					<button
						v-if="props.withOkButton"
						:aria-label="i18n.t('ok')"
						class="_button"
						:disabled="props.okButtonDisabled"
						@click="$emit('ok')"
					>
						<i class="ph-check ph-bold ph-lg"></i>
					</button>
				</div>
				<div class="body">
					<slot></slot>
				</div>
			</div>
		</FocusTrap>
	</MkModal>
</template>

<script lang="ts" setup>
import { FocusTrap } from "focus-trap-vue";
import MkModal from "./MkModal.vue";
import { i18n } from "@/i18n";

const props = withDefaults(
	defineProps<{
		withOkButton: boolean;
		okButtonDisabled: boolean;
		width: number;
		height: number | null;
		scroll: boolean;
	}>(),
	{
		withOkButton: false,
		okButtonDisabled: false,
		width: 400,
		height: null,
		scroll: true,
	},
);

const emit = defineEmits<{
	(event: "click"): void;
	(event: "close"): void;
	(event: "closed"): void;
	(event: "ok"): void;
}>();

let modal = $shallowRef<InstanceType<typeof MkModal>>();
let rootEl = $shallowRef<HTMLElement>();
let headerEl = $shallowRef<HTMLElement>();

const close = (ev) => {
	modal?.close(ev);
};

const onBgClick = () => {
	emit("click");
};

defineExpose({
	close,
});
</script>

<style lang="scss" scoped>
.ebkgoccj {
	margin: auto;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	contain: content;
	container-type: inline-size;
	border-radius: var(--radius);

	--root-margin: 24px;

	@media (max-width: 500px) {
		--root-margin: 16px;
	}

	> .header {
		$height: 46px;
		$height-narrow: 42px;
		display: flex;
		flex-shrink: 0;
		background: var(--windowHeader);
		-webkit-backdrop-filter: var(--blur, blur(15px));
		backdrop-filter: var(--blur, blur(15px));

		> button {
			height: $height;
			width: $height;

			@media (max-width: 500px) {
				height: $height-narrow;
				width: $height-narrow;
			}
		}

		> .title {
			flex: 1;
			line-height: $height;
			padding-left: 32px;
			font-weight: bold;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			pointer-events: none;

			@media (max-width: 500px) {
				line-height: $height-narrow;
				padding-left: 16px;
			}
		}

		> button + .title {
			padding-left: 0;
		}
	}

	> .body {
		flex: 1;
		overflow: auto;
		background: var(--panel);
	}
}
</style>
