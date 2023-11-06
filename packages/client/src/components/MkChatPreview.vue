<template>
	<MkA
		class="rivslvers"
		:class="{
			isMe: isMe(message),
			isRead: message.groupId
				? message.reads.includes($i?.id)
				: message.isRead,
		}"
		:to="
			message.groupId
				? `/my/messaging/group/${message.groupId}`
				: `/my/messaging/${getAcct(
						isMe(message) ? message.recipient : message.user,
				  )}`
		"
	>
		<div class="message _block">
			<MkAvatar
				class="avatar"
				:user="
					message.groupId
						? message.user
						: isMe(message)
						? message.recipient
						: message.user
				"
				:show-indicator="true"
				disable-link
			/>
			<header v-if="message.groupId">
				<span class="name">{{ message.group.name }}</span>
				<MkTime :time="message.createdAt" class="time" />
			</header>
			<header v-else>
				<span class="name"
					><MkUserName
						:user="
							isMe(message) ? message.recipient : message.user
						"
				/></span>
				<span class="username"
					>@{{
						acct(isMe(message) ? message.recipient : message.user)
					}}</span
				>
				<MkTime :time="message.createdAt" class="time" />
			</header>
			<div class="body">
				<p class="text">
					<span v-if="isMe(message)" class="me"
						>{{ i18n.ts.you }}:
					</span>
					<Mfm
						v-if="message.text != null && message.text.length > 0"
						:text="message.text"
					/>
					<span v-else> 📎</span>
				</p>
			</div>
		</div>
	</MkA>
</template>

<script lang="ts" setup>
import * as Acct from "firefish-js/built/acct";
import { i18n } from "@/i18n";
import { acct } from "@/filters/user";
import { $i } from "@/account";

const getAcct = Acct.toString;

const props = defineProps<{
	message: Record<string, any>;
}>();

function isMe(message): boolean {
	return message.userId === $i?.id;
}
</script>

<style lang="scss" scoped>
.rivslvers {
	> .message {
		display: block;
		text-decoration: none;
		margin-bottom: var(--margin);

		* {
			pointer-events: none;
			user-select: none;
		}

		&:hover {
			.avatar {
				filter: saturate(200%);
			}
		}

		&.isRead,
		&.isMe {
			opacity: 0.8;
		}

		&:not(.isMe):not(.isRead) {
			background-color: var(--accentedBg);
		}

		&:after {
			content: "";
			display: block;
			clear: both;
		}

		padding: 20px 30px;

		> header {
			display: flex;
			align-items: center;
			margin-bottom: 2px;
			white-space: nowrap;
			overflow: hidden;

			> .name {
				margin: 0;
				padding: 0;
				overflow: hidden;
				text-overflow: ellipsis;
				font-size: 1em;
				font-weight: bold;
				transition: all 0.1s ease;
			}

			> .username {
				margin: 0 8px;
			}

			> .time {
				margin: 0 0 0 auto;
			}
		}

		> .avatar {
			float: left;
			width: 54px;
			height: 54px;
			margin: 0 16px 0 0;
			border-radius: 8px;
			transition: all 0.1s ease;
		}

		> .body {
			> .text {
				display: block;
				margin: 0 0 0 0;
				padding: 0;
				overflow: hidden;
				overflow-wrap: break-word;
				text-decoration: none;
				font-size: 1.1em;
				color: var(--faceText);

				.me {
					opacity: 0.7;
				}
			}

			> .image {
				display: block;
				max-width: 100%;
				max-height: 512px;
			}
		}
	}

	&.max-width_400px {
		> .message {
			> div {
				padding: 16px;
				font-size: 0.9em;

				> .avatar {
					margin: 0 12px 0 0;
				}
			}
		}
	}
}
</style>
