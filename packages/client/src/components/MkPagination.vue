<template>
	<transition :name="$store.state.animation ? 'fade' : ''" mode="out-in">
		<MkLoading v-if="fetching" />

		<MkError v-else-if="error" @retry="init()" />

		<div v-else-if="empty" key="_empty_" :class="`empty ${props.small ? 'small': ''}`">
			<slot name="empty">
				<div class="_fullinfo">
					<img
						src="/static-assets/badges/info.png"
						class="_ghost"
						alt="Error"
					/>
					<div>{{ i18n.ts.nothing }}</div>
				</div>
			</slot>
		</div>

		<div v-else ref="rootEl" class="list">
			<div
				v-show="pagination.reversed && more"
				key="_more_"
				class="cxiknjgy _gap"
			>
				<MkButton
					v-if="!moreFetching"
					class="button"
					:disabled="moreFetching"
					:style="{ cursor: moreFetching ? 'wait' : 'pointer' }"
					primary
					@click="fetchMoreAhead"
				>
					{{ i18n.ts.loadMore }}
				</MkButton>
				<MkLoading v-else class="loading" />
			</div>
			<slot :items="items"></slot>
			<div
				v-show="!pagination.reversed && more"
				key="_more_"
				class="cxiknjgy _gap"
			>
				<MkButton
					v-if="!moreFetching"
					v-appear="
						$store.state.enableInfiniteScroll && !disableAutoLoad
							? fetchMore
							: null
					"
					class="button"
					:disabled="moreFetching"
					:style="{ cursor: moreFetching ? 'wait' : 'pointer' }"
					primary
					@click="fetchMore"
				>
					{{ i18n.ts.loadMore }}
				</MkButton>
				<MkLoading v-else class="loading" />
			</div>
		</div>
	</transition>
</template>

<script lang="ts" setup>
import {
	computed,
	ComputedRef,
	isRef,
	markRaw,
	onActivated,
	onDeactivated,
	Ref,
	ref,
	watch,
} from "vue";
import * as misskey from "firefish-js";
import * as os from "@/os";
import {
	onScrollTop,
	isTopVisible,
	getScrollPosition,
	getScrollContainer,
} from "@/scripts/scroll";
import MkButton from "@/components/MkButton.vue";
import { i18n } from "@/i18n";
import { apiUrl } from "@/config";

export type Paging<
	E extends keyof misskey.Endpoints = keyof misskey.Endpoints,
> = {
	endpoint: E;
	limit: number;
	params?:
		| misskey.Endpoints[E]["req"]
		| ComputedRef<misskey.Endpoints[E]["req"]>;

	/**
	 * 検索APIのような、ページング不可なエンドポイントを利用する場合
	 * (そのようなAPIをこの関数で使うのは若干矛盾してるけど)
	 */
	noPaging?: boolean;

	/**
	 * items 配列の中身を逆順にする(新しい方が最後)
	 */
	reversed?: boolean;

	offsetMode?: boolean;
};

const SECOND_FETCH_LIMIT = 30;

const props = withDefaults(
	defineProps<{
		pagination: Paging;
		disableAutoLoad?: boolean;
		displayLimit?: number;
		small?: boolean;
	}>(),
	{
		displayLimit: 30,
	},
);

const emit = defineEmits<{
	(ev: "queue", count: number): void;
}>();

type Item = { id: string; [another: string]: unknown };

const rootEl = ref<HTMLElement>();
const items = ref<Item[]>([]);
const queue = ref<Item[]>([]);
const offset = ref(0);
const fetching = ref(true);
const moreFetching = ref(false);
const more = ref(false);
const backed = ref(false); // 遡り中か否か
const isBackTop = ref(false);
const empty = computed(() => items.value.length === 0);
const error = ref(false);

const userCache = {}

const bringReblogs = async (item) => {
	const reblogtrailResponse = await fetch(`${apiUrl}/note/reblogtrail?noteId=${item.id}`, {
		method: "GET"
	});

	if(reblogtrailResponse.status != 200) {
		return [];
	}

	if(!reblogtrailResponse || !reblogtrailResponse.json) {
		return [];
	}

	let reblogtrail = await reblogtrailResponse.json();
	if(!reblogtrail || reblogtrail.error || !reblogtrail.length ) {
		return [];
	}

	for(let i = 0; i < reblogtrail.length; i++) {
		const post = reblogtrail[i];
		if(post.replyId) {
			post.replyId = null;;
			post.reply = null;
			post.threadId = null;
		}
		if(!post.user) {
			if(userCache[post.userId]) {
				post.user = userCache[post.userId];
			} else {
				post.user = await os.api("users/show", {
					userId: post.userId,
				})
				userCache[post.userId] = post.user;
			}
		}
		if(!post.files) {
			post.files = [];
		}
		reblogtrail[i] = post;
	}
	return reblogtrail.reverse();
}

const init = async (): Promise<void> => {
	queue.value = [];
	fetching.value = true;
	const params = props.pagination.params
		? isRef(props.pagination.params)
			? props.pagination.params.value
			: props.pagination.params
		: {};
	await os
		.api(props.pagination.endpoint, {
			...params,
			limit: props.pagination.noPaging
				? props.pagination.limit || 10
				: (props.pagination.limit || 10) + 1,
		})
		.then(
			async (res) => {
				for (let i = 0; i < res.length; i++) {
					const item = res[i];
					if(item.replyId && (item.userHost || item.user.host) && !item.reblogtrail.length) {
						// item.reblogtrail = await bringReblogs(item)
					}
				}
				if (
					!props.pagination.noPaging &&
					res.length > (props.pagination.limit || 10)
				) {
					res.pop();
					items.value = props.pagination.reversed
						? [...res].reverse()
						: res;
					more.value = true;
				} else {
					items.value = props.pagination.reversed
						? [...res].reverse()
						: res;
					more.value = false;
				}
				offset.value = res.length;
				error.value = false;
				fetching.value = false;
			},
			(err) => {
				error.value = true;
				fetching.value = false;
			},
		);
};

const reload = (): void => {
	items.value = [];
	init();
};

const refresh = async (): void => {
	const params = props.pagination.params
		? isRef(props.pagination.params)
			? props.pagination.params.value
			: props.pagination.params
		: {};
	await os
		.api(props.pagination.endpoint, {
			...params,
			limit: items.value.length + 1,
			offset: 0,
		})
		.then(
			async (res) => {
				let ids = items.value.reduce(
					(a, b) => {
						a[b.id] = true;
						return a;
					},
					{} as { [id: string]: boolean },
				);

				for (let i = 0; i < res.length; i++) {
					const item = res[i];
					if(item.replyId && (item.userHost || item.user.host) && !item.reblogtrail.length) {
						//item.reblogtrail = await bringReblogs(item)
					}
					if (!updateItem(item.id, (old) => item)) {
						append(item);
					}
					delete ids[item.id];
				}

				for (const id in ids) {
					removeItem((i) => i.id === id);
				}
			},
			(err) => {
				error.value = true;
				fetching.value = false;
			},
		);
};

const fetchMore = async (): Promise<void> => {
	if (
		!more.value ||
		fetching.value ||
		moreFetching.value ||
		items.value.length === 0
	)
		return;
	moreFetching.value = true;
	backed.value = true;
	const params = props.pagination.params
		? isRef(props.pagination.params)
			? props.pagination.params.value
			: props.pagination.params
		: {};
	await os
		.api(props.pagination.endpoint, {
			...params,
			limit: SECOND_FETCH_LIMIT + 1,
			...(props.pagination.offsetMode
				? {
						offset: offset.value,
				  }
				: props.pagination.reversed
				? {
						sinceId: items.value[0].id,
				  }
				: {
						untilId: items.value[items.value.length - 1].id,
				  }),
		})
		.then(
			async (res) => {
				for (let i = 0; i < res.length; i++) {
					const item = res[i];
					if(item.replyId && (item.userHost || item.user.host) && !item.reblogtrail.length) {
						// item.reblogtrail = await bringReblogs(item)
					}
				}
				if (res.length > SECOND_FETCH_LIMIT) {
					res.pop();
					items.value = props.pagination.reversed
						? [...res].reverse().concat(items.value)
						: items.value.concat(res);
					more.value = true;
				} else {
					items.value = props.pagination.reversed
						? [...res].reverse().concat(items.value)
						: items.value.concat(res);
					more.value = false;
				}
				offset.value += res.length;
				moreFetching.value = false;
			},
			(err) => {
				console.log(err);
				moreFetching.value = false;
			},
		);
};

const fetchMoreAhead = async (): Promise<void> => {
	if (
		!more.value ||
		fetching.value ||
		moreFetching.value ||
		items.value.length === 0
	)
		return;
	moreFetching.value = true;
	const params = props.pagination.params
		? isRef(props.pagination.params)
			? props.pagination.params.value
			: props.pagination.params
		: {};
	await os
		.api(props.pagination.endpoint, {
			...params,
			limit: SECOND_FETCH_LIMIT + 1,
			...(props.pagination.offsetMode
				? {
						offset: offset.value,
				  }
				: props.pagination.reversed
				? {
						untilId: items.value[0].id,
				  }
				: {
						sinceId: items.value[items.value.length - 1].id,
				  }),
		})
		.then(
			(res) => {
				if (res.length > SECOND_FETCH_LIMIT) {
					res.pop();
					items.value = props.pagination.reversed
						? [...res].reverse().concat(items.value)
						: items.value.concat(res);
					more.value = true;
				} else {
					items.value = props.pagination.reversed
						? [...res].reverse().concat(items.value)
						: items.value.concat(res);
					more.value = false;
				}
				offset.value += res.length;
				moreFetching.value = false;
			},
			(err) => {
				moreFetching.value = false;
			},
		);
};

const prepend = (item: Item): void => {
	if (props.pagination.reversed) {
		if (rootEl.value) {
			const container = getScrollContainer(rootEl.value);
			if (container == null) {
				// TODO?
			} else {
				const pos = getScrollPosition(rootEl.value);
				const viewHeight = container.clientHeight;
				const height = container.scrollHeight;
				const isBottom = pos + viewHeight > height - 32;
				if (isBottom) {
					// オーバーフローしたら古いアイテムは捨てる
					if (items.value.length >= props.displayLimit) {
						// このやり方だとVue 3.2以降アニメーションが動かなくなる
						//items.value = items.value.slice(-props.displayLimit);
						while (items.value.length >= props.displayLimit) {
							items.value.shift();
						}
						more.value = true;
					}
				}
			}
		}
		items.value.push(item);
		// TODO
	} else {
		// 初回表示時はunshiftだけでOK
		if (!rootEl.value) {
			items.value.unshift(item);
			return;
		}

		const isTop =
			isBackTop.value ||
			(document.body.contains(rootEl.value) &&
				isTopVisible(rootEl.value));

		if (isTop) {
			// Prepend the item
			items.value.unshift(item);

			// オーバーフローしたら古いアイテムは捨てる
			if (items.value.length >= props.displayLimit) {
				// このやり方だとVue 3.2以降アニメーションが動かなくなる
				//this.items = items.value.slice(0, props.displayLimit);
				while (items.value.length >= props.displayLimit) {
					items.value.pop();
				}
				more.value = true;
			}
		} else {
			queue.value.push(item);
			onScrollTop(rootEl.value, () => {
				for (const queueItem of queue.value) {
					prepend(queueItem);
				}
				queue.value = [];
			});
		}
	}
};

const append = (item: Item): void => {
	items.value.push(item);
};

const removeItem = (finder: (item: Item) => boolean): boolean => {
	const i = items.value.findIndex(finder);
	if (i === -1) {
		return false;
	}

	items.value.splice(i, 1);
	return true;
};

const updateItem = (id: Item["id"], replacer: (old: Item) => Item): boolean => {
	const i = items.value.findIndex((item) => item.id === id);
	if (i === -1) {
		return false;
	}

	items.value[i] = replacer(items.value[i]);
	return true;
};

if (props.pagination.params && isRef(props.pagination.params)) {
	watch(props.pagination.params, init, { deep: true });
}

watch(
	queue,
	(a, b) => {
		if (a.length === 0 && b.length === 0) return;
		emit("queue", queue.value.length);
	},
	{ deep: true },
);

init();

onActivated(() => {
	isBackTop.value = false;
});

onDeactivated(() => {
	isBackTop.value = window.scrollY === 0;
});

defineExpose({
	items,
	queue,
	backed,
	reload,
	refresh,
	prepend,
	append,
	removeItem,
	updateItem,
});
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.125s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.cxiknjgy {
	> .button {
		margin-left: auto;
		margin-right: auto;
	}
}
.list > :deep(._button) {
	margin-inline: auto;
	margin-bottom: 16px;
	&:last-of-type:not(:first-child) {
		margin-top: 16px;
	}
}
</style>
