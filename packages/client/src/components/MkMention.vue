<template>
	<MkA
		v-if="url.startsWith('/')"
		v-user-preview="canonical"
		class="mention"
		:class="{ isMe }"
		:to="url"
		@click.stop
	>
		<img class="icon" :src="`/avatar/@${username}@${host}`" alt="" />
		<span class="main">
			<span class="username">@{{ username }}</span>
			<span
				v-if="host != localHost || $store.state.showFullAcct"
				class="host"
				>@{{ toUnicode(host) }}</span
			>
		</span>
	</MkA>
	<a
		v-else
		class="mention"
		:href="url"
		target="_blank"
		rel="noopener"
		:style="{ background: bgCss }"
		@click.stop
	>
		<span class="main">
			<span class="username">@{{ username }}</span>
			<span class="host">@{{ toUnicode(host) }}</span>
		</span>
	</a>
</template>

<script lang="ts" setup>
import { toUnicode } from "punycode";
import {} from "vue";
import { host as localHost } from "@/config";
import { $i } from "@/account";

const props = defineProps<{
	username: string;
	host: string;
}>();

const canonical =
	props.host === localHost
		? `@${props.username}`
		: `@${props.username}@${toUnicode(props.host)}`;

const url = `/${canonical}`;

const isMe =
	$i &&
	`@${props.username}@${toUnicode(props.host)}` ===
		`@${$i.username}@${toUnicode(localHost)}`.toLowerCase();
</script>

<style lang="scss" scoped>
.mention {
	position: relative;
	display: inline-block;
	padding: 2px 8px 2px 2px;
	margin-block: 2px;
	border-radius: 999px;
	max-width: 100%;
	white-space: nowrap;
	text-overflow: ellipsis;
	color: var(--mention);
	isolation: isolate;

	&::before {
		content: "";
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background: var(--mention);
		opacity: 0.1;
		z-index: -1;
	}

	&.isMe {
		--mention: var(--mentionMe);
	}

	> .icon {
		width: 1.5em;
		height: 1.5em;
		object-fit: cover;
		margin: 0 0.2em 0 0;
		vertical-align: bottom;
		border-radius: 100%;
	}

	> .main > .host {
		opacity: 0.5;
	}
}
</style>
