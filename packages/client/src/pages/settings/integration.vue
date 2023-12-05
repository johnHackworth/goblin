<template>
	<div class="integrations _formRoot clear clearBackground">
		<div class="title">Connected Apps</div>

		<FormSection>
	    <template #label>
	    	<i class="ph-tumblr-logo ph-bold ph-lg"></i>
	    	Tumblr
	    </template>
	    <p v-if="integrations.tumblr" class="integration">
	      {{ i18n.ts.connectedTo }}:
	      <a
	        :href="`https://tumblr.com/users/${integrations.tumblr.name}`"
	        rel="nofollow noopener"
	        target="_blank">
	      	@{{ integrations.tumblr.name }}
	      </a>
	      <p class="connectedBlogs">
	      	Default blog to post to:
	      	<select
	      		class="blogSelector"
	      		v-model="defaultTumblrBlog"
	      		@change='changeDefaultTumblrBlog'
	      	>
	      		<option
	      			v-for="name in integrations.tumblr.blogs"
	      			:value="name"
	      			>
	      			{{name}}
	      		</option>
	      	</select>
	      </p>
	    </p>
	    <MkButton
	      v-if="integrations.tumblr"
	      danger
	      @click="disconnectTumblr"
	      >{{ i18n.ts.disconnectService }}</MkButton
	    >
	    <MkButton v-else primary @click="connectTumblr">{{
	      i18n.ts.connectService
	    }}</MkButton>
	  </FormSection>
	 </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue";
import { apiUrl } from "@/config";
import FormSection from "@/components/form/section.vue";
import MkButton from "@/components/MkButton.vue";
import { $i } from "@/account";
import { instance } from "@/instance";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import * as os from "@/os";

const twitterForm = ref<Window | null>(null);
const discordForm = ref<Window | null>(null);
const githubForm = ref<Window | null>(null);

const integrations = computed(() => $i!.integrations);

const getDefaultTumblrBlog = () => {
	const stored = localStorage.getItem("defaultTumblrBlog");
	const integration = $i!.integrations.tumblr? $i!.integrations.tumblr.primary : null;
	return stored && stored !== ''? stored : integration;
}

let defaultTumblrBlog = ref(getDefaultTumblrBlog());

function openWindow(service: string, type: string) {
	return window.open(
		`${apiUrl}/${type}/${service}`,
		`${service}_${type}_window`,
		"height=570, width=520",
	);
}

function connectTwitter() {
	twitterForm.value = openWindow("twitter", "connect");
}

function disconnectTwitter() {
	openWindow("twitter", "disconnect");
}

function connectDiscord() {
	discordForm.value = openWindow("discord", "connect");
}

function connectTumblr() {
	discordForm.value = openWindow("tumblr", "connect");
}


function disconnectDiscord() {
	openWindow("discord", "disconnect");
}


function disconnectTumblr() {
	openWindow("tumblr", "disconnect");
}


function connectGithub() {
	githubForm.value = openWindow("github", "connect");
}

function disconnectGithub() {
	openWindow("github", "disconnect");
}

onMounted(() => {
	document.cookie =
		`igi=${$i!.token}; path=/;` +
		" max-age=31536000;" +
		(document.location.protocol.startsWith("https") ? " secure" : "");

	watch(integrations, () => {
		if (integrations.value.twitter) {
			if (twitterForm.value) twitterForm.value.close();
		}
		if (integrations.value.discord) {
			if (discordForm.value) discordForm.value.close();
		}
		if (integrations.value.github) {
			if (githubForm.value) githubForm.value.close();
		}
	});
});

const changeDefaultTumblrBlog = async ( ev ) => {
	localStorage.setItem("defaultTumblrBlog", ev.target.value);
	defaultTumblrBlog = ev.target.value;
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.integration,
	icon: "ph-share-network ph-bold ph-lg",
});
</script>

<style lang="scss" scoped>
.integrations {
	color: #FFF;
}

.integration {
	color: #FFF;
}

.title {
	font-size: 1.5em;
	color: #FFF;
}
</style>
