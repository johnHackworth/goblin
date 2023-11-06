<template>
	<div class="_formRoot">
		<FormSection>
			<template #label>{{ i18n.ts.moveTo }}</template>
			<FormInfo warn class="_formBlock">{{
				i18n.ts.moveAccountDescription
			}}</FormInfo>
			<FormInput v-model="moveToAccount" class="_formBlock">
				<template #prefix
					><i class="ph-airplane-takeoff ph-bold ph-lg"></i
				></template>
				<template #label>{{ i18n.ts.moveToLabel }}</template>
			</FormInput>
			<FormButton primary danger @click="move(moveToAccount)">
				{{ i18n.ts.moveAccount }}
			</FormButton>
		</FormSection>

		<FormSection>
			<template #label>{{ i18n.ts.moveFrom }}</template>
			<FormInfo warn class="_formBlock">{{
				i18n.ts.moveFromDescription
			}}</FormInfo>
			<FormInput
				v-for="(_, i) in accountAlias"
				v-model="accountAlias[i]"
				class="_formBlock"
			>
				<template #prefix
					><i class="ph-airplane-landing ph-bold ph-lg"></i
				></template>
				<template #label>{{
					`#${i + 1} ${i18n.ts.moveFromLabel}`
				}}</template>
			</FormInput>
			<FormButton
				class="button"
				:disabled="accountAlias.length >= 10"
				inline
				style="margin-right: 8px"
				@click="add"
				><i class="ph-plus ph-bold ph-lg"></i>
				{{ i18n.ts.add }}</FormButton
			>
			<FormButton class="button" inline primary @click="save">
				<i class="ph-floppy-disk-back ph-bold ph-lg"></i>
				{{ i18n.ts.save }}
			</FormButton>
		</FormSection>
	</div>
</template>

<script lang="ts" setup>
import FormSection from "@/components/form/section.vue";
import FormInput from "@/components/form/input.vue";
import FormButton from "@/components/MkButton.vue";
import FormInfo from "@/components/MkInfo.vue";
import * as os from "@/os";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import { $i } from "@/account";
import { toString } from "firefish-js/built/acct";

let moveToAccount = $ref("");
let accountAlias = $ref([""]);

await init();

async function init() {
	if ($i?.alsoKnownAs && $i.alsoKnownAs.length > 0) {
		const aka = await os.api("users/show", { userIds: $i.alsoKnownAs });
		accountAlias =
			aka && aka.length > 0
				? aka.map((user) => `@${toString(user)}`)
				: [""];
	} else {
		accountAlias = [""];
	}
}

async function save(): Promise<void> {
	const i = await os.apiWithDialog("i/known-as", {
		alsoKnownAs: accountAlias.map((e) => e.trim()).filter((e) => e !== ""),
	});
	$i.alsoKnownAs = i.alsoKnownAs;
	await init();
}

function add(): void {
	accountAlias.push("");
}

async function move(account): Promise<void> {
	const confirm = await os.confirm({
		type: "warning",
		text: i18n.t("migrationConfirm", { account: account.toString() }),
	});
	if (confirm.canceled) return;
	os.apiWithDialog("i/move", {
		moveToAccount: account,
	});
}

definePageMetadata({
	title: i18n.ts.security,
	icon: "ph-lock ph-bold ph-lg",
});
</script>
