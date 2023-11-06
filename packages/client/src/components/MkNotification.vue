<template>
	<div
		ref="elRef"
		v-size="{ max: [500, 450] }"
		class="qglefbjs notification"
		:class="notification.type"
	>
		<div class="head">
			<MkAvatar
				v-if="notification.type === 'pollEnded'"
				class="icon"
				:user="notification.note.user"
			/>
			<MkAvatar
				v-else-if="notification.user"
				class="icon"
				:user="notification.user"
			/>
			<img
				v-else-if="notification.icon"
				class="icon"
				:src="notification.icon"
				alt=""
			/>
			<div class="sub-icon" :class="notification.type">
				<i
					v-if="notification.type === 'follow'"
					class="ph-hand-waving ph-bold"
				></i>
				<i
					v-else-if="notification.type === 'receiveFollowRequest'"
					class="ph-clock ph-bold"
				></i>
				<i
					v-else-if="notification.type === 'followRequestAccepted'"
					class="ph-check ph-bold"
				></i>
				<i
					v-else-if="notification.type === 'groupInvited'"
					class="ph-identification-card ph-bold"
				></i>
				<i
					v-else-if="notification.type === 'renote'"
					class="ph-repeat ph-bold"
				></i>
				<i
					v-else-if="notification.type === 'reply'"
					class="ph-arrow-bend-up-left ph-bold"
				></i>
				<i
					v-else-if="notification.type === 'mention'"
					class="ph-at ph-bold"
				></i>
				<i
					v-else-if="notification.type === 'quote'"
					class="ph-quotes ph-bold"
				></i>
				<i
					v-else-if="notification.type === 'pollVote'"
					class="ph-microphone-stage ph-bold"
				></i>
				<i
					v-else-if="notification.type === 'pollEnded'"
					class="ph-microphone-stage ph-bold"
				></i>
				<!-- notification.reaction が null になることはまずないが、ここでoptional chaining使うと一部ブラウザで刺さるので念の為 -->
				<XReactionIcon
					v-else-if="
						showEmojiReactions && notification.type === 'reaction'
					"
					ref="reactionRef"
					:reaction="
						notification.reaction
							? notification.reaction.replace(
									/^:(\w+):$/,
									':$1@.:',
							  )
							: notification.reaction
					"
					:custom-emojis="notification.note.emojis"
					:no-style="true"
				/>
				<XReactionIcon
					v-else-if="
						!showEmojiReactions && notification.type === 'reaction'
					"
					:reaction="defaultReaction"
					:no-style="true"
				/>
			</div>
		</div>
		<div class="tail">
			<header>
				<span v-if="notification.type === 'pollEnded'">{{
					i18n.ts._notification.pollEnded
				}}</span>
				<MkA
					v-else-if="notification.user"
					v-user-preview="notification.user.id"
					class="name"
					:to="userPage(notification.user)"
					><MkUserName :user="notification.user"
				/></MkA>
				<span v-else>{{ notification.header }}</span>
				<MkTime
					v-if="withTime"
					:time="notification.createdAt"
					class="time"
				/>
			</header>
			<MkA
				v-if="notification.type === 'reaction'"
				class="text"
				:to="notePage(notification.note)"
				:title="getNoteSummary(notification.note)"
			>
				<span>{{ i18n.ts._notification.reacted }}</span>
				<i class="ph-quotes ph-fill ph-lg"></i>
				<Mfm
					:text="getNoteSummary(notification.note)"
					:plain="true"
					:nowrap="!full"
					:custom-emojis="notification.note.emojis"
				/>
				<i class="ph-quotes ph-fill ph-lg"></i>
			</MkA>
			<MkA
				v-if="notification.type === 'renote'"
				class="text"
				:to="notePage(notification.note)"
				:title="getNoteSummary(notification.note.renote)"
			>
				<span>{{ i18n.ts._notification.renoted }}</span>
				<i class="ph-quotes ph-fill ph-lg"></i>
				<Mfm
					:text="getNoteSummary(notification.note.renote)"
					:plain="true"
					:nowrap="!full"
					:custom-emojis="notification.note.renote.emojis"
				/>
				<i class="ph-quotes ph-fill ph-lg"></i>
			</MkA>
			<MkA
				v-if="notification.type === 'reply'"
				class="text"
				:to="notePage(notification.note)"
				:title="getNoteSummary(notification.note)"
			>
				<Mfm
					:text="getNoteSummary(notification.note)"
					:plain="true"
					:nowrap="!full"
					:custom-emojis="notification.note.emojis"
				/>
			</MkA>
			<MkA
				v-if="notification.type === 'mention'"
				class="text"
				:to="notePage(notification.note)"
				:title="getNoteSummary(notification.note)"
			>
				<Mfm
					:text="getNoteSummary(notification.note)"
					:plain="true"
					:nowrap="!full"
					:custom-emojis="notification.note.emojis"
				/>
			</MkA>
			<MkA
				v-if="notification.type === 'quote'"
				class="text"
				:to="notePage(notification.note)"
				:title="getNoteSummary(notification.note)"
			>
				<Mfm
					:text="getNoteSummary(notification.note)"
					:plain="true"
					:nowrap="!full"
					:custom-emojis="notification.note.emojis"
				/>
			</MkA>
			<MkA
				v-if="notification.type === 'pollVote'"
				class="text"
				:to="notePage(notification.note)"
				:title="getNoteSummary(notification.note)"
			>
				<span>{{ i18n.ts._notification.voted }}</span>
				<i class="ph-quotes ph-fill ph-lg"></i>
				<Mfm
					:text="getNoteSummary(notification.note)"
					:plain="true"
					:nowrap="!full"
					:custom-emojis="notification.note.emojis"
				/>
				<i class="ph-quotes ph-fill ph-lg"></i>
			</MkA>
			<MkA
				v-if="notification.type === 'pollEnded'"
				class="text"
				:to="notePage(notification.note)"
				:title="getNoteSummary(notification.note)"
			>
				<i class="ph-quotes ph-fill ph-lg"></i>
				<Mfm
					:text="getNoteSummary(notification.note)"
					:plain="true"
					:nowrap="!full"
					:custom-emojis="notification.note.emojis"
				/>
				<i class="ph-quotes ph-fill ph-lg"></i>
			</MkA>
			<span
				v-if="notification.type === 'follow'"
				class="text"
				style="opacity: 0.7"
				>{{ i18n.ts.youGotNewFollower }}
				<div v-if="full">
					<MkFollowButton
						:user="notification.user"
						:full="true"
						:hideMenu="true"
					/></div
			></span>
			<span
				v-if="notification.type === 'followRequestAccepted'"
				class="text"
				style="opacity: 0.7"
				>{{ i18n.ts.followRequestAccepted }}</span
			>
			<span
				v-if="notification.type === 'receiveFollowRequest'"
				class="text"
				style="opacity: 0.7"
				>{{ i18n.ts.receiveFollowRequest }}
				<div v-if="full && !followRequestDone">
					<button class="_textButton" @click="acceptFollowRequest()">
						{{ i18n.ts.accept }}
					</button>
					|
					<button class="_textButton" @click="rejectFollowRequest()">
						{{ i18n.ts.reject }}
					</button>
				</div></span
			>
			<span
				v-if="notification.type === 'groupInvited'"
				class="text"
				style="opacity: 0.7"
				>{{ i18n.ts.groupInvited }}:
				<b>{{ notification.invitation.group.name }}</b>
				<div v-if="full && !groupInviteDone">
					<button
						class="_textButton"
						@click="acceptGroupInvitation()"
					>
						{{ i18n.ts.accept }}
					</button>
					|
					<button
						class="_textButton"
						@click="rejectGroupInvitation()"
					>
						{{ i18n.ts.reject }}
					</button>
				</div></span
			>
			<span v-if="notification.type === 'app'" class="text">
				<Mfm :text="notification.body" :nowrap="!full" />
			</span>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import * as misskey from "firefish-js";
import XReactionIcon from "@/components/MkReactionIcon.vue";
import MkFollowButton from "@/components/MkFollowButton.vue";
import XReactionTooltip from "@/components/MkReactionTooltip.vue";
import { getNoteSummary } from "@/scripts/get-note-summary";
import { notePage } from "@/filters/note";
import { userPage } from "@/filters/user";
import { i18n } from "@/i18n";
import * as os from "@/os";
import { stream } from "@/stream";
import { useTooltip } from "@/scripts/use-tooltip";
import { defaultStore } from "@/store";
import { instance } from "@/instance";

const props = withDefaults(
	defineProps<{
		notification: misskey.entities.Notification;
		withTime?: boolean;
		full?: boolean;
	}>(),
	{
		withTime: false,
		full: false,
	},
);

const elRef = ref<HTMLElement>(null);
const reactionRef = ref(null);

const showEmojiReactions =
	defaultStore.state.enableEmojiReactions ||
	defaultStore.state.showEmojisInReactionNotifications;
const defaultReaction = ["⭐", "👍", "❤️"].includes(instance.defaultReaction)
	? instance.defaultReaction
	: "⭐";

let readObserver: IntersectionObserver | undefined;
let connection;

onMounted(() => {
	if (!props.notification.isRead) {
		readObserver = new IntersectionObserver((entries, observer) => {
			if (!entries.some((entry) => entry.isIntersecting)) return;
			stream.send("readNotification", {
				id: props.notification.id,
			});
			observer.disconnect();
		});

		readObserver.observe(elRef.value);

		connection = stream.useChannel("main");
		connection.on("readAllNotifications", () => readObserver.disconnect());

		watch(props.notification.isRead, () => {
			readObserver.disconnect();
		});
	}
});

onUnmounted(() => {
	if (readObserver) readObserver.disconnect();
	if (connection) connection.dispose();
});

const followRequestDone = ref(false);
const groupInviteDone = ref(false);

const acceptFollowRequest = () => {
	followRequestDone.value = true;
	os.api("following/requests/accept", { userId: props.notification.user.id });
};

const rejectFollowRequest = () => {
	followRequestDone.value = true;
	os.api("following/requests/reject", { userId: props.notification.user.id });
};

const acceptGroupInvitation = () => {
	groupInviteDone.value = true;
	os.apiWithDialog("users/groups/invitations/accept", {
		invitationId: props.notification.invitation.id,
	});
};

const rejectGroupInvitation = () => {
	groupInviteDone.value = true;
	os.api("users/groups/invitations/reject", {
		invitationId: props.notification.invitation.id,
	});
};

useTooltip(reactionRef, (showing) => {
	os.popup(
		XReactionTooltip,
		{
			showing,
			reaction: props.notification.reaction
				? props.notification.reaction.replace(/^:(\w+):$/, ":$1@.:")
				: props.notification.reaction,
			emojis: props.notification.note.emojis,
			targetElement: reactionRef.value.$el,
		},
		{},
		"closed",
	);
});
</script>

<style lang="scss" scoped>
.qglefbjs {
	position: relative;
	box-sizing: border-box;
	padding: 24px 32px;
	font-size: 0.9em;
	overflow-wrap: break-word;
	display: flex;
	contain: content;

	&.max-width_500px {
		padding-block: 16px;
		font-size: 0.9em;
	}
	&.max-width_450px {
		padding: 12px 16px;
	}

	> .head {
		position: sticky;
		top: 0;
		flex-shrink: 0;
		width: 42px;
		height: 42px;
		margin-right: 8px;

		> .icon {
			display: block;
			width: 100%;
			height: 100%;
			border-radius: 6px;
		}

		> .sub-icon {
			position: absolute;
			z-index: 1;
			bottom: -2px;
			right: -2px;
			width: 20px;
			height: 20px;
			box-sizing: border-box;
			border-radius: 100%;
			background: var(--panel);
			box-shadow: 0 0 0 3px var(--panel);
			font-size: 12px;
			text-align: center;

			&:empty {
				display: none;
			}

			> * {
				color: #fff;
				width: 100%;
				height: 100%;
			}

			&.follow,
			&.followRequestAccepted,
			&.receiveFollowRequest,
			&.groupInvited {
				padding: 3px;
				background: #31748f;
				pointer-events: none;
			}

			&.renote {
				padding: 3px;
				background: #31748f;
				pointer-events: none;
			}

			&.quote {
				padding: 3px;
				background: #31748f;
				pointer-events: none;
			}

			&.reply {
				padding: 3px;
				background: #c4a7e7;
				pointer-events: none;
			}

			&.mention {
				padding: 3px;
				background: #908caa;
				pointer-events: none;
			}

			&.pollVote {
				padding: 3px;
				background: #908caa;
				pointer-events: none;
			}

			&.pollEnded {
				padding: 3px;
				background: #908caa;
				pointer-events: none;
			}
		}
	}

	> .tail {
		flex: 1;
		min-width: 0;

		> header {
			display: flex;
			align-items: baseline;
			white-space: nowrap;

			> .name {
				text-overflow: ellipsis;
				white-space: nowrap;
				min-width: 0;
				overflow: hidden;
			}

			> .time {
				margin-left: auto;
				font-size: 0.9em;
			}
		}

		> .text {
			white-space: nowrap;
			display: -webkit-box;
			-webkit-line-clamp: 3;
			-webkit-box-orient: vertical;
			overflow: hidden;
			text-overflow: ellipsis;

			> span:first-child {
				opacity: 0.7;
				&::after {
					content: ": ";
				}
			}

			> i {
				vertical-align: super;
				font-size: 50%;
				opacity: 0.5;
			}

			> i:first-child {
				margin-right: 4px;
			}

			> i:last-child {
				margin-left: 4px;
			}
		}
	}
}
</style>
