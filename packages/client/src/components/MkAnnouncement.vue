<template>
	<MkModal ref="modal" :z-priority="'middle'" @closed="$emit('closed')">
		<div :class="$style.root">
			<div :class="$style.title">
				<MkSparkle v-if="isGoodNews">{{ title }}</MkSparkle>
				<p v-else>{{ title }}</p>
			</div>
			<div :class="$style.time">
				<MkTime :time="announcement.createdAt" />
				<div v-if="announcement.updatedAt">
					{{ i18n.ts.updatedAt }}:
					<MkTime :time="announcement.createdAt" />
				</div>
			</div>
			<Mfm :text="text" />
			<img
				v-if="imageUrl != null"
				:key="imageUrl"
				:src="imageUrl"
				alt="attached image"
			/>
			<MkButton :class="$style.gotIt" primary full @click="gotIt()">{{
				i18n.ts.gotIt
			}}</MkButton>
		</div>
	</MkModal>
</template>

<script lang="ts" setup>
import { shallowRef } from "vue";
import MkModal from "@/components/MkModal.vue";
import MkSparkle from "@/components/MkSparkle.vue";
import MkButton from "@/components/MkButton.vue";
import { i18n } from "@/i18n";
import * as os from "@/os";

const props = defineProps<{
	announcement: Announcement;
}>();

const { id, text, title, imageUrl, isGoodNews } = props.announcement;

const modal = shallowRef<InstanceType<typeof MkModal>>();

const gotIt = () => {
	modal.value.close();
	os.api("i/read-announcement", { announcementId: id });
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

	> img {
		border-radius: 10px;
		max-height: 100%;
		max-width: 100%;
	}
}

.title {
	font-weight: bold;

	> p {
		margin: 0;
	}
}

.time {
	font-size: 0.8rem;
}

.gotIt {
	margin: 8px 0 0 0;
}
</style>
