<template>
	<MkStickyContainer>
		<template #header>
			<MkPageHeader
				v-model:tab="tab"
				:tabs="headerTabs"
			/>
		</template>
		
		<MkSpacer :content-max="700">
			<div v-if="tab === 'feeds'" class="rss-feeds">
				<MkInfo class="_gap">{{ i18n.ts.rssFeedInfo }}</MkInfo>

				<div class="add-feed-form">
					<FormInput
						v-model="newFeedUrl"
						type="url"
						:placeholder="i18n.ts.rssFeedUrlPlaceholder"
					>
						<template #prefix>
							<i class="ph-rss ph-bold ph-lg"></i>
						</template>
					</FormInput>
					<MkButton
						primary
						:disabled="!newFeedUrl"
						@click="addFeed"
					>{{ i18n.ts.add }}</MkButton>
				</div>

				<div v-if="feeds.length === 0" class="empty">
					<i class="ph-rss ph-bold ph-3x"></i>
					<p>{{ i18n.ts.rssNoFeeds }}</p>
				</div>
					<div v-else class="feeds-list">
					<div
						v-for="feed in feeds"
						:key="feed.id"
						class="feed-item"
					>
						<div class="feed-icon">
							<img
								:src="`/avatar/@${feed.botUser.username}`"
								:alt="feed.botUser.username"
								class="avatar-img"
							/>
						</div>
						<div class="feed-info">
							<div class="feed-title">
								<MkA :to="`/@${feed.botUser.username}`">{{ feed.title }}</MkA>
							</div>
							<div class="feed-url">
								<a :href="feed.url" target="_blank">{{ feed.url }}</a>
							</div>
							<div class="feed-meta">
								<span v-if="feed.lastFetchedAt">
									{{ i18n.ts.rssLastFetched }}: {{ feed.lastFetchedAt }}
								</span>
								<span v-if="!feed.isActive" class="feed-disabled">
									{{ i18n.ts.rssDisabled }}
								</span>
							</div>
						</div>
						<div class="feed-actions">
							<MkButton @click="unfollowFeed(feed.id)">
								{{ i18n.ts.unfollow }}
							</MkButton>
						</div>
					</div>
				</div>
			</div>
			
			<div v-else-if="tab === 'reader'" class="rss-reader">
				<div class="add-feed-form">
					<FormInput
						v-model="newFeedUrl"
						type="url"
						:placeholder="i18n.ts.rssFeedUrlPlaceholder"
					>
						<template #prefix>
							<i class="ph-rss ph-bold ph-lg"></i>
						</template>
					</FormInput>
					<MkButton
						primary
						:disabled="!newFeedUrl"
						@click="addFeed"
					>{{ i18n.ts.add }}</MkButton>
				</div>
				<XNotes :key="timelineKey" :pagination="pagination" />
			</div>
		</MkSpacer>
	</MkStickyContainer>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from "vue";
import MkButton from "@/components/MkButton.vue";
import FormInput from "@/components/form/input.vue";
import MkInfo from "@/components/MkInfo.vue";
import MkAvatar from "@/components/global/MkAvatar.vue";
import MkPageHeader from "@/components/global/MkPageHeader.vue";
import MkStickyContainer from "@/components/global/MkStickyContainer.vue";
import XNotes from "@/components/MkNotes.vue";
import { i18n } from "@/i18n";
import { definePageMetadata } from "@/scripts/page-metadata";
import * as os from "@/os";

interface RssFeed {
	id: string;
	url: string;
	title: string;
	description: string | null;
	siteUrl: string | null;
	botUser: any;
	isActive: boolean;
	lastFetchedAt: string | null;
	createdAt: string;
}

let tab = $ref("reader");
const newFeedUrl = ref("");
const feeds = ref<RssFeed[]>([]);

const pagination = {
	endpoint: "notes/rss-timeline" as const,
	limit: 20,
};

const timelineKey = ref(0);

const headerTabs = $computed(() => [
	{
		key: "reader",
		title: i18n.ts.rssReader,
		icon: "ph-rss ph-bold ph-lg",
	},
	{
		key: "feeds",
		title: i18n.ts.rssYourFeeds,
		icon: "ph-list-bullets ph-bold ph-lg",
	},
]);

async function loadFeeds() {
	feeds.value = await os.api("rss/list");
}

async function addFeed() {
	if (!newFeedUrl.value) return;

	let url = newFeedUrl.value.trim();

	// Add https:// by default if no protocol is specified
	if (!url.match(/^https?:\/\//)) {
		url = `https://${url}`;
	}

	// Transform Tumblr URLs from https://tumblr.com/username or https://www.tumblr.com/username
	const tumblrMatch = url.match(/^https?:\/\/(www\.)?tumblr\.com\/([a-zA-Z0-9_-]+)\/?$/);
	if (tumblrMatch) {
		url = `https://${tumblrMatch[2]}.tumblr.com`;
	}

	try {
		await os.api("rss/add", {
			url: url,
			autoFollow: true,
		});
		newFeedUrl.value = "";
		await loadFeeds();
		timelineKey.value++;
	} catch (err) {
		if (err.code === "rss-fetch-failed" || err.message?.includes("404")) {
			os.alert({
				type: "error",
				title: i18n.ts.error,
				text: i18n.ts.rssFeedNotFound || "We couldn't find any RSS feed in the URL you entered!",
			});
		} else {
			os.alert({
				type: "error",
				title: i18n.ts.error,
				text: err.message || i18n.ts.rssAddFailed,
			});
		}
	}
}

async function unfollowFeed(feedId: string) {
	try {
		await os.api("rss/unfollow", {
			feedId,
		});
		await loadFeeds();
	} catch (err) {
		os.alert({
			type: "error",
			title: i18n.ts.error,
			text: err.message || i18n.ts.rssUnfollowFailed,
		});
	}
}

onMounted(() => {
	loadFeeds();
});

definePageMetadata(computed(() => ({
	title: i18n.ts.rss,
	icon: "ph-rss ph-bold ph-lg",
})));
</script>

<style lang="scss" scoped>
.rss-feeds,
.rss-reader {
	padding: 16px;
}

.add-feed-form {
	display: flex;
	gap: 12px;
	align-items: center;
	margin-bottom: 16px;

	:deep(.form-input) {
		flex: 1;
	}
}

.feeds-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.feed-item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px;
	background: var(--panel);
	border-radius: 8px;
}

.feed-icon {
	flex-shrink: 0;
	width: 64px;
	height: 64px;
	
	.avatar-img {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		object-fit: cover;
	}
}

.feed-info {
	flex: 1;
	min-width: 0;
}

.feed-title {
	font-weight: bold;
	margin-bottom: 4px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.feed-url {
	font-size: 0.85em;
	color: var(--text);

	a {
		color: var(--link);
		text-decoration: none;

		&:hover {
			text-decoration: underline;
		}
	}
}

.feed-meta {
	font-size: 0.8em;
	color: var(--text);
	margin-top: 4px;
}

.feed-disabled {
	color: var(--error);
	margin-left: 8px;
}

.empty {
	text-align: center;
	padding: 32px;
	color: var(--fg);
}
</style>
