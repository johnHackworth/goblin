<template>
	<header
		v-if="show"
		ref="el"
		class="fdidabkb clear"
		:class="{ thin: thin_, tabs: tabs?.length > 0 }"
		:style="{ background: bg }"
		@click="onClick"
	>
		<div class="left">
			<div class="buttons">
				<button
					v-if="displayBackButton"
					v-tooltip.noDelay="i18n.ts.goBack"
					class="_buttonIcon button icon backButton"
					@click.stop="goBack()"
					@touchstart="preventDrag"
				>
					<i class="ph-caret-left ph-bold ph-lg"></i>
				</button>
				<MkAvatar
					v-if="narrow && props.displayMyAvatar && $i"
					class="avatar button"
					:user="$i"
					:disable-preview="true"
					disable-link
					@click.stop="openAccountMenu"
				/>
			</div>
			<div
				v-if="!hideTitle && metadata"
				class="titleContainer"
				@click="showTabsPopup"
			>
				<MkAvatar
					v-if="metadata && metadata.avatar"
					class="avatar"
					:user="metadata.avatar"
					:show-indicator="true"
				/>
				<i
					v-else-if="metadata.icon && !narrow"
					class="icon"
					:class="metadata.icon"
				></i>

				<div class="title">
					<MkUserName
						v-if="metadata.userName"
						:user="metadata.userName"
						:nowrap="true"
						class="title"
					/>
					<div
						v-else-if="
							metadata.title &&
							!(tabs != null && tabs.length > 0 && narrow)
						"
						class="title"
					>
						{{ metadata.title }}
					</div>
					<div v-if="!narrow && metadata.subtitle" class="subtitle">
						{{ metadata.subtitle }}
					</div>
				</div>
			</div>
		</div>
		<template v-if="metadata">
			<nav
				v-if="hasTabs"
				ref="tabsEl"
				class="tabs"
				:class="{ collapse: hasTabs && tabs.length > 8 }"
			>
				<button
					v-for="tab in tabs"
					:ref="(el) => (tabRefs[tab.key] = el)"
					v-tooltip.noDelay="tab.title"
					class="tab _button"
					:class="{
						active: tab.key != null && tab.key === props.tab,
					}"
					@mousedown="(ev) => onTabMousedown(tab, ev)"
					@click="(ev) => onTabClick(tab, ev)"
				>
					<i v-if="tab.icon" class="icon" :class="tab.icon"></i>
					<span class="title">{{ tab.title }}</span>
				</button>
				<div ref="tabHighlightEl" class="highlight"></div>
			</nav>
		</template>
		<div class="buttons right">
			<template v-if="metadata && metadata.avatar">
				<MkFollowButton
					v-if="narrow"
					:user="metadata.avatar"
					:full="false"
					class="fullButton"
				></MkFollowButton>
				<MkFollowButton
					v-else
					:user="metadata.avatar"
					:full="true"
					class="fullButton"
				></MkFollowButton>
			</template>
			<template v-for="action in actions">
				<button
					v-tooltip.noDelay="action.text"
					class="_buttonIcon button"
					:class="{ selected: action.highlighted }"
					@click.stop="action.handler"
					@touchstart="preventDrag"
				>
					<i :class="action.icon"></i>
				</button>
			</template>
		</div>
	</header>
</template>

<script lang="ts" setup>
import {
	computed,
	inject,
	nextTick,
	onMounted,
	onUnmounted,
	reactive,
	ref,
	shallowReactive,
	watch,
} from "vue";
import MkFollowButton from "@/components/MkFollowButton.vue";
import { popupMenu } from "@/os";
import { scrollToTop } from "@/scripts/scroll";
import { globalEvents } from "@/events";
import { injectPageMetadata } from "@/scripts/page-metadata";
import { $i, openAccountMenu as openAccountMenu_ } from "@/account";
import { i18n } from "@/i18n";

interface Tab {
	key?: string | null;
	title: string;
	icon?: string;
	iconOnly?: boolean;
	onClick?: (ev: MouseEvent) => void;
}

const props = defineProps<{
	tabs?: Tab[];
	tab?: string;
	actions?: {
		text: string;
		icon: string;
		handler: (ev: MouseEvent) => void;
	}[];
	thin?: boolean;
	displayMyAvatar?: boolean;
	displayBackButton?: boolean;
	to?: string;
}>();

const displayBackButton =
	props.displayBackButton &&
	history.length > 1 &&
	inject("shouldBackButton", true);

const emit = defineEmits<{
	(ev: "update:tab", key: string);
}>();

const metadata = injectPageMetadata();

const hideTitle = inject("shouldOmitHeaderTitle", false);
const thin_ = props.thin || inject("shouldHeaderThin", false);

const el = $ref<HTMLElement | null>(null);
const tabRefs = {};
const tabHighlightEl = $ref<HTMLElement | null>(null);
const tabsEl = $ref<HTMLElement | null>(null);
const bg = ref(null);
let narrow = $ref(false);
const height = ref(0);
const hasTabs = $computed(() => props.tabs && props.tabs.length > 0);
const hasActions = $computed(() => props.actions && props.actions.length > 0);
const show = $computed(() => {
	return !hideTitle || hasTabs || hasActions;
});

const openAccountMenu = (ev: MouseEvent) => {
	openAccountMenu_(
		{
			withExtraOperation: true,
		},
		ev,
	);
};

const showTabsPopup = (ev: MouseEvent) => {
	if (!hasTabs) return;
	if (!narrow) return;
	ev.preventDefault();
	ev.stopPropagation();
	const menu = props.tabs.map((tab) => ({
		text: tab.title,
		icon: tab.icon,
		active: tab.key != null && tab.key === props.tab,
		action: (ev) => {
			onTabClick(tab, ev);
		},
	}));
	popupMenu(menu, ev.currentTarget ?? ev.target);
};

const preventDrag = (ev: TouchEvent) => {
	ev.stopPropagation();
};

const onClick = () => {
	if (props.to) {
		location.href = props.to;
	} else {
		scrollToTop(el, { behavior: "smooth" });
	}
};

function onTabMousedown(tab: Tab, ev: MouseEvent): void {
	// ユーザビリティの観点からmousedown時にはonClickは呼ばない
	if (tab.key) {
		emit("update:tab", tab.key);
	}
}

function onTabClick(tab: Tab, ev: MouseEvent): void {
	if (tab.onClick) {
		ev.preventDefault();
		ev.stopPropagation();
		tab.onClick(ev);
	}
	if (tab.key) {
		emit("update:tab", tab.key);
	}
}

function goBack(): void {
	window.history.back();
}

let ro: ResizeObserver | null;

onMounted(() => {
	watch(
		() => [props.tab, props.tabs],
		() => {
			nextTick(() => {
				const tabEl = tabRefs[props.tab];
				if (tabEl && tabHighlightEl) {
					// offsetWidth や offsetLeft は少数を丸めてしまうため getBoundingClientRect を使う必要がある
					// https://developer.mozilla.org/ja/docs/Web/API/HTMLElement/offsetWidth#%E5%80%A4
					const tabSizeX = tabEl.scrollWidth + 20; // + the tab's padding
					if (props.tabs.length > 3) {
						tabEl.style = `--width: ${tabSizeX}px`;
					}
					setTimeout(() => {
						tabHighlightEl.style.width = tabSizeX + "px";
						tabHighlightEl.style.transform = `translateX(${tabEl.offsetLeft}px)`;
						window.requestAnimationFrame(() => {
							tabsEl?.scrollTo({
								left: tabEl.offsetLeft - 60,
								behavior: "smooth",
							});
						});
					}, 200);
				}
			});
		},
		{
			immediate: true,
		},
	);

	if (el && el.parentElement) {
		narrow = el.parentElement.offsetWidth < 500;
		ro = new ResizeObserver((entries, observer) => {
			if (el.parentElement && document.body.contains(el)) {
				narrow = el.parentElement.offsetWidth < 500;
			}
		});
		ro.observe(el.parentElement);
	}
});

onUnmounted(() => {
	if (ro) ro.disconnect();
});
</script>

<style lang="scss" scoped>
.fdidabkb {
	--height: 55px;
	display: flex;
	justify-content: space-between;
	width: 100%;
	height: var(--height);
	padding-inline: 24px;
	box-sizing: border-box;
	overflow: hidden;
	color: var(--navFg);
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
	@media (max-width: 500px) {
		padding-inline: 16px;
		&.tabs > .buttons > :deep(.follow-button > span) {
			display: none;
		}
	}
	@media (max-width: 700px) {
		> .left {
			min-width: unset !important;
			max-width: 40%;
		}
		> .left,
		> .right {
			flex: unset !important;
		}
		&:not(.tabs) {
			> .left {
				width: 0 !important;
				flex-grow: 1 !important;
				max-width: unset !important;
			}
		}
		&.tabs {
			> .left {
				flex-shrink: 0 !important;
			}

			.buttons ~ .titleContainer > .title {
				display: none;
			}
		}
	}

	&::before {
		content: "";
		position: absolute;
		inset: 0;
		border-bottom: solid 0.5px var(--divider);
		z-index: -1;
	}
	&::after {
		content: "";
		position: absolute;
		inset: 0;
		background: var(--bg);
		opacity: 0.85;
		z-index: -2;
	}

	&.thin {
		--height: 45px;

		.buttons {
			> .button {
				font-size: 0.9em;
			}
		}
	}

	> .left {
		display: flex;
		> .buttons {
			&:not(:empty) {
				margin-right: 8px;
				margin-left: calc(0px - var(--margin));
			}
			> .avatar {
				width: 32px;
				height: 32px;
				margin-left: var(--margin);
			}
		}
	}

	.buttons {
		--margin: 8px;
		display: flex;
		align-items: center;
		height: var(--height);
		&.right {
			justify-content: flex-end;
			z-index: 2;
			// margin-right: calc(0px - var(--margin));
			// margin-left: var(--margin);
			> .button:last-child {
				margin-right: calc(0px - var(--margin));
			}
		}

		> .fullButton {
			& + .fullButton {
				margin-left: 12px;
			}
		}
	}

	> .left {
		> .backButton {
			display: flex;
			align-items: center;
			justify-content: center;
		}
		> .titleContainer {
			display: flex;
			align-items: center;
			max-width: 400px;
			overflow: auto;
			white-space: nowrap;
			text-align: left;
			font-weight: bold;
			flex-shrink: 0;
			> .avatar {
				$size: 32px;
				display: inline-block;
				width: $size;
				height: $size;
				vertical-align: bottom;
				margin-right: 8px;
			}

			> .icon {
				margin-right: 8px;
				min-width: 16px;
				width: 1em;
				text-align: center;
			}

			> .title {
				min-width: 0;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
				line-height: 1.1;

				> .subtitle {
					opacity: 0.6;
					font-size: 0.8em;
					font-weight: normal;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;

					&.activeTab {
						text-align: center;

						> .chevron {
							display: inline-block;
							margin-left: 6px;
						}
					}
				}
			}
		}
	}

	> .left,
	> .right {
		flex-basis: 100%;
		flex-shrink: 9999;
		overflow: hidden;
	}
	> .left {
		min-width: 20%;
		margin-left: -10px;
		padding-left: 10px;
	}
	> .right {
		// margin-left: auto;
		min-width: max-content;
		margin-right: -10px;
		padding-right: 10px;
	}

	> .tabs {
		min-width: 640px;
		position: relative;
		font-size: 1em;
		overflow-x: auto;
		white-space: nowrap;
		contain: content;
		display: flex;
		padding-inline: 20px;
		margin-inline: -20px;
		mask: linear-gradient(
			to right,
			transparent,
			black 20px calc(100% - 20px),
			transparent
		);
		-webkit-mask: linear-gradient(
			to right,
			transparent,
			black 20px calc(100% - 20px),
			transparent
		);
		scrollbar-width: none;
		&::-webkit-scrollbar {
			display: none;
		}

		&.collapse {
			--width: 2.7em;
			// --width: 1.33333em
			> .tab {
				width: 2.7em;
				min-width: 2.7em !important;
				&:not(.active) > .title {
					opacity: 0;
				}
			}
		}
		&:not(.collapse) > .tab {
			--width: max-content !important;
		}

		> .tab {
			display: inline-flex;
			align-items: center;
			position: relative;
			border-inline: 10px solid transparent;
			height: 100%;
			min-width: max-content;
			font-weight: normal;
			opacity: 0.7;
			overflow: hidden;
			transition:
				color 0.2s,
				opacity 0.2s,
				width 0.2s,
				min-width 0.2s;
			--width: 38px;

			&:hover {
				opacity: 1;
			}

			&.active {
				opacity: 1;
				color: var(--navFg);
				font-weight: 600;
				width: var(--width);
				min-width: var(--width) !important;
			}

			> .icon + .title {
				margin-left: 8px;
			}
			> .title {
				transition: opacity 0.2s;
			}
		}
		> .highlight {
			position: absolute;
			bottom: 0;
			left: 0;
			height: 3px;
			background: var(--accent);
			border-radius: 999px;
			transition:
				width 0.2s,
				transform 0.2s;
			transition-timing-function: cubic-bezier(0, 0, 0, 1.2);
			pointer-events: none;
		}
	}

	.selected {
		color: var(--accent);
	}

	._buttonIcon:before {
		background: transparent;
	}

	._buttonIcon:hover {
		&:before {
			background: transparent;
		}

		transition:
			color 0.2s;
		transition-timing-function: cubic-bezier(0, 0, 0, 1.2);
		color: var(--accentLighten);
	}
}
</style>
