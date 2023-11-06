<template>
	<div class="hoawjimk files">
		<XBanner
			v-for="media in mediaList.filter((media) => !previewable(media))"
			:key="media.id"
			:media="media"
		/>
		<div
			v-if="previewableCount > 0"
			class="grid-container"
			:data-count="previewableCount < 5 ? previewableCount : null"
			:class="{ dmWidth: inDm }"
		>
			<div ref="gallery" @click.stop>
				<XMedia
					v-for="media in mediaList.filter((media) =>
						previewable(media),
					)"
					:key="media.id"
					:class="{ image: media.type.startsWith('image') }"
					:data-id="media.id"
					:media="media"
					:raw="raw"
				/>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import * as misskey from "firefish-js";
import PhotoSwipeLightbox from "photoswipe/lightbox";
import PhotoSwipe from "photoswipe";
import "photoswipe/style.css";
import XBanner from "@/components/MkMediaBanner.vue";
import XMedia from "@/components/MkMedia.vue";
import * as os from "@/os";
import { FILE_TYPE_BROWSERSAFE } from "@/const";
import { defaultStore } from "@/store";

const props = defineProps<{
	mediaList: misskey.entities.DriveFile[];
	raw?: boolean;
	inDm?: boolean;
}>();

const gallery = ref(null);
const pswpZIndex = os.claimZIndex("middle");

onMounted(() => {
	const lightbox = new PhotoSwipeLightbox({
		dataSource: props.mediaList
			.filter((media) => {
				if (media.type === "image/svg+xml") return true; // svgのwebpublicはpngなのでtrue
				return (
					media.type.startsWith("image") &&
					FILE_TYPE_BROWSERSAFE.includes(media.type)
				);
			})
			.map((media) => {
				const item = {
					src: media.url,
					w: media.properties.width,
					h: media.properties.height,
					alt: media.comment,
				};
				if (
					media.properties.orientation != null &&
					media.properties.orientation >= 5
				) {
					[item.w, item.h] = [item.h, item.w];
				}
				return item;
			}),
		gallery: gallery.value,
		children: ".image",
		thumbSelector: ".image",
		loop: false,
		padding:
			window.innerWidth > 500
				? {
						top: 32,
						bottom: 32,
						left: 32,
						right: 32,
				  }
				: {
						top: 0,
						bottom: 0,
						left: 0,
						right: 0,
				  },
		imageClickAction: "close",
		tapAction: "toggle-controls",
		preloadFirstSlide: false,
		pswpModule: PhotoSwipe,
	});

	lightbox.on("itemData", (ev) => {
		const { itemData } = ev;

		// element is children
		const { element } = itemData;

		const id = element.dataset.id;
		const file = props.mediaList.find((media) => media.id === id);

		itemData.src = file.url;
		itemData.w = Number(file.properties.width);
		itemData.h = Number(file.properties.height);
		if (
			file.properties.orientation != null &&
			file.properties.orientation >= 5
		) {
			[itemData.w, itemData.h] = [itemData.h, itemData.w];
		}
		itemData.msrc = file.thumbnailUrl;
		itemData.alt = file.comment;
		itemData.thumbCropped = true;
	});

	lightbox.on("uiRegister", () => {
		lightbox.pswp.ui.registerElement({
			name: "altText",
			className: "pwsp__alt-text-container",
			appendTo: "wrapper",
			onInit: (el, pwsp) => {
				let textBox = document.createElement("p");
				textBox.className = "pwsp__alt-text";
				el.appendChild(textBox);

				let preventProp = function (ev: Event): void {
					ev.stopPropagation();
				};

				// Allow scrolling/text selection
				el.onwheel = preventProp;
				el.onclick = preventProp;
				el.onpointerdown = preventProp;
				el.onpointercancel = preventProp;
				el.onpointermove = preventProp;

				pwsp.on("change", () => {
					textBox.textContent = pwsp.currSlide.data.alt?.trim();
				});
			},
		});
	});

	lightbox.on("afterInit", () => {
		history.pushState(null, "", location.href);
		addEventListener("popstate", close);
		// This is a workaround. Not sure why, but when clicking to open, it doesn't move focus to the photoswipe. Preventing using esc to close. However when using keyboard to open it already focuses the lightbox fine.
		lightbox.pswp.element.focus();
	});
	lightbox.on("close", () => {
		removeEventListener("popstate", close);
		history.back();
	});

	lightbox.init();

	function close() {
		removeEventListener("popstate", close);
		history.forward();
		lightbox.pswp.close();
	}
});

const previewable = (file: misskey.entities.DriveFile): boolean => {
	if (file.type === "image/svg+xml") return true; // svgのwebpublic/thumbnailはpngなのでtrue
	// FILE_TYPE_BROWSERSAFEに適合しないものはブラウザで表示するのに不適切
	return (
		(file.type.startsWith("video") || file.type.startsWith("image")) &&
		FILE_TYPE_BROWSERSAFE.includes(file.type)
	);
};
const previewableCount = props.mediaList.filter((media) =>
	previewable(media),
).length;
</script>

<style lang="scss" scoped>
.hoawjimk {
	> .dmWidth {
		min-width: 20rem;
		max-width: 40rem;
	}

	> .grid-container {
		position: relative;
		width: 100%;
		margin-top: 4px;
		border-radius: var(--radius);
		overflow: hidden;
		pointer-events: none;

		&[data-count] {
			padding-top: 56.25%; // 16:9;
			> div {
				position: absolute;
				inset: 0;
			}
		}

		&[data-count="1"] > div {
			grid-template-rows: 1fr;
		}

		&[data-count="2"] > div {
			grid-template-columns: 1fr 1fr;
			grid-template-rows: 1fr;
		}

		&[data-count="3"] > div {
			grid-template-columns: 1fr 0.5fr;
			grid-template-rows: 1fr 1fr;

			> *:nth-child(1) {
				grid-row: 1 / 3;
			}

			> *:nth-child(3) {
				grid-column: 2 / 3;
				grid-row: 2 / 3;
			}
		}

		&[data-count="4"] > div {
			grid-template-columns: 1fr 1fr;
			grid-template-rows: 1fr 1fr;
		}

		&:not([data-count]) > div > div {
			max-height: 300px;
		}

		> div {
			display: grid;
			grid-gap: 8px;

			> div,
			> button {
				overflow: hidden;
				border-radius: 6px;
				pointer-events: all;
				min-height: 50px;
			}

			> :nth-child(1) {
				grid-column: 1 / 2;
				grid-row: 1 / 2;
			}

			> :nth-child(2) {
				grid-column: 2 / 3;
				grid-row: 1 / 2;
			}

			> :nth-child(3) {
				grid-column: 1 / 2;
				grid-row: 2 / 3;
			}

			> :nth-child(4) {
				grid-column: 2 / 3;
				grid-row: 2 / 3;
			}
		}
	}
}
</style>

<style lang="scss">
.pswp {
	// なぜか機能しない
	//z-index: v-bind(pswpZIndex);
	z-index: 2000000;
}
.pwsp__alt-text-container {
	display: flex;
	flex-direction: row;
	align-items: center;

	position: absolute;
	bottom: 30px;
	left: 50%;
	transform: translateX(-50%);

	width: 75%;
}

.pwsp__alt-text {
	color: white;
	margin: 0 auto;
	text-align: center;
	padding: 10px;
	background: rgba(0, 0, 0, 0.5);
	border-radius: 5px;

	max-height: 10vh;
	overflow-x: clip;
	overflow-y: auto;
	overscroll-behavior: contain;
}

.pwsp__alt-text:empty {
	display: none;
}
</style>
