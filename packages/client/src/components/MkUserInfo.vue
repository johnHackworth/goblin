<template>
	<article class="_panel user-card">
		<div
			class="banner"
			:style="
				user.bannerUrl ? `background-image: url(${user.bannerUrl})` : ''
			"
			:class="{ detailed }"
		>
			<span
				v-if="$i && $i.id != user.id && user.isFollowed"
				class="followed"
				>{{ i18n.ts.followsYou }}</span
			>
		</div>
		<h3 class="title">
			<MkAvatar
				class="avatar"
				:user="user"
				:disable-preview="true"
				:show-indicator="true"
			/>
			<MkA class="name" :to="userPage(user)"
				><MkUserName :user="user" :nowrap="true"
			/></MkA>
			<p class="username"><MkAcct :user="user" /></p>
		</h3>
		<div
			class="description"
			:class="{ collapsed: isLong && collapsed, truncate: !detailed }"
		>
			<Mfm
				v-if="user.description"
				class="mfm"
				:text="user.description"
				:author="user"
				:i="$i"
				:custom-emojis="user.emojis"
			/>
			<span v-else style="opacity: 0.7">{{
				i18n.ts.noAccountDescription
			}}</span>
		</div>
		<XShowMoreButton v-if="isLong" v-model="collapsed"></XShowMoreButton>
		<div v-if="user.fields.length > 0 && detailed" class="fields">
			<dl v-for="(field, i) in user.fields" :key="i" class="field">
				<dt class="name">
					<Mfm
						:text="field.name"
						:plain="true"
						:custom-emojis="user.emojis"
						:colored="false"
					/>
				</dt>
				<dd class="value">
					<Mfm
						:text="field.value"
						:author="user"
						:i="$i"
						:custom-emojis="user.emojis"
						:colored="false"
					/>
				</dd>
			</dl>
		</div>
		<div class="status">
			<p>
				<MkNumber :value="user.notesCount" />
				{{ i18n.ts.notes }}
			</p>
			<p>
				<MkNumber :value="user.followingCount" />
				{{ i18n.ts.following }}
			</p>
			<p>
				<MkNumber :value="user.followersCount" />
				{{ i18n.ts.followers }}
			</p>
		</div>
		<div class="buttons">
			<slot>
				<MkFollowButton v-if="$i && user.id != $i.id" :user="user" />
			</slot>
		</div>
	</article>
</template>

<script lang="ts" setup>
import * as misskey from "firefish-js";
import MkFollowButton from "@/components/MkFollowButton.vue";
import XShowMoreButton from "@/components/MkShowMoreButton.vue";
import MkNumber from "@/components/MkNumber.vue";
import { userPage } from "@/filters/user";
import { i18n } from "@/i18n";

const props = defineProps<{
	user: misskey.entities.UserDetailed;
	detailed?: boolean;
}>();

let isLong = $ref(
	props.detailed &&
		props.user.description &&
		(props.user.description.split("\n").length > 9 ||
			props.user.description.length > 400),
);
let collapsed = $ref(isLong);
</script>

<style lang="scss" scoped>
.user-card {
	position: relative;
	display: flex;
	flex-direction: column;

	.banner {
		height: 94px;
		background-color: rgba(0, 0, 0, 0.1);
		background-size: cover;
		background-position: center;
		margin-bottom: calc(0px - var(--radius));
		&::before {
			content: "";
			position: absolute;
			inset: 0;
			z-index: 2;
			height: inherit;
			background: linear-gradient(
				-125deg,
				rgba(0, 0, 0, 0.7),
				transparent,
				transparent
			);
		}
		> .followed {
			position: absolute;
			top: 12px;
			inset-inline-start: 12px;
			padding: 4px 8px;
			color: #fff;
			background: rgba(0, 0, 0, 0.7);
			font-size: 0.7em;
			border-radius: 6px;
		}
		&.detailed::after {
			content: "";
			background-image: var(--blur, inherit);
			position: fixed;
			inset: 0;
			background-size: cover;
			background-position: center;
			pointer-events: none;
			opacity: 0.1;
			filter: var(--blur, blur(10px));
			z-index: 5;
		}
	}

	.title {
		position: relative;
		display: block;
		padding: 10px;
		padding-inline-start: 84px;
		margin: 0;
		font-size: 1em;
		border-radius: var(--radius);
		background: var(--panel);
		line-height: 1;
		z-index: 4;

		.avatar {
			display: block;
			position: absolute;
			bottom: 6px;
			inset-inline-start: 10px;
			z-index: 2;
			width: 58px;
			height: 58px;
			background: var(--panel);
			border: solid 4px var(--panel);
		}
		.name {
			display: inline-block;
			margin: 0;
			font-weight: bold;
			line-height: 16px;
			overflow: hidden;
			text-overflow: ellipsis;
			height: 1.5em;
			margin-block: -0.5em;
			padding-block: 0.5em 0.25em;
			max-width: 100%;
		}

		.username {
			display: block;
			margin: 0;
			line-height: 16px;
			font-size: 0.8em;
			color: var(--fg);
			font-weight: 500;
			opacity: 0.7;
			line-height: 1;
		}
	}

	.description {
		overflow: hidden;
		padding-inline: 16px;
		margin-bottom: 10px;
		font-size: 0.8em;
		&.truncate {
			display: -webkit-box;
			-webkit-line-clamp: 6;
			-webkit-box-orient: vertical;
		}
		&.collapsed {
			position: relative;
			max-height: calc(9em + 50px);
			mask: linear-gradient(black calc(100% - 64px), transparent);
			-webkit-mask: linear-gradient(black calc(100% - 64px), transparent);
		}
		&.collapsed,
		&.truncate {
			:deep(br) {
				display: block; // collapse white spaces
			}
		}
	}
	:deep(.fade) {
		position: relative;
		display: block;
		width: 100%;
		margin-top: -4.5em;
		z-index: 2;
		> span {
			display: inline-block;
			background: var(--panel);
			padding: 0.4em 1em;
			font-size: 0.8em;
			border-radius: 999px;
			box-shadow: 0 2px 6px rgb(0 0 0 / 20%);
		}
		&:hover {
			> span {
				background: var(--panelHighlight);
			}
		}
	}
	:deep(.showLess) {
		width: 100%;
		position: sticky;
		bottom: var(--stickyBottom);

		> span {
			display: inline-block;
			background: var(--panel);
			padding: 6px 10px;
			font-size: 0.8em;
			border-radius: 999px;
			box-shadow: 0 0 7px 7px var(--bg);
		}
	}
	> .fields {
		padding-inline: 16px;
		font-size: 0.8em;
		padding-block: 1em;
		border-top: 1px solid var(--divider);

		> .field {
			display: flex;
			padding: 0;
			margin: 0;
			align-items: center;

			&:not(:last-child) {
				margin-bottom: 8px;
			}

			:deep(span) {
				white-space: nowrap !important;
			}

			> .name {
				width: 30%;
				overflow: hidden;
				white-space: nowrap;
				text-overflow: ellipsis;
				font-weight: bold;
				text-align: center;
				padding-inline-end: 10px;
			}

			> .value {
				width: 70%;
				overflow: hidden;
				white-space: nowrap;
				text-overflow: ellipsis;
				margin: 0;
			}
		}
	}
	.status {
		display: flex;
		gap: 1em;
		padding-inline: 16px;
		font-size: 0.8em;
		margin-top: auto;
		border-top: 1px solid var(--divider);
		> p > :deep(span) {
			font-weight: 700;
			color: var(--accent);
		}
	}

	.buttons {
		position: absolute;
		top: 8px;
		inset-inline-end: 8px;
		margin-bottom: 1rem;
		z-index: 3;
		color: white;
	}
}
</style>
