<template>
	<div v-if="meta">
		<XSetup v-if="meta.requireSetup" />
		<XEntrance v-else />
	</div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import XSetup from "./welcome.setup.vue";
import XEntrance from "./landing/index.vue";
import { instanceName } from "@/config";
import * as os from "@/os";
import { definePageMetadata } from "@/scripts/page-metadata";

let meta = $ref(null);

os.api("meta", { detail: true }).then((res) => {
	meta = res;
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(
	computed(() => ({
		title: instanceName,
		icon: null,
	})),
);
</script>
