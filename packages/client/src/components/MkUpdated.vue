<template>
	<MkModal
		ref="modal"
		:z-priority="'middle'"
		@click="$refs.modal.close()"
		@closed="$emit('closed')"
	>
		<div :class="$style.root">
			<div :class="$style.title">
				<MkSparkle>{{ i18n.ts.misskeyUpdated }}</MkSparkle>
			</div>
			<div :class="$style.version">✨ {{ version }} 🚀</div>
			<div v-if="newRelease" :class="$style.releaseNotes">
				<Mfm :text="data.notes" />
				<div v-if="data.screenshots.length > 0" style="max-width: 500">
					<img
						v-for="i in data.screenshots"
						:key="i"
						:src="i"
						alt="screenshot"
					/>
				</div>
			</div>
			<MkButton
				:class="$style.gotIt"
				primary
				full
				@click="$refs.modal.close()"
				>{{ i18n.ts.gotIt }}</MkButton
			>
		</div>
	</MkModal>
</template>

<script lang="ts" setup>
import { shallowRef } from "vue";
import MkModal from "@/components/MkModal.vue";
import MkSparkle from "@/components/MkSparkle.vue";
import MkButton from "@/components/MkButton.vue";
import { version } from "@/config";
import { i18n } from "@/i18n";
import * as os from "@/os";

const modal = shallowRef<InstanceType<typeof MkModal>>();

let newRelease = $ref(false);
let data = $ref(Object);

os.api("release").then((res) => {
	data = res;
	newRelease = version === data?.version;
});

console.log(`Version: ${version}`);
console.log(`Data version: ${data.version}`);
console.log(newRelease);
console.log(data);
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
}

.version {
	margin: 1em 0;
}

.gotIt {
	margin: 8px 0 0 0;
}

.releaseNotes {
	> img {
		border-radius: 10px;
	}
}
</style>
