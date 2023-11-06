<template>
	<transition name="slide-fade">
		<div v-if="show" class="_panel _shadow _acrylic" :class="$style.root">
			<div :class="$style.icon">
				<i class="ph-hand-heart ph-bold ph-5x" />
			</div>
			<div :class="$style.main">
				<div :class="$style.title">
					{{ i18n.ts._aboutFirefish.donateTitle }}
				</div>
				<div :class="$style.text">
					{{ i18n.ts._aboutFirefish.pleaseDonateToFirefish }}
					<p v-if="$instance.donationLink">
						{{
							i18n.t("_aboutFirefish.pleaseDonateToHost", {
								host: hostname,
							})
						}}
					</p>
				</div>
				<div class="_flexList" style="gap: 0.6rem">
					<MkButton
						primary
						@click="
							openExternal('https://opencollective.com/firefish')
						"
						>{{ i18n.ts._aboutFirefish.donate }}</MkButton
					>
					<MkButton
						v-if="$instance.donationLink"
						gradate
						@click="openExternal($instance.donationLink)"
						>{{
							i18n.t("_aboutFirefish.donateHost", {
								host: hostname,
							})
						}}</MkButton
					>
				</div>
				<div class="_flexList" style="margin-top: 0.6rem">
					<MkButton @click="close">{{
						i18n.ts.remindMeLater
					}}</MkButton>
					<MkButton @click="neverShow">{{
						i18n.ts.neverShow
					}}</MkButton>
				</div>
			</div>
			<button
				class="_button"
				:class="$style.close"
				:aria-label="i18n.t('close')"
				@click="close"
			>
				<i class="ph-x ph-bold ph-lg"></i>
			</button>
		</div>
	</transition>
</template>

<script lang="ts" setup>
import { nextTick, ref } from "vue";
import MkButton from "@/components/MkButton.vue";
import { host } from "@/config";
import { i18n } from "@/i18n";
import * as os from "@/os";
import { instance } from "@/instance";

const show = ref(false);

const emit = defineEmits<{
	(ev: "closed"): void;
}>();

const hostname = instance.name?.length < 38 ? instance.name : host;

const zIndex = os.claimZIndex("low");

function slideIn() {
	show.value = false;
	nextTick(() => {
		show.value = true;
	});
}

slideIn();

function close() {
	localStorage.setItem("latestDonationInfoShownAt", Date.now().toString());
	emit("closed");
	show.value = false;
}

function neverShow() {
	localStorage.setItem("neverShowDonationInfo", "true");
	close();
}

function openExternal(link) {
	window.open(link, "_blank");
}
</script>

<style lang="scss" scoped>
.slide-fade-enter-from {
	opacity: 0;
	transform: translateY(100%);
}

.slide-fade-enter-active {
	transition:
		opacity 0.5s,
		transform 0.5s ease-out;
}

.slide-fade-enter-to {
	opacity: 1;
	transform: translateY(0);
}

.slide-fade-leave-from {
	opacity: 1;
	transform: translateY(0);
}

.slide-fade-leave-active {
	transition:
		opacity 0.5s,
		transform 0.5s ease-out;
}

.slide-fade-leave-to {
	opacity: 0;
	transform: translateY(100%);
}
</style>

<style lang="scss" module>
.root {
	background-color: var(--windowHeader);
	position: fixed;
	z-index: v-bind(zIndex);
	bottom: var(--margin);
	left: 2%;
	bottom: 2%;
	margin: auto;
	box-sizing: border-box;
	width: calc(100% - (var(--margin) * 2));
	max-width: 500px;
	display: flex;
}

.icon {
	text-align: center;
	padding-top: 25px;
	width: 100px;
	color: var(--accent);
}

@media (max-width: 500px) {
	.icon {
		width: 80px;
	}
}

@media (max-width: 450px) {
	.icon {
		width: 70px;
	}
}

.main {
	padding: 25px 25px 25px 0;
	flex: 1;
}

.close {
	position: absolute;
	top: 8px;
	right: 8px;
	padding: 8px;
}

.title {
	font-weight: bold;
}
.text {
	margin: 0.7em 0 1em 0;
}
</style>
