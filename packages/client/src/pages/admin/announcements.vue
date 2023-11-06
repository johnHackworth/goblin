<template>
	<MkStickyContainer>
		<template #header
			><MkPageHeader
				:actions="headerActions"
				:tabs="headerTabs"
				:display-back-button="true"
		/></template>
		<MkSpacer :content-max="900">
			<div :class="$style.root">
				<section
					v-for="announcement in announcements"
					class="_card _gap announcements"
				>
					<div class="_content announcement">
						<MkInput v-model="announcement.title">
							<template #label>{{ i18n.ts.title }}</template>
						</MkInput>
						<MkTextarea v-model="announcement.text">
							<template #label>{{ i18n.ts.text }}</template>
						</MkTextarea>
						<MkInput v-model="announcement.imageUrl">
							<template #label>{{ i18n.ts.imageUrl }}</template>
						</MkInput>
						<MkSwitch
							v-model="announcement.showPopup"
							class="_formBlock"
							>{{ i18n.ts.showPopup }}</MkSwitch
						>
						<MkSwitch
							v-if="announcement.showPopup"
							v-model="announcement.isGoodNews"
							class="_formBlock"
							>{{ i18n.ts.showWithSparkles }}</MkSwitch
						>
						<p v-if="announcement.reads">
							{{
								i18n.t("nUsersRead", { n: announcement.reads })
							}}
						</p>
						<div class="buttons">
							<MkButton
								class="button"
								inline
								primary
								@click="save(announcement)"
								><i
									class="ph-floppy-disk-back ph-bold ph-lg"
								></i>
								{{ i18n.ts.save }}</MkButton
							>
							<MkButton
								class="button"
								inline
								@click="remove(announcement)"
								><i class="ph-trash ph-bold ph-lg"></i>
								{{ i18n.ts.remove }}</MkButton
							>
						</div>
					</div>
				</section>
			</div>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import {} from "vue";
import MkButton from "@/components/MkButton.vue";
import MkInput from "@/components/form/input.vue";
import MkSwitch from "@/components/form/switch.vue";
import MkTextarea from "@/components/form/textarea.vue";
import * as os from "@/os";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";

let announcements: any[] = $ref([]);

os.api("admin/announcements/list").then((announcementResponse) => {
	announcements = announcementResponse;
});

function add() {
	announcements.unshift({
		id: null,
		title: "",
		text: "",
		imageUrl: null,
		showPopup: false,
		isGoodNews: false,
	});
}

function remove(announcement) {
	os.confirm({
		type: "warning",
		text: i18n.t("removeAreYouSure", { x: announcement.title }),
	}).then(({ canceled }) => {
		if (canceled) return;
		announcements = announcements.filter((x) => x !== announcement);
		os.api("admin/announcements/delete", announcement);
	});
}

function save(announcement) {
	if (announcement.id == null) {
		os.api("admin/announcements/create", announcement)
			.then(() => {
				os.alert({
					type: "success",
					text: i18n.ts.saved,
				});
			})
			.catch((err) => {
				os.alert({
					type: "error",
					text: err,
				});
			});
	} else {
		os.api("admin/announcements/update", announcement)
			.then(() => {
				os.alert({
					type: "success",
					text: i18n.ts.saved,
				});
			})
			.catch((err) => {
				os.alert({
					type: "error",
					text: err,
				});
			});
	}
}

const headerActions = $computed(() => [
	{
		asFullButton: true,
		icon: "ph-plus ph-bold ph-lg",
		text: i18n.ts.add,
		handler: add,
	},
]);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.announcements,
	icon: "ph-megaphone-simple ph-bold ph-lg",
});
</script>

<style lang="scss" module>
.root {
	margin: var(--margin);
}
</style>
