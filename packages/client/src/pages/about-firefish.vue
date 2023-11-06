<template>
	<MkStickyContainer>
		<template #header
			><MkPageHeader :actions="headerActions" :tabs="headerTabs"
		/></template>
		<div style="overflow: clip">
			<MkSpacer :content-max="600" :margin-min="20">
				<div class="_formRoot znqjceqz">
					<div id="debug"></div>
					<div
						ref="containerEl"
						v-panel
						class="_formBlock about"
						:class="{ playing: easterEggEngine != null }"
					>
						<img
							src="/client-assets/about-icon.png"
							alt=""
							class="icon"
							draggable="false"
							@load="iconLoaded"
							@click="gravity"
						/>
						<div class="misskey">Firefish</div>
						<div class="version">v{{ version }}</div>
						<span
							v-for="emoji in easterEggEmojis"
							:key="emoji.id"
							class="emoji"
							:data-physics-x="emoji.left"
							:data-physics-y="emoji.top"
							:class="{
								_physics_circle_: !emoji.emoji.startsWith(':'),
							}"
							><MkEmoji
								class="emoji"
								:emoji="emoji.emoji"
								:custom-emojis="$instance.emojis"
								:is-reaction="false"
								:normal="true"
								:no-style="true"
						/></span>
					</div>
					<div class="_formBlock" style="text-align: center">
						{{ i18n.ts._aboutFirefish.about }}<br /><a
							href="https://joinfirefish.org/"
							target="_blank"
							class="_link"
							>{{ i18n.ts.learnMore }}</a
						>
					</div>
					<div class="_formBlock" style="text-align: center">
						<MkButton primary rounded inline @click="iLoveMisskey"
							>I <Mfm text="$[jelly ❤]" /> #Firefish</MkButton
						>
					</div>
					<FormSection>
						<div class="_formLinks">
							<FormLink
								to="https://git.joinfirefish.org/firefish/firefish"
								external
							>
								<template #icon
									><i class="ph-code ph-bold ph-lg"></i
								></template>
								{{ i18n.ts._aboutFirefish.source }}
								<template #suffix>Codeberg</template>
							</FormLink>
							<FormLink
								to="https://opencollective.com/firefish"
								external
							>
								<template #icon
									><i class="ph-money ph-bold ph-lg"></i
								></template>
								{{ i18n.ts._aboutFirefish.donate }}
								<template #suffix>Donate</template>
							</FormLink>
							<FormLink
								to="https://hosted.weblate.org/engage/firefish/"
								external
							>
								<template #icon
									><i class="ph-translate ph-bold ph-lg"></i
								></template>
								{{ i18n.ts._aboutFirefish.translation }}
								<template #suffix>Translate</template>
							</FormLink>
						</div>
					</FormSection>
					<FormSection>
						<template #label>{{
							i18n.ts._aboutFirefish.contributors
						}}</template>
						<div class="_formLinks">
							<FormLink to="/@kainoa@firefish.social"
								><Mfm
									:text="'$[sparkle @kainoa@firefish.social] (Main developer)'"
							/></FormLink>
							<FormLink to="/@freeplay@firefish.social"
								><Mfm
									:text="'@freeplay@firefish.social (UI/UX)'"
							/></FormLink>
							<FormLink to="/@namekuji@firefish.social"
								><Mfm
									:text="'@namekuji@firefish.social (Backend)'"
							/></FormLink>
							<FormLink to="/@dev@post.naskya.net"
								><Mfm :text="'@dev@post.naskya.net (Backend)'"
							/></FormLink>
							<FormLink to="/@panos@firefish.social"
								><Mfm
									:text="'@panos@firefish.social (Project Coordinator)'"
							/></FormLink>
							<FormLink
								to="https://www.youtube.com/c/Henkiwashere"
								external
								>Henki (error images artist)</FormLink
							>
						</div>
						<template #caption
							><MkLink
								url="https://git.joinfirefish.org/firefish/firefish/activity"
								>{{
									i18n.ts._aboutFirefish.allContributors
								}}</MkLink
							></template
						>
					</FormSection>
					<FormSection>
						<template #label
							><Mfm
								:text="`$[x2 $[jelly ❤] ${i18n.ts._aboutFirefish.sponsors}]`"
							/>
						</template>
						<MkSparkle>
							<span
								v-for="sponsor in sponsors"
								:key="sponsor"
								style="
									margin-bottom: 0.5rem;
									margin-right: 0.5rem;
									font-size: 1.7rem;
								"
							>
								<Mfm :text="`${sponsor}`" />
							</span>
						</MkSparkle>
					</FormSection>
					<FormSection>
						<template #label
							><Mfm text="$[jelly ❤]" />
							{{ i18n.ts._aboutFirefish.patrons }}</template
						>
						<p>
							{{ i18n.ts._aboutFirefish.patronsList }}
						</p>
						<MkSparkle>
							<span
								v-for="patron in patrons"
								:key="patron"
								style="
									margin-bottom: 0.5rem;
									margin-right: 0.5rem;
								"
							>
								<Mfm :text="`${patron}`" />
							</span>
						</MkSparkle>
						<p>{{ i18n.ts._aboutFirefish.morePatrons }}</p>
					</FormSection>
				</div>
			</MkSpacer>
		</div>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { nextTick, onBeforeUnmount } from "vue";
import { version } from "@/config";
import FormLink from "@/components/form/link.vue";
import FormSection from "@/components/form/section.vue";
import MkButton from "@/components/MkButton.vue";
import MkLink from "@/components/MkLink.vue";
import MkSparkle from "@/components/MkSparkle.vue";
import { physics } from "@/scripts/physics";
import { i18n } from "@/i18n";
import { defaultStore } from "@/store";
import * as os from "@/os";
import { definePageMetadata } from "@/scripts/page-metadata";

let patrons = [];
let sponsors = [];
const patronsResp = await os.api("patrons", { forceUpdate: true });
patrons = patronsResp.patrons;
sponsors = patronsResp.sponsors;

patrons = patrons.filter((patron) => !sponsors.includes(patron));

let easterEggReady = false;
let easterEggEmojis = $ref([]);
let easterEggEngine = $ref(null);
const containerEl = $ref<HTMLElement>();

function iconLoaded() {
	const emojis = defaultStore.state.reactions;
	const containerWidth = containerEl?.offsetWidth;
	for (let i = 0; i < 32; i++) {
		easterEggEmojis.push({
			id: i.toString(),
			top: -(128 + Math.random() * 256),
			left: Math.random() * containerWidth,
			emoji: emojis[Math.floor(Math.random() * emojis.length)],
		});
	}

	nextTick(() => {
		easterEggReady = true;
	});
}

function gravity() {
	if (!easterEggReady) return;
	easterEggReady = false;
	easterEggEngine = physics(containerEl);
}

function iLoveMisskey() {
	os.post({
		initialText: "I $[jelly ❤] #Firefish",
		instant: true,
	});
}

onBeforeUnmount(() => {
	if (easterEggEngine) {
		easterEggEngine.stop();
	}
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.aboutFirefish,
	icon: null,
});
</script>

<style lang="scss" scoped>
.znqjceqz {
	> .about {
		position: relative;
		text-align: center;
		padding: 16px;
		border-radius: var(--radius);

		&.playing {
			&,
			* {
				user-select: none;
			}

			* {
				will-change: transform;
			}

			> .emoji {
				visibility: visible;
			}
		}

		> .icon {
			display: block;
			width: 100px;
			margin: 0 auto;
			border-radius: 3px;
		}

		> .misskey {
			margin: 0.75em auto 0 auto;
			width: max-content;
		}

		> .version {
			margin: 0 auto;
			width: max-content;
			opacity: 0.5;
		}

		> .emoji {
			position: absolute;
			top: 0;
			left: 0;
			visibility: hidden;

			> .emoji {
				pointer-events: none;
				font-size: 24px;
				width: 24px;
			}
		}
	}
}
</style>
