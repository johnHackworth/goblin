<template>
	<MkStickyContainer>
		<template #header
			><MkPageHeader
				v-model:tab="tab"
				:actions="headerActions"
				:tabs="headerTabs"
				:display-back-button="true"
		/></template>
		<MkSpacer :content-max="1200">
			<swiper
				:round-lengths="true"
				:touch-angle="25"
				:threshold="10"
				:centeredSlides="true"
				:modules="[Virtual]"
				:space-between="20"
				:virtual="true"
				:allow-touch-move="
					defaultStore.state.swipeOnMobile &&
					(deviceKind !== 'desktop' ||
						defaultStore.state.swipeOnDesktop)
				"
				@swiper="setSwiperRef"
				@slide-change="onSlideChange"
			>
				<swiper-slide>
					<MkFolder class="_gap">
						<template #header
							><i class="ph-clock ph-bold ph-lg"></i>
							{{ i18n.ts.recentPosts }}</template
						>
						<MkPagination
							v-slot="{ items }"
							:pagination="recentPostsPagination"
							:disable-auto-load="true"
						>
							<div class="vfpdbgtk">
								<MkGalleryPostPreview
									v-for="post in items"
									:key="post.id"
									:post="post"
									class="post"
								/>
							</div>
						</MkPagination>
					</MkFolder>
					<MkFolder class="_gap">
						<template #header
							><i class="ph-fire-simple ph-bold ph-lg"></i>
							{{ i18n.ts.popularPosts }}</template
						>
						<MkPagination
							v-slot="{ items }"
							:pagination="popularPostsPagination"
							:disable-auto-load="true"
						>
							<div class="vfpdbgtk">
								<MkGalleryPostPreview
									v-for="post in items"
									:key="post.id"
									:post="post"
									class="post"
								/>
							</div>
						</MkPagination>
					</MkFolder>
				</swiper-slide>
				<swiper-slide>
					<MkPagination
						v-slot="{ items }"
						:pagination="likedPostsPagination"
					>
						<div class="vfpdbgtk">
							<MkGalleryPostPreview
								v-for="like in items"
								:key="like.id"
								:post="like.post"
								class="post"
							/>
						</div>
					</MkPagination>
				</swiper-slide>
				<swiper-slide>
					<MkA to="/gallery/new" class="_link" style="margin: 16px"
						><i class="ph-plus ph-bold ph-lg"></i>
						{{ i18n.ts.postToGallery }}</MkA
					>
					<MkPagination
						v-slot="{ items }"
						:pagination="myPostsPagination"
					>
						<div class="vfpdbgtk">
							<MkGalleryPostPreview
								v-for="mypost in items"
								:key="mypost.id"
								:post="mypost"
								class="post"
							/>
						</div>
					</MkPagination>
				</swiper-slide>
			</swiper>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, defineComponent, watch, onMounted } from "vue";
import { Virtual } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/vue";
import MkFolder from "@/components/MkFolder.vue";
import MkPagination from "@/components/MkPagination.vue";
import MkGalleryPostPreview from "@/components/MkGalleryPostPreview.vue";
import { definePageMetadata } from "@/scripts/page-metadata";
import { deviceKind } from "@/scripts/device-kind";
import { i18n } from "@/i18n";
import { useRouter } from "@/router";
import { defaultStore } from "@/store";
import "swiper/scss";
import "swiper/scss/virtual";

const router = useRouter();

const props = defineProps<{
	tag?: string;
}>();

const tabs = ["explore", "liked", "my"];
let tab = $ref(tabs[0]);
watch($$(tab), () => syncSlide(tabs.indexOf(tab)));

let tagsRef = $ref();

const recentPostsPagination = {
	endpoint: "gallery/posts" as const,
	limit: 6,
};
const popularPostsPagination = {
	endpoint: "gallery/featured" as const,
	limit: 5,
};
const myPostsPagination = {
	endpoint: "i/gallery/posts" as const,
	limit: 5,
};
const likedPostsPagination = {
	endpoint: "i/gallery/likes" as const,
	limit: 5,
};

watch(
	() => props.tag,
	() => {
		if (tagsRef) tagsRef.tags.toggleContent(props.tag == null);
	},
);

const headerActions = $computed(() => [
	{
		icon: "ph-plus ph-bold ph-lg",
		text: i18n.ts.create,
		handler: () => {
			router.push("/gallery/new");
		},
	},
]);

const headerTabs = $computed(() => [
	{
		key: "explore",
		title: i18n.ts.gallery,
		icon: "ph-image-square ph-bold ph-lg",
	},
	{
		key: "liked",
		title: i18n.ts._gallery.liked,
		icon: "ph-heart ph-bold ph-lg",
	},
	{
		key: "my",
		title: i18n.ts._gallery.my,
		icon: "ph-crown-simple ph-bold ph-lg",
	},
]);

definePageMetadata({
	title: i18n.ts.gallery,
	icon: "ph-image-square ph-bold ph-lg",
});

let swiperRef = null;

function setSwiperRef(swiper) {
	swiperRef = swiper;
	syncSlide(tabs.indexOf(tab));
}

function onSlideChange() {
	tab = tabs[swiperRef.activeIndex];
}

function syncSlide(index) {
	swiperRef.slideTo(index);
}

onMounted(() => {
	syncSlide(tabs.indexOf(swiperRef.activeIndex));
});
</script>

<style lang="scss" scoped>
.vfpdbgtk {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	grid-gap: 12px;
	margin: 0 var(--margin);

	> .post {
	}
}
</style>
