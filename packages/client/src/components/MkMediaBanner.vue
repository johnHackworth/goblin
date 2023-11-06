<template>
	<div class="mk-media-banner" @click.stop>
		<div
			v-if="media.isSensitive && hide"
			class="sensitive"
			@click="hide = false"
		>
			<span class="icon"><i class="ph-warning ph-bold ph-lg"></i></span>
			<b>{{ i18n.ts.sensitive }}</b>
			<span>{{ i18n.ts.clickToShow }}</span>
		</div>
		<div
			v-else-if="
				media.type.startsWith('audio') && media.type !== 'audio/midi'
			"
			class="audio"
		>
			<VuePlyr
				:options="{
					controls: [
						'play-large',
						'play',
						'progress',
						'current-time',
						'mute',
						'volume',
						'download',
					],
					disableContextMenu: false,
				}"
			>
				<audio
					ref="audioEl"
					class="audio"
					:src="media.url"
					:title="media.name"
					controls
					preload="metadata"
					@volumechange="volumechange"
				/>
			</VuePlyr>
		</div>
		<a
			v-else
			class="download"
			:href="media.url"
			:title="media.name"
			:download="media.name"
		>
			<span class="icon"
				><i class="ph-download-simple ph-bold ph-lg"></i
			></span>
			<b>{{ media.name }}</b>
		</a>
	</div>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import VuePlyr from "vue-plyr";
import type * as misskey from "firefish-js";
import { ColdDeviceStorage } from "@/store";
import "vue-plyr/dist/vue-plyr.css";
import { i18n } from "@/i18n";

const props = withDefaults(
	defineProps<{
		media: misskey.entities.DriveFile;
	}>(),
	{},
);

const audioEl = $ref<HTMLAudioElement | null>();
let hide = $ref(true);

function volumechange() {
	if (audioEl) ColdDeviceStorage.set("mediaVolume", audioEl.volume);
}

onMounted(() => {
	if (audioEl) audioEl.volume = ColdDeviceStorage.get("mediaVolume");
});
</script>

<style lang="scss" scoped>
.mk-media-banner {
	width: 100%;
	border-radius: 4px;
	margin-top: 4px;
	overflow: hidden;
	--plyr-color-main: var(--accent);
	--plyr-audio-controls-background: var(--panelHighlight);
	--plyr-audio-controls-background-hover: var(--accentedBg);
	--plyr-audio-control-color: var(--navFg);

	> .download,
	> .sensitive {
		display: flex;
		align-items: center;
		font-size: 12px;
		padding: 8px 12px;
		white-space: nowrap;

		> * {
			display: block;
		}

		> b {
			overflow: hidden;
			text-overflow: ellipsis;
		}

		> *:not(:last-child) {
			margin-right: 0.2em;
		}

		> .icon {
			font-size: 1.6em;
		}
	}

	> .download {
		background: var(--noteAttachedFile);
	}

	> .sensitive {
		background: #111;
		color: #fff;
	}

	> .audio {
		.audio {
			display: block;
			width: 100%;
		}
	}
}
</style>
