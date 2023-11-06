<template>
	<MkStickyContainer>
		<template #header
			><MkPageHeader
				:actions="headerActions"
				:tabs="headerTabs"
				:display-back-button="true"
		/></template>
		<MkSpacer :content-max="800">
			<transition
				:name="$store.state.animation ? 'fade' : ''"
				mode="out-in"
			>
				<div
					v-if="page"
					:key="page.id"
					v-size="{ max: [450] }"
					class="xcukqgmh"
				>
					<div class="footer">
						<div>
							<i class="ph-alarm ph-bold" />
							{{ i18n.ts.createdAt }}:
							<MkTime :time="page.createdAt" mode="detail" />
						</div>
						<div v-if="page.createdAt != page.updatedAt">
							<i class="ph-alarm ph-bold"></i>
							{{ i18n.ts.updatedAt }}:
							<MkTime :time="page.updatedAt" mode="detail" />
						</div>
					</div>
					<div class="_block main">
						<div class="banner">
							<div class="banner-image">
								<div class="header">
									<h1>{{ page.title }}</h1>
								</div>
								<div class="menu-actions">
									<button
										v-tooltip="i18n.ts.copyUrl"
										@click="copyUrl"
										class="menu _button"
									>
										<i
											class="ph-link-simple ph-bold ph-lg"
										/>
									</button>
									<MkA
										v-tooltip="i18n.ts._pages.viewSource"
										:to="`/@${username}/pages/${pageName}/view-source`"
										class="menu _button"
										style="transform: translateY(2px)"
										><i class="ph-code ph-bold ph-lg"
									/></MkA>
									<template
										v-if="$i && $i.id === page.userId"
									>
										<MkA
											v-tooltip="i18n.ts._pages.editPage"
											class="menu _button"
											:to="`/pages/edit/${page.id}`"
											style="transform: translateY(2px)"
											><i class="ph-pencil ph-bold ph-lg"
										/></MkA>
										<button
											v-if="$i.pinnedPageId === page.id"
											v-tooltip="i18n.ts.unpin"
											class="menu _button"
											@click="pin(false)"
										>
											<i
												class="ph-push-pin-slash ph-bold ph-lg"
											/>
										</button>
										<button
											v-else
											v-tooltip="i18n.ts.pin"
											class="menu _button"
											@click="pin(true)"
										>
											<i
												class="ph-push-pin ph-bold ph-lg"
											/>
										</button>
									</template>
								</div>
							</div>
						</div>
						<div class="content">
							<XPage :page="page" />
						</div>
						<div class="actions">
							<div class="like">
								<MkButton
									v-if="page.isLiked"
									v-tooltip="i18n.ts._pages.unlike"
									class="button"
									primary
									@click="unlike()"
									><i class="ph-heart ph-fill ph-lg"></i
									><span
										v-if="page.likedCount > 0"
										class="count"
										>{{ page.likedCount }}</span
									></MkButton
								>
								<MkButton
									v-else
									v-tooltip="i18n.ts._pages.like"
									class="button"
									@click="like()"
									><i class="ph-heart ph-bold"></i
									><span
										v-if="page.likedCount > 0"
										class="count"
										>{{ page.likedCount }}</span
									></MkButton
								>
							</div>
							<div class="other">
								<button
									v-tooltip="i18n.ts.shareWithNote"
									v-click-anime
									class="_button"
									@click="shareWithNote"
								>
									<i
										class="ph-repeat ph-bold ph-lg ph-fw ph-lg"
									></i>
								</button>
								<button
									v-if="shareAvailable()"
									v-tooltip="i18n.ts.share"
									v-click-anime
									class="_button"
									@click="share"
								>
									<i
										class="ph-share-network ph-bold ph-lg ph-fw ph-lg"
									></i>
								</button>
							</div>
							<div class="user">
								<MkAvatar :user="page.user" class="avatar" />
								<div class="name">
									<MkUserName
										:user="page.user"
										style="display: block"
									/>
									<MkAcct :user="page.user" />
								</div>
								<MkFollowButton
									v-if="!$i || $i.id != page.user.id"
									:user="page.user"
									:inline="true"
									:transparent="false"
									:full="true"
									class="koudoku"
								/>
							</div>
						</div>
						<!-- <div class="links">
						<MkA :to="`/@${username}/pages/${pageName}/view-source`" class="link">{{ i18n.ts._pages.viewSource }}</MkA>
						<template v-if="$i && $i.id === page.userId">
							<MkA :to="`/pages/edit/${page.id}`" class="link">{{ i18n.ts._pages.editThisPage }}</MkA>
							<button v-if="$i.pinnedPageId === page.id" class="link _textButton" @click="pin(false)">{{ i18n.ts.unpin }}</button>
							<button v-else class="link _textButton" @click="pin(true)">{{ i18n.ts.pin }}</button>
						</template>
					</div> -->
					</div>
					<MkAd :prefer="['inline', 'inline-big']" />
					<MkContainer
						:max-height="300"
						:foldable="true"
						:expanded="false"
						class="other"
					>
						<template #header
							><i class="ph-clock ph-bold ph-lg"></i>
							{{ i18n.ts.recentPosts }}</template
						>
						<MkPagination
							v-slot="{ items }"
							:pagination="otherPostsPagination"
						>
							<MkPagePreview
								v-for="page in items"
								:key="page.id"
								:page="page"
								class="_gap"
							/>
						</MkPagination>
					</MkContainer>
				</div>
				<MkError v-else-if="error" @retry="fetchPage()" />
				<MkLoading v-else />
			</transition>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch } from "vue";
import XPage from "@/components/page/page.vue";
import MkButton from "@/components/MkButton.vue";
import * as os from "@/os";
import { url } from "@/config";
import MkFollowButton from "@/components/MkFollowButton.vue";
import MkContainer from "@/components/MkContainer.vue";
import MkPagination from "@/components/MkPagination.vue";
import MkPagePreview from "@/components/MkPagePreview.vue";
import { i18n } from "@/i18n";
import copyToClipboard from "@/scripts/copy-to-clipboard";
import { definePageMetadata } from "@/scripts/page-metadata";
import { shareAvailable } from "@/scripts/share-available";

const props = defineProps<{
	pageName: string;
	username: string;
}>();

let page = $ref(null);
let bgImg = $ref(null);
let error = $ref(null);
const otherPostsPagination = {
	endpoint: "users/pages" as const,
	limit: 6,
	params: computed(() => ({
		userId: page.user.id,
	})),
};
const path = $computed(() => props.username + "/" + props.pageName);

function fetchPage() {
	page = null;
	os.api("pages/show", {
		name: props.pageName,
		username: props.username,
	})
		.then((_page) => {
			page = _page;
			bgImg = getBgImg();
		})
		.catch((err) => {
			error = err;
		});
}

function copyUrl() {
	copyToClipboard(window.location.href);
	os.success();
}

function getBgImg(): string {
	if (page.eyeCatchingImage != null) {
		return `url(${page.eyeCatchingImage.url})`;
	} else {
		return "linear-gradient(to bottom right, #31748f, #9ccfd8)";
	}
}

function share() {
	navigator.share({
		title: page.title ?? page.name,
		text: page.summary,
		url: `${url}/@${page.user.username}/pages/${page.name}`,
	});
}

function shareWithNote() {
	os.post({
		initialText: `${page.title || page.name} ${url}/@${
			page.user.username
		}/pages/${page.name}`,
	});
}

function like() {
	os.api("pages/like", {
		pageId: page.id,
	}).then(() => {
		page.isLiked = true;
		page.likedCount++;
	});
}

async function unlike() {
	os.api("pages/unlike", {
		pageId: page.id,
	}).then(() => {
		page.isLiked = false;
		page.likedCount--;
	});
}

function pin(pin) {
	os.apiWithDialog("i/update", {
		pinnedPageId: pin ? page.id : null,
	});
}

watch(() => path, fetchPage, { immediate: true });

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(
	computed(() =>
		page
			? {
					title: computed(() => page.title || page.name),
					avatar: page.user,
					path: `/@${page.user.username}/pages/${page.name}`,
					share: {
						title: page.title || page.name,
						text: page.summary,
					},
			  }
			: null,
	),
);
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.125s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.xcukqgmh {
	> .main {
		> * {
			margin: 1rem;
		}

		> .banner {
			margin: 0rem !important;

			> .banner-image {
				// TODO: 良い感じのアスペクト比で表示
				display: block;
				width: 100%;
				height: 150px;
				background-position: center;
				background-size: cover;
				background-image: v-bind("bgImg");

				> .header {
					padding: 16px;

					> h1 {
						margin: 0;
						color: white;
						text-shadow: 0 0 8px var(--shadow);
					}
				}

				> .menu-actions {
					-webkit-backdrop-filter: var(--blur, blur(8px));
					backdrop-filter: var(--blur, blur(8px));
					background: rgba(0, 0, 0, 0.2);
					padding: 8px;
					border-radius: 24px;
					width: fit-content;
					position: relative;
					top: -10px;
					left: 1rem;

					> .menu {
						vertical-align: bottom;
						height: 31px;
						width: 31px;
						color: #fff;
						text-shadow: 0 0 8px var(--shadow);
						font-size: 16px;
					}

					> .koudoku {
						margin-left: 4px;
						vertical-align: bottom;
					}
				}
			}
		}

		> .content {
			padding: 16px 0;
		}

		> .actions {
			display: flex;
			align-items: center;
			margin-top: 16px;
			padding: 16px 0;
			border-top: solid 0.5px var(--divider);

			> .like {
				> .button {
					--accent: #eb6f92;
					--X8: #eb6f92;
					--buttonBg: rgb(216 71 106 / 5%);
					--buttonHoverBg: rgb(216 71 106 / 10%);
					color: #eb6f92;

					::v-deep(.count) {
						margin-left: 0.5em;
					}
				}
			}

			> .other {
				> button {
					padding: 2px;
					margin: 0 8px;

					&:hover {
						color: var(--fgHighlighted);
					}
				}
			}

			> .user {
				margin-left: auto;
				display: flex;
				align-items: center;

				> .avatar {
					width: 40px;
					height: 40px;
				}

				> .name {
					margin: 0 0 0 12px;
					font-size: 90%;
				}

				> .koudoku {
					margin-left: auto;
					margin: 1rem;
				}
			}
		}

		> .links {
			margin-top: 16px;
			padding: 14px 0;
			border-top: solid 0.5px var(--divider);

			> .link {
				margin-right: 2em;
			}
		}
	}

	> .footer {
		margin: var(--margin) 0 var(--margin) 0;
		font-size: 85%;
		opacity: 0.75;
	}
}
</style>
