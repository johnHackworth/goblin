<template>
	<section class="ssazuxis">
		<header class="_button" @click="showBody = !showBody">
			<div class="title"><slot name="header"></slot></div>
			<div class="divider"></div>
			<button
				class="_button"
				:aria-expanded="showBody"
				:aria-controls="bodyId"
			>
				<template v-if="showBody"
					><i class="ph-caret-up ph-bold ph-lg"></i
				></template>
				<template v-else
					><i class="ph-caret-down ph-bold ph-lg"></i
				></template>
			</button>
		</header>
		<transition
			:name="$store.state.animation ? 'folder-toggle' : ''"
			@enter="enter"
			@after-enter="afterEnter"
			@leave="leave"
			@after-leave="afterLeave"
		>
			<div v-show="showBody" :id="bodyId">
				<slot></slot>
			</div>
		</transition>
	</section>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { getUniqueId } from "@/os";

const localStoragePrefix = "ui:folder:";

export default defineComponent({
	props: {
		expanded: {
			type: Boolean,
			required: false,
			default: true,
		},
		persistKey: {
			type: String,
			required: false,
			default: null,
		},
	},
	data() {
		return {
			bodyId: getUniqueId(),
			showBody:
				this.persistKey &&
				localStorage.getItem(localStoragePrefix + this.persistKey)
					? localStorage.getItem(
							localStoragePrefix + this.persistKey,
					  ) === "t"
					: this.expanded,
		};
	},
	watch: {
		showBody() {
			if (this.persistKey) {
				localStorage.setItem(
					localStoragePrefix + this.persistKey,
					this.showBody ? "t" : "f",
				);
			}
		},
	},
	methods: {
		toggleContent(show: boolean) {
			this.showBody = show;
		},

		enter(el) {
			const elementHeight = el.getBoundingClientRect().height;
			el.style.height = 0;
			el.offsetHeight; // reflow
			el.style.height = elementHeight + "px";
		},
		afterEnter(el) {
			el.style.height = null;
		},
		leave(el) {
			const elementHeight = el.getBoundingClientRect().height;
			el.style.height = elementHeight + "px";
			el.offsetHeight; // reflow
			el.style.height = 0;
		},
		afterLeave(el) {
			el.style.height = null;
		},
	},
});
</script>

<style lang="scss" scoped>
.folder-toggle-enter-active,
.folder-toggle-leave-active {
	overflow-y: hidden;
	transition:
		opacity 0.5s,
		height 0.5s !important;
}
.folder-toggle-enter-from {
	opacity: 0;
}
.folder-toggle-leave-to {
	opacity: 0;
}

.ssazuxis {
	position: relative;

	> header {
		display: flex;
		position: relative;
		z-index: 10;
		position: sticky;
		top: var(--stickyTop, 0px);
		padding: var(--x-padding);
		-webkit-backdrop-filter: var(--blur, blur(8px));
		backdrop-filter: var(--blur, blur(20px));
		margin-inline: -12px;
		padding-inline: 12px;
		mask: linear-gradient(
			to right,
			transparent,
			black 12px calc(100% - 12px),
			transparent
		);
		-webkit-mask: linear-gradient(
			to right,
			transparent,
			black 12px calc(100% - 12px),
			transparent
		);

		&::before {
			content: "";
			position: absolute;
			inset: 0;
			background: var(--bg);
			opacity: 0.85;
			z-index: -1;
		}

		> .title {
			margin: 0;
			padding: 12px 16px 12px 0;

			> i {
				margin-right: 6px;
			}

			&:empty {
				display: none;
			}
		}

		> .divider {
			flex: 1;
			margin: auto;
			height: 1px;
			background: var(--divider);
		}

		> button {
			padding: 12px 0 12px 16px;
		}
	}
}
</style>
