<template>
	<section class="_section">
		<div class="_title">
			{{ i18n.t("_auth.shareAccess", { name: app.name }) }}
		</div>
		<div class="_content">
			<h2>{{ app.name }}</h2>
			<p class="id">{{ app.id }}</p>
			<p class="description">{{ app.description }}</p>
		</div>
		<div class="_content">
			<h2>{{ i18n.ts._auth.permissionAsk }}</h2>
			<ul>
				<li v-for="p in app.permission" :key="p">
					{{ i18n.t(`_permissions.${p}`) }}
				</li>
			</ul>
		</div>
		<div class="_footer">
			<MkButton inline @click="cancel">{{ i18n.ts.cancel }}</MkButton>
			<MkButton inline primary @click="accept">{{
				i18n.ts.accept
			}}</MkButton>
		</div>
	</section>
</template>

<script lang="ts" setup>
import { defineComponent } from "vue";
import MkButton from "@/components/MkButton.vue";
import * as os from "@/os";
import { i18n } from "@/i18n";

const emit = defineEmits<{
	(ev: "denied"): void;
	(ev: "accepted"): void;
}>();

const props = defineProps<{
	session: {
		app: {
			name: string;
			id: string;
			description: string;
			permission: string[];
		};
		token: string;
	};
}>();

const app = props.session.app;

function cancel() {
	os.api("auth/deny", {
		token: props.session.token,
	}).then(() => {
		emit("denied");
	});
}

function accept() {
	os.api("auth/accept", {
		token: props.session.token,
	}).then(() => {
		emit("accepted");
	});
}
</script>
