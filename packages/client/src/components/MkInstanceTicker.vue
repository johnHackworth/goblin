<template>
	<div
		class="hpaizdrt"
		v-tooltip="capitalize(instance.softwareName)"
		ref="ticker"
		:style="bg"
	>
		<img class="icon" :src="getInstanceIcon(instance)" aria-hidden="true" />
		<span class="name">{{ instance.name }}</span>
	</div>
</template>

<script lang="ts" setup>
import { instanceName } from "@/config";
import { instance as Instance } from "@/instance";
import { getProxiedImageUrlNullable } from "@/scripts/media-proxy";

const props = defineProps<{
	instance?: {
		faviconUrl?: string;
		name: string;
		themeColor?: string;
		softwareName?: string;
	};
}>();

let ticker = $ref<HTMLElement | null>(null);

// if no instance data is given, this is for the local instance
const instance = props.instance ?? {
	faviconUrl: Instance.iconUrl || Instance.faviconUrl || "/favicon.ico",
	name: instanceName,
	themeColor: (
		document.querySelector(
			'meta[name="theme-color-orig"]',
		) as HTMLMetaElement
	)?.content,
	softwareName: Instance.softwareName || "Firefish",
};

const capitalize = (s: string) => s && s[0].toUpperCase() + s.slice(1);

const computedStyle = getComputedStyle(document.documentElement);
const themeColor =
	instance.themeColor ?? computedStyle.getPropertyValue("--bg");

const bg = {
	background: `linear-gradient(90deg, ${themeColor}, ${themeColor}55)`,
};

function getInstanceIcon(instance): string {
	return (
		getProxiedImageUrlNullable(instance.iconUrl, "preview") ??
		getProxiedImageUrlNullable(instance.faviconUrl, "preview") ??
		"/client-assets/dummy.png"
	);
}
</script>

<style lang="scss" scoped>
.hpaizdrt {
	display: flex;
	align-items: center;
	height: 1.1em;
	justify-self: flex-end;
	padding: 0.2em 0.4em;
	border-radius: 100px;
	font-size: 0.8em;
	text-shadow: 0 2px 2px var(--shadow);
	overflow: hidden;
	.header > .body & {
		width: max-content;
		max-width: 100%;
	}

	> .icon {
		height: 100%;
		border-radius: 0.3rem;
	}

	> .name {
		display: none;
		margin-left: 4px;
		font-size: 0.85em;
		vertical-align: top;
		font-weight: bold;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-shadow:
			-1px -1px 0 var(--bg),
			1px -1px 0 var(--bg),
			-1px 1px 0 var(--bg),
			1px 1px 0 var(--bg);
		.article > .main &,
		.header > .body & {
			display: unset;
		}
	}
}
</style>
