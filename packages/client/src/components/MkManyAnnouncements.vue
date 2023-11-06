<template>
	<MkModal ref="modal" :z-priority="'middle'" @closed="$emit('closed')">
		<div :class="$style.root">
			<p :class="$style.title">
				{{ i18n.ts.youHaveUnreadAnnouncements }}
			</p>
			<MkButton
				:class="$style.gotIt"
				primary
				full
				@click="checkAnnouncements()"
				>{{ i18n.ts.gotIt }}</MkButton
			>
		</div>
	</MkModal>
</template>

<script lang="ts" setup>
import { shallowRef } from "vue";
import MkModal from "@/components/MkModal.vue";
import MkButton from "@/components/MkButton.vue";
import { i18n } from "@/i18n";
import * as os from "@/os";

const modal = shallowRef<InstanceType<typeof MkModal>>();
const checkAnnouncements = () => {
	modal.value.close();
	location.href = "/announcements";
};
</script>

<style lang="scss" module>
.root {
	margin: auto;
	position: relative;
	padding: 32px;
	min-width: 320px;
	max-width: 480px;
	box-sizing: border-box;
	text-align: center;
	background: var(--panel);
	border-radius: var(--radius);
}

.title {
	font-weight: bold;
	margin: 0;
}

.gotIt {
	margin: 8px 0 0 0;
}
</style>
