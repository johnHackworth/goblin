<template>
	<FocusTrap
		ref="focusTrap"
		v-model:active="isActive"
		:return-focus-on-deactivate="!noReturnFocus"
		@deactivate="emit('close')"
	>
		<div>
			<div
				ref="itemsEl"
				class="rrevdjwt _popup _shadow"
				:class="{ center: align === 'center', asDrawer }"
				:style="{
					width: width && !asDrawer ? width + 'px' : '',
					maxHeight: maxHeight ? maxHeight + 'px' : '',
				}"
				@contextmenu.self="(e) => e.preventDefault()"
				tabindex="-1"
			>
				<template v-for="(item, i) in items2">
					<div v-if="item === null" class="divider"></div>
					<span v-else-if="item.type === 'label'" class="label item">
						<span :style="item.textStyle || ''">{{
							item.text
						}}</span>
					</span>
					<span
						v-else-if="item.type === 'pending'"
						class="pending item"
					>
						<span><MkEllipsis /></span>
					</span>
					<MkA
						v-else-if="item.type === 'link'"
						:to="item.to"
						class="_button item"
						@click.passive="close(true)"
						@mouseenter.passive="onItemMouseEnter(item)"
						@mouseleave.passive="onItemMouseLeave(item)"
					>
						<i
							v-if="item.icon"
							class="ph-fw ph-lg"
							:class="item.icon"
						></i>
						<MkAvatar
							v-if="item.avatar"
							:user="item.avatar"
							class="avatar"
							disableLink
						/>
						<span :style="item.textStyle || ''">{{
							item.text
						}}</span>
						<span
							v-if="item.indicate"
							class="indicator"
							:class="{
								animateIndicator: $store.state.animation,
							}"
							><i class="ph-circle ph-fill"></i
						></span>
					</MkA>
					<a
						v-else-if="item.type === 'a'"
						:href="item.href"
						:target="item.target"
						:download="item.download"
						class="_button item"
						@click="close(true)"
						@mouseenter.passive="onItemMouseEnter(item)"
						@mouseleave.passive="onItemMouseLeave(item)"
					>
						<i
							v-if="item.icon"
							class="ph-fw ph-lg"
							:class="item.icon"
						></i>
						<span :style="item.textStyle || ''">{{
							item.text
						}}</span>
						<span
							v-if="item.indicate"
							class="indicator"
							:class="{
								animateIndicator: $store.state.animation,
							}"
							><i class="ph-circle ph-fill"></i
						></span>
					</a>
					<button
						v-else-if="item.type === 'user' && !items.hidden"
						class="_button item"
						:class="{ active: item.active }"
						:disabled="item.active"
						@click="clicked(item.action, $event)"
						@mouseenter.passive="onItemMouseEnter(item)"
						@mouseleave.passive="onItemMouseLeave(item)"
					>
						<MkAvatar
							:user="item.user"
							class="avatar"
							disableLink
						/><MkUserName :user="item.user" />
						<span
							v-if="item.indicate"
							class="indicator"
							:class="{
								animateIndicator: $store.state.animation,
							}"
							><i class="ph-circle ph-fill"></i
						></span>
					</button>
					<span
						v-else-if="item.type === 'switch'"
						class="item"
						@mouseenter.passive="onItemMouseEnter(item)"
						@mouseleave.passive="onItemMouseLeave(item)"
					>
						<FormSwitch
							v-model="item.ref"
							:disabled="item.disabled"
							class="form-switch"
							:style="item.textStyle || ''"
							>{{ item.text }}</FormSwitch
						>
					</span>
					<button
						v-else-if="item.type === 'parent'"
						class="_button item parent"
						:class="{ childShowing: childShowingItem === item }"
						@mouseenter="showChildren(item, $event)"
						@click.stop="showChildren(item, $event)"
					>
						<i
							v-if="item.icon"
							class="ph-fw ph-lg"
							:class="item.icon"
						></i>
						<span :style="item.textStyle || ''">{{
							item.text
						}}</span>
						<span class="caret"
							><i
								class="ph-caret-right ph-bold ph-lg ph-fw ph-lg"
							></i
						></span>
					</button>
					<button
						v-else-if="!item.hidden"
						class="_button item"
						:class="{
							danger: item.danger,
							accent: item.accent,
							active: item.active,
						}"
						:disabled="item.active"
						@click="clicked(item.action, $event)"
						@mouseenter.passive="onItemMouseEnter(item)"
						@mouseleave.passive="onItemMouseLeave(item)"
					>
						<i
							v-if="item.icon"
							class="ph-fw ph-lg"
							:class="item.icon"
						></i>
						<MkAvatar
							v-if="item.avatar"
							:user="item.avatar"
							class="avatar"
							disableLink
						/>
						<span :style="item.textStyle || ''">{{
							item.text
						}}</span>
						<span
							v-if="item.indicate"
							class="indicator"
							:class="{
								animateIndicator: $store.state.animation,
							}"
							><i class="ph-circle ph-fill"></i
						></span>
					</button>
				</template>
				<span v-if="items2.length === 0" class="none item">
					<span>{{ i18n.ts.none }}</span>
				</span>
			</div>
			<div v-if="childMenu" class="child">
				<XChild
					ref="child"
					:items="childMenu"
					:target-element="childTarget"
					:root-element="itemsEl"
					showing
					@actioned="childActioned"
					@closed="closeChild"
				/>
			</div>
		</div>
	</FocusTrap>
</template>

<script lang="ts" setup>
import {
	computed,
	menu,
	defineAsyncComponent,
	nextTick,
	onBeforeUnmount,
	onMounted,
	onUnmounted,
	Ref,
	ref,
	watch,
} from "vue";
import { focusPrev, focusNext } from "@/scripts/focus";
import FormSwitch from "@/components/form/switch.vue";
import { MenuItem, InnerMenuItem, MenuPending, MenuAction } from "@/types/menu";
import * as os from "@/os";
import { i18n } from "@/i18n";
import { FocusTrap } from "focus-trap-vue";

const XChild = defineAsyncComponent(() => import("./MkMenu.child.vue"));
const focusTrap = ref();

const props = defineProps<{
	items: MenuItem[];
	viaKeyboard?: boolean;
	asDrawer?: boolean;
	align?: "center" | string;
	width?: number;
	maxHeight?: number;
	noReturnFocus?: boolean;
}>();

const emit = defineEmits<{
	(ev: "close", actioned?: boolean): void;
}>();

let itemsEl = $ref<HTMLDivElement>();

let items2: InnerMenuItem[] = $ref([]);

let child = $ref<InstanceType<typeof XChild>>();

let childShowingItem = $ref<MenuItem | null>();

watch(
	() => props.items,
	() => {
		const items: (MenuItem | MenuPending)[] = [...props.items].filter(
			(item) => item !== undefined,
		);

		for (let i = 0; i < items.length; i++) {
			const item = items[i];

			if (item && "then" in item) {
				// if item is Promise
				items[i] = { type: "pending" };
				item.then((actualItem) => {
					items2[i] = actualItem;
				});
			}
		}

		items2 = items as InnerMenuItem[];
	},
	{
		immediate: true,
	},
);

let childMenu = $ref<MenuItem[] | null>();
let childTarget = $ref<HTMLElement | null>();

function closeChild() {
	childMenu = null;
	childShowingItem = null;
}

function childActioned() {
	closeChild();
	close(true);
}

function onGlobalMousedown(event: MouseEvent) {
	if (
		childTarget &&
		(event.target === childTarget || childTarget.contains(event.target))
	)
		return;
	if (child && child.checkHit(event)) return;
	closeChild();
}

let childCloseTimer: null | number = null;
function onItemMouseEnter(item) {
	childCloseTimer = window.setTimeout(() => {
		closeChild();
	}, 300);
}
function onItemMouseLeave(item) {
	if (childCloseTimer) window.clearTimeout(childCloseTimer);
}

async function showChildren(item: MenuItem, ev: MouseEvent) {
	if (props.asDrawer) {
		os.popupMenu(item.children, ev.currentTarget ?? ev.target);
		close();
	} else {
		childTarget = ev.currentTarget ?? ev.target;
		childMenu = item.children;
		childShowingItem = item;
	}
}

function clicked(fn: MenuAction, ev: MouseEvent) {
	fn(ev);
	close(true);
}

function close(actioned = false) {
	emit("close", actioned);
}

onMounted(() => {
	document.addEventListener("mousedown", onGlobalMousedown, {
		passive: true,
	});
});

onBeforeUnmount(() => {
	document.removeEventListener("mousedown", onGlobalMousedown);
});
</script>

<style lang="scss" scoped>
.rrevdjwt {
	padding: 8px 0;
	box-sizing: border-box;
	min-width: 200px;
	overflow: auto;
	overscroll-behavior: contain;

	&.center {
		> .item {
			text-align: center;
		}
	}

	> .item {
		display: block;
		position: relative;
		padding: 6px 16px;
		width: 100%;
		box-sizing: border-box;
		white-space: nowrap;
		font-size: 0.9em;
		line-height: 20px;
		text-align: left;
		outline: none;

		&:before {
			content: "";
			display: block;
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			margin: auto;
			width: calc(100% - 16px);
			margin-bottom: 0.2rem;
			height: 100%;
			border-radius: 6px;
		}

		> * {
			position: relative;
		}

		&:not(:disabled):hover,
		&:focus-visible {
			color: var(--accent);
			text-decoration: none;

			&:before {
				background: var(--accentedBg);
			}
		}
		&:focus-visible:before {
			outline: auto;
		}

		&.danger {
			color: #eb6f92;

			&:hover {
				color: #e0def4;

				&:before {
					background: #eb6f92;
				}
			}

			&:active {
				color: #e0def4;

				&:before {
					background: #b4637a;
				}
			}
		}

		&.accent {
			color: var(--accent);

			&:hover {
				color: var(--accent);

				&:before {
					background: var(--accentedBg);
				}
			}

			&:active {
				color: var(--fgOnAccent);

				&:before {
					background: var(--accent);
				}
			}
		}

		&.active {
			color: var(--fgOnAccent);
			opacity: 1;

			&:before {
				background: var(--accent);
			}
		}

		&:not(:active):focus-visible {
			box-shadow: 0 0 0 2px var(--focus) inset;
		}

		&.label {
			pointer-events: none;
			font-size: 0.7em;
			padding-bottom: 4px;

			> span {
				opacity: 0.7;
			}
		}

		&.pending {
			pointer-events: none;
			opacity: 0.7;
		}

		&.none {
			pointer-events: none;
			opacity: 0.7;
		}

		&.parent {
			display: flex;
			align-items: center;
			cursor: default;

			> .caret {
				margin-left: auto;
			}

			&.childShowing {
				color: var(--accent);
				text-decoration: none;

				&:before {
					background: var(--accentedBg);
				}
			}
		}

		> i {
			margin-right: 5px;
			width: 20px;
		}

		> .avatar {
			margin-right: 5px;
			width: 20px;
			height: 20px;
		}

		> .indicator {
			position: absolute;
			top: 5px;
			left: 13px;
			color: var(--indicator);
			font-size: 12px;
		}

		> .animateIndicator {
			animation: blink 1s infinite;
		}
	}

	> .divider {
		margin: 8px 0;
		border-top: solid 0.5px var(--divider);
	}

	&.asDrawer {
		padding: 12px 0 calc(env(safe-area-inset-bottom, 0px) + 12px) 0;
		width: 100%;
		border-radius: 24px;
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 0;

		> .item {
			font-size: 1em;
			padding: 12px 24px;

			&:before {
				width: calc(100% - 24px);
				border-radius: 12px;
			}

			> i {
				margin-right: 14px;
				width: 24px;
			}
		}

		> .divider {
			margin: 12px 0;
		}
	}
}
</style>
