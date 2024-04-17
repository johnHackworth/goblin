<template>
	<button
		class="kpoogebi _button block-button"
		:class="{
			active: isBlocking
		}"
		:disabled="wait"
		@click.stop="onClick"
		:aria-label="`Follow #${props.tag}`"
		v-tooltip="`Follow #${props.tag}`"
		v-if="$i != null"
	>
		<template v-if="isBlocking">
			<span>{{ i18n.ts.unblock }}</span>
			<span x-if="isShort">#{{ tag }}</span>
			<i class="ph-lock-open ph-bold ph-lg"></i>
		</template>
		<template v-else>
			<span>{{ i18n.ts.block }}</span>
			<span v-if="isShort">#{{ tag }}</span>
			<i class="ph-plus ph-bold ph-lg"></i>
		</template>
	</button>
</template>

<script lang="ts" setup>
import * as os from "@/os";
import { i18n } from "@/i18n";
import { $i } from "@/account";

const emit = defineEmits(["refresh"]);
const props = defineProps<{
	tag: string;
}>();

let wait = $ref(false);
let isBlocking = $ref($i?.blockedHashtags.includes(props.tag));

let isShort = $ref(props.tag.length < 15);

function onBlockChange(newValue) {
	isBlocking = newValue;
}

async function onClick() {
	wait = true;

	try {
		if (isBlocking) {
			await os.api("hashtags/unblock", {
				hashtag: props.tag,
			}).then(onBlockChange(false));
		} else {
			await os.api("hashtags/block", {
				hashtag: props.tag,
			}).then(onBlockChange(true));
		}
		emit("refresh");
	} catch (err) {
		console.error(err);
	} finally {
		wait = false;
	}
}
</script>

<style lang="scss" scoped>
.block-button {
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-weight: bold;
	color: darkred;
	border: solid 1px red;
	padding: 0;
	font-size: 16px;
	width: 2em;
	height: 2em;
	border-radius: 100px;
	background: var(--bg);
	vertical-align: middle;

	padding: 0.2em 0.7em;
	width: auto;
	font-size: 14px;

	&.large {
		font-size: 16px;
		height: 38px;
		padding: 0 12px 0 16px;
	}

	&:focus-visible {
		&:after {
			content: "";
			pointer-events: none;
			position: absolute;
			top: -5px;
			right: -5px;
			bottom: -5px;
			left: -5px;
			border: 2px solid var(--focus);
			border-radius: 32px;
		}
	}

	&:hover {
		//background: mix($primary, #fff, 20);
	}

	&:active {
		//background: mix($primary, #fff, 40);
	}

	&.active {
		color: white;
		background: darkred;

		&:hover {
			background: red;
			border-color: darkred;
		}

		&:active {
			background: red;
			border-color: darkred;
		}
	}

	&.wait {
		cursor: wait !important;
		opacity: 0.7;
	}

	> span {
		margin-right: 6px;
	}
}
</style>
