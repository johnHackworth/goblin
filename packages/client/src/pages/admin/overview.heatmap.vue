<template>
	<div class="_panel" :class="$style.root">
		<MkSelect v-model="src" style="margin: 0 0 12px 0" small>
			<option value="notes">Posts</option>
			<option value="active-users">Active users</option>
			<option value="ap-requests-inbox-received">
				Fediverse Requests: inboxReceived
			</option>
			<option value="ap-requests-deliver-succeeded">
				Fediverse Requests: deliverSucceeded
			</option>
			<option value="ap-requests-deliver-failed">
				Fediverse Requests: deliverFailed
			</option>
		</MkSelect>
		<MkHeatmap :src="src" />
	</div>
</template>

<script lang="ts" setup>
import MkHeatmap from "@/components/MkHeatmap.vue";
import MkSelect from "@/components/form/select.vue";

let src = $ref("notes");
</script>

<style lang="scss" module>
.root {
	padding: 20px;
}
</style>
