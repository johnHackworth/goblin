<template>
	<transition :name="$store.state.animation ? 'zoom' : ''" appear>
		<div :class="$style.root">
			<img
				src="/static-assets/badges/info.png"
				class="_ghost"
				alt="Error"
			/>
			<p>
				<i class="ph-warning ph-bold ph-lg"></i>
				{{ i18n.ts.noGraze }}
			</p>
		</div>
	</transition>
</template>

<script lang="ts" setup>
import { i18n } from "@/i18n";
</script>

<style lang="scss" module>
.root {
	padding: 32px;
	text-align: center;

	> p {
		margin: 0 0 8px 0;
	}

	> img {
		vertical-align: bottom;
		height: 128px;
		margin-bottom: 16px;
		border-radius: 16px;
	}
}
</style>
