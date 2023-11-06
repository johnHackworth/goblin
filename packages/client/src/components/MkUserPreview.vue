<template>
	<transition
		:name="$store.state.animation ? 'popup' : ''"
		appear
		@after-leave="emit('closed')"
	>
		<div
			v-if="showing"
			class="fxxzrfni _popup _shadow"
			:style="{ zIndex, top: top + 'px', left: left + 'px' }"
			@mouseover="
				() => {
					emit('mouseover');
				}
			"
			@mouseleave="
				() => {
					emit('mouseleave');
				}
			"
		>
			<MkUserInfo v-if="user != null" :user="user" :detailed="true" />
			<div v-else>
				<MkLoading />
			</div>
		</div>
	</transition>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import MkUserInfo from "@/components/MkUserInfo.vue";
import * as Acct from "firefish-js/built/acct";
import type * as misskey from "firefish-js";
import * as os from "@/os";

const props = defineProps<{
	showing: boolean;
	q: string;
	source: HTMLElement;
}>();

const emit = defineEmits<{
	(ev: "closed"): void;
	(ev: "mouseover"): void;
	(ev: "mouseleave"): void;
}>();

const zIndex = os.claimZIndex("middle");
let user = $ref<misskey.entities.UserDetailed | null>(null);
let top = $ref(0);
let left = $ref(0);

onMounted(() => {
	if (typeof props.q === "object") {
		user = props.q;
	} else {
		const query = props.q.startsWith("@")
			? Acct.parse(props.q.slice(1))
			: { userId: props.q };

		os.api("users/show", query).then((res) => {
			if (!props.showing) return;
			user = res;
		});
	}

	const rect = props.source.getBoundingClientRect();
	const x =
		rect.left + props.source.offsetWidth / 2 - 300 / 2 + window.pageXOffset;
	const y = rect.top + props.source.offsetHeight + window.pageYOffset;

	top = y;
	left = x;
});
</script>

<style lang="scss" scoped>
.popup-enter-active,
.popup-leave-active {
	transition:
		opacity 0.3s,
		transform 0.3s !important;
}
.popup-enter-from,
.popup-leave-to {
	opacity: 0;
	transform: scale(0.9);
}

.fxxzrfni {
	position: absolute;
	width: 300px;
	overflow: hidden;
	transform-origin: center top;
}
</style>
