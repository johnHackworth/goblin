<template>
	<div class="media" v-size="{ max: [350] }">
		<button v-if="hide" class="hidden" @click="hide = false">
			<ImgWithBlurhash
				:hash="media.blurhash"
				:title="media.comment"
				:alt="media.comment"
			/>
			<div class="text">
				<div class="wrapper">
					<b style="display: block"
						><i class="ph-warning ph-bold ph-lg"></i>
						{{ i18n.ts.sensitive }}</b
					>
					<span style="display: block">{{
						i18n.ts.clickToShow
					}}</span>
				</div>
			</div>
		</button>
		<template v-else>
			<a v-if="media.type.startsWith('image')" :href="media.url">
				<ImgWithBlurhash
					:hash="media.blurhash"
					:src="url"
					:alt="media.comment"
					:type="media.type"
					:cover="false"
				/>
				<div v-if="media.type === 'image/gif'" class="gif">GIF</div>
			</a>
			<VuePlyr
				v-if="media.type.startsWith('video')"
				ref="plyr"
				:options="{
					controls: [
						'play-large',
						'play',
						'progress',
						'current-time',
						'mute',
						'volume',
						'pip',
						'download',
						'fullscreen',
					],
					disableContextMenu: false,
				}"
			>
				<video
					:poster="media.thumbnailUrl"
					:aria-label="media.comment"
					preload="none"
					controls
					@contextmenu.stop
				>
					<source :src="media.url" :type="mediaType" />
				</video>
			</VuePlyr>
		</template>
		<div class="buttons">
			<button
				v-if="media.comment"
				v-tooltip.noLabel="
					`${i18n.ts.alt}: ${
						media.comment.length > 200
							? media.comment.trim().slice(0, 200) + '...'
							: media.comment.trim()
					}`
				"
				:aria-label="i18n.ts.alt"
				class="_button"
				@click.stop="captionPopup"
			>
				<i class="ph-subtitles ph-bold ph-lg"></i>
			</button>
			<button
				v-if="!hide"
				v-tooltip="i18n.ts.hide"
				class="_button"
				@click.stop="hide = true"
			>
				<i class="ph-eye-slash ph-bold ph-lg"></i>
			</button>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { watch, ref, computed } from "vue";
import VuePlyr from "vue-plyr";
import "vue-plyr/dist/vue-plyr.css";
import type * as misskey from "firefish-js";
import { getStaticImageUrl } from "@/scripts/get-static-image-url";
import ImgWithBlurhash from "@/components/MkImgWithBlurhash.vue";
import { defaultStore } from "@/store";
import { i18n } from "@/i18n";
import * as os from "@/os";

const props = defineProps<{
	media: misskey.entities.DriveFile;
	raw?: boolean;
}>();

let hide = $ref(true);

const plyr = ref();

const url =
	props.raw || defaultStore.state.loadRawImages
		? props.media.url
		: defaultStore.state.disableShowingAnimatedImages &&
		  props.media.type.startsWith("image")
		? getStaticImageUrl(props.media.thumbnailUrl)
		: props.media.thumbnailUrl;

const mediaType = computed(() => {
	return props.media.type === "video/quicktime"
		? "video/mp4"
		: props.media.type;
});

function captionPopup() {
	os.alert({
		type: "info",
		text: props.media.comment,
	});
}

// Plugin:register_note_view_interruptor を使って書き換えられる可能性があるためwatchする
watch(
	() => props.media,
	() => {
		hide =
			defaultStore.state.nsfw === "force"
				? true
				: props.media.isSensitive &&
				  defaultStore.state.nsfw !== "ignore";
	},
	{
		deep: true,
		immediate: true,
	},
);
</script>

<style lang="scss" scoped>
.hidden {
	all: unset;
	position: relative;
	width: 100%;
	height: 100%;

	> .text {
		position: relative;
		width: 100%;
		height: 100%;
		z-index: 1;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 30px;
		box-sizing: border-box;
		background: rgba(0, 0, 0, 0.5);

		> .wrapper {
			display: table-cell;
			text-align: center;
			font-size: 0.8em;
			color: #fff;
		}
	}

	&:focus-visible {
		border: 2px solid var(--accent);
	}
}

.media {
	position: relative;
	background: var(--bg);

	--plyr-color-main: var(--accent);

	> .buttons {
		display: flex;
		gap: 4px;
		position: absolute;
		border-radius: 6px;
		overflow: hidden;
		top: 12px;
		right: 12px;
		> * {
			background-color: var(--accentedBg);
			-webkit-backdrop-filter: var(--blur, blur(15px));
			backdrop-filter: var(--blur, blur(15px));
			color: var(--accent);
			font-size: 0.8em;
			padding: 6px 8px;
			text-align: center;
		}
	}

	> a {
		display: block;
		cursor: zoom-in;
		overflow: hidden;
		width: 100%;
		height: 100%;
		background-position: center;
		background-size: contain;
		background-repeat: no-repeat;
		box-sizing: border-box;
		&:focus-visible {
			border: 2px solid var(--accent);
		}

		> .gif {
			background-color: var(--fg);
			border-radius: 6px;
			color: var(--accentLighten);
			display: inline-block;
			font-size: 14px;
			font-weight: bold;
			left: 12px;
			opacity: 0.5;
			padding: 0 6px;
			text-align: center;
			top: 12px;
			pointer-events: none;
		}
	}
	:deep(.plyr__controls) {
		contain: strict;
		height: 24px;
		box-sizing: content-box;
	}
	:deep(.plyr__volume) {
		display: flex;
		min-width: max-content;
		width: 110px;
		transition: width 0.2s cubic-bezier(0, 0, 0, 1);
		[data-plyr="volume"] {
			width: 0;
			flex-grow: 1;
			transition:
				margin 0.3s,
				opacity 0.2s 0.2s;
		}
		&:not(:hover):not(:focus-within) {
			width: 0px;
			transition: width 0.2s;
			[data-plyr="volume"] {
				margin-inline: 0px;
				opacity: 0;
				transition:
					margin 0.3s,
					opacity 0.1s;
			}
		}
	}
	&.max-width_350px {
		:deep(.plyr:not(:fullscreen)) {
			min-width: unset !important;
			.plyr__control--overlaid,
			.plyr__progress__container,
			.plyr__volume,
			[data-plyr="download"] {
				display: none;
			}
		}
		:deep(.plyr__time) {
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}
}
</style>
