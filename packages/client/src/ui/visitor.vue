<template>
	<DesignB />
	<XCommon />
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from "vue";
import DesignA from "./visitor/a.vue";
import DesignB from "./visitor/b.vue";
import XCommon from "./_common_/common.vue";
import { i18n } from "@/i18n";

export default defineComponent({
	components: {
		XCommon,
		DesignA,
		DesignB,
	},
});
</script>
