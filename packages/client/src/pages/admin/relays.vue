<template>
	<MkStickyContainer>
		<template #header
			><MkPageHeader
				:actions="headerActions"
				:tabs="headerTabs"
				:display-back-button="true"
		/></template>
		<MkSpacer :content-max="800">
			<div
				v-for="relay in relays"
				:key="relay.inbox"
				class="relaycxt _panel _block"
				style="padding: 16px"
			>
				<div>{{ relay.inbox }}</div>
				<div class="status">
					<i
						v-if="relay.status === 'accepted'"
						class="ph-check ph-bold ph-lg icon accepted"
					></i>
					<i
						v-else-if="relay.status === 'rejected'"
						class="ph-prohibit ph-bold ph-lg icon rejected"
					></i>
					<i
						v-else
						class="ph-clock ph-bold ph-lg icon requesting"
					></i>
					<span>{{ i18n.t(`_relayStatus.${relay.status}`) }}</span>
				</div>
				<MkButton
					class="button"
					inline
					danger
					@click="remove(relay.inbox)"
					><i class="ph-trash ph-bold ph-lg"></i>
					{{ i18n.ts.remove }}</MkButton
				>
			</div>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import {} from "vue";
import MkButton from "@/components/MkButton.vue";
import * as os from "@/os";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";

let relays: any[] = $ref([]);

async function addRelay() {
	const { canceled, result: inbox } = await os.inputText({
		title: i18n.ts.addRelay,
		type: "url",
		placeholder: i18n.ts.inboxUrl,
	});
	if (canceled) return;
	os.api("admin/relays/add", {
		inbox,
	})
		.then((relay: any) => {
			refresh();
		})
		.catch((err: any) => {
			os.alert({
				type: "error",
				text: err.message || err,
			});
		});
}

function remove(inbox: string) {
	os.api("admin/relays/remove", {
		inbox,
	})
		.then(() => {
			refresh();
		})
		.catch((err: any) => {
			os.alert({
				type: "error",
				text: err.message || err,
			});
		});
}

function refresh() {
	os.api("admin/relays/list").then((relayList: any) => {
		relays = relayList;
	});
}

refresh();

const headerActions = $computed(() => [
	{
		asFullButton: true,
		icon: "ph-plus ph-bold ph-lg",
		text: i18n.ts.addRelay,
		handler: addRelay,
	},
]);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.relays,
	icon: "ph-arrows-merge ph-bold ph-lg",
});
</script>

<style lang="scss" scoped>
.relaycxt {
	> .status {
		margin: 8px 0;

		> .icon {
			width: 1em;
			margin-right: 0.75em;

			&.accepted {
				color: var(--success);
			}

			&.rejected {
				color: var(--error);
			}
		}
	}
}
</style>
