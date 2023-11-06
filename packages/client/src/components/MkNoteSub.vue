<template>
	<article
		v-if="!muted.muted || muted.what === 'reply'"
		ref="el"
		v-size="{ max: [450, 500] }"
		class="wrpstxzv"
		:id="detailedView ? appearNote.id : null"
		tabindex="-1"
		:class="{
			children: depth > 1,
			singleStart: replies.length == 1,
			firstColumn: depth == 1 && conversation,
		}"
		@contextmenu.stop="onContextmenu"
	>
		<div v-if="conversation && depth > 1" class="line"></div>
		<div
			class="main"
			@click="noteClick"
			:style="{ cursor: expandOnNoteClick ? 'pointer' : '' }"
		>
			<div class="avatar-container">
				<MkAvatar class="avatar" :user="appearNote.user" />
				<div
					v-if="!conversation || replies.length > 0"
					class="line"
				></div>
			</div>
			<div class="body">
				<XNoteHeader class="header" :note="note" :mini="true" />
				<div class="body">
					<MkSubNoteContent
						class="text"
						:note="note"
						:parentId="parentId"
						:conversation="conversation"
						:detailedView="detailedView"
						@focusfooter="footerEl.focus()"
					/>
					<div v-if="translating || translation" class="translation">
						<MkLoading v-if="translating" mini />
						<div v-else class="translated">
							<b
								>{{
									i18n.t("translatedFrom", {
										x: translation.sourceLang,
									})
								}}:
							</b>
							<Mfm
								:text="translation.text"
								:author="appearNote.user"
								:i="$i"
								:custom-emojis="appearNote.emojis"
							/>
						</div>
					</div>
				</div>
				<footer ref="footerEl" class="footer" tabindex="-1">
					<XReactionsViewer
						v-if="enableEmojiReactions"
						ref="reactionsViewer"
						:note="appearNote"
					/>
					<button
						v-tooltip.noDelay.bottom="i18n.ts.reply"
						class="button _button"
						@click.stop="reply()"
					>
						<i class="ph-arrow-u-up-left ph-bold ph-lg"></i>
						<template v-if="appearNote.repliesCount > 0">
							<p class="count">{{ appearNote.repliesCount }}</p>
						</template>
					</button>
					<XRenoteButton
						ref="renoteButton"
						class="button"
						:note="appearNote"
						:count="appearNote.renoteCount"
					/>
					<XStarButtonNoEmoji
						v-if="!enableEmojiReactions"
						class="button"
						:note="appearNote"
						:count="
							Object.values(appearNote.reactions).reduce(
								(partialSum, val) => partialSum + val,
								0,
							)
						"
						:reacted="appearNote.myReaction != null"
					/>
					<XStarButton
						v-if="
							enableEmojiReactions &&
							appearNote.myReaction == null
						"
						ref="starButton"
						class="button"
						:note="appearNote"
					/>
					<button
						v-if="
							enableEmojiReactions &&
							appearNote.myReaction == null
						"
						ref="reactButton"
						v-tooltip.noDelay.bottom="i18n.ts.reaction"
						class="button _button"
						@click.stop="react()"
					>
						<i class="ph-smiley ph-bold ph-lg"></i>
					</button>
					<button
						v-if="
							enableEmojiReactions &&
							appearNote.myReaction != null
						"
						ref="reactButton"
						class="button _button reacted"
						@click.stop="undoReact(appearNote)"
						v-tooltip.noDelay.bottom="i18n.ts.removeReaction"
					>
						<i class="ph-minus ph-bold ph-lg"></i>
					</button>
					<XQuoteButton class="button" :note="appearNote" />
					<button
						ref="menuButton"
						v-tooltip.noDelay.bottom="i18n.ts.more"
						class="button _button"
						@click.stop="menu()"
					>
						<i class="ph-dots-three-outline ph-bold ph-lg"></i>
					</button>
				</footer>
			</div>
		</div>
		<template v-if="conversation">
			<MkNoteSub
				v-if="replyLevel < 11 && depth < 5"
				v-for="reply in replies"
				:key="reply.id"
				:note="reply"
				class="reply"
				:class="{ single: replies.length == 1 }"
				:conversation="conversation"
				:depth="replies.length == 1 ? depth : depth + 1"
				:replyLevel="replyLevel + 1"
				:parentId="appearNote.id"
				:detailedView="detailedView"
			/>
			<div v-else-if="replies.length > 0" class="more">
				<div class="line"></div>
				<MkA class="text _link" :to="notePage(note)"
					>{{ i18n.ts.continueThread }}
					<i class="ph-caret-double-right ph-bold ph-lg"></i
				></MkA>
			</div>
		</template>
	</article>
	<div v-else class="muted" @click="muted.muted = false">
		<I18n :src="softMuteReasonI18nSrc(muted.what)" tag="small">
			<template #name>
				<MkA
					v-user-preview="note.userId"
					class="name"
					:to="userPage(note.user)"
				>
					<MkUserName :user="note.user" />
				</MkA>
			</template>
			<template #reason>
				<b class="_blur_text">{{ muted.matched.join(", ") }}</b>
			</template>
		</I18n>
	</div>
</template>

<script lang="ts" setup>
import { inject, ref } from "vue";
import type { Ref } from "vue";
import * as misskey from "firefish-js";
import XNoteHeader from "@/components/MkNoteHeader.vue";
import MkSubNoteContent from "@/components/MkSubNoteContent.vue";
import XReactionsViewer from "@/components/MkReactionsViewer.vue";
import XStarButton from "@/components/MkStarButton.vue";
import XStarButtonNoEmoji from "@/components/MkStarButtonNoEmoji.vue";
import XRenoteButton from "@/components/MkRenoteButton.vue";
import XQuoteButton from "@/components/MkQuoteButton.vue";
import copyToClipboard from "@/scripts/copy-to-clipboard";
import { url } from "@/config";
import { pleaseLogin } from "@/scripts/please-login";
import { getNoteMenu } from "@/scripts/get-note-menu";
import { getWordSoftMute } from "@/scripts/check-word-mute";
import { notePage } from "@/filters/note";
import { useRouter } from "@/router";
import { userPage } from "@/filters/user";
import * as os from "@/os";
import { reactionPicker } from "@/scripts/reaction-picker";
import { $i } from "@/account";
import { i18n } from "@/i18n";
import { useNoteCapture } from "@/scripts/use-note-capture";
import { defaultStore } from "@/store";
import { deepClone } from "@/scripts/clone";

const router = useRouter();

const props = withDefaults(
	defineProps<{
		note: misskey.entities.Note;
		conversation?: misskey.entities.Note[];
		parentId?;
		detailedView?;

		// how many notes are in between this one and the note being viewed in detail
		depth?: number;
		// the actual reply level of this note within the conversation thread
		replyLevel?: number;
	}>(),
	{
		depth: 1,
		replyLevel: 1,
	},
);

let note = $ref(deepClone(props.note));

const softMuteReasonI18nSrc = (what?: string) => {
	if (what === "note") return i18n.ts.userSaysSomethingReason;
	if (what === "reply") return i18n.ts.userSaysSomethingReasonReply;
	if (what === "renote") return i18n.ts.userSaysSomethingReasonRenote;
	if (what === "quote") return i18n.ts.userSaysSomethingReasonQuote;

	// I don't think here is reachable, but just in case
	return i18n.ts.userSaysSomething;
};

const isRenote =
	note.renote != null &&
	note.text == null &&
	note.fileIds.length === 0 &&
	note.poll == null;

const el = ref<HTMLElement>();
const footerEl = ref<HTMLElement>();
const menuButton = ref<HTMLElement>();
const starButton = ref<InstanceType<typeof XStarButton>>();
const renoteButton = ref<InstanceType<typeof XRenoteButton>>();
const reactButton = ref<HTMLElement>();
let appearNote = $computed(() =>
	isRenote ? (note.renote as misskey.entities.Note) : note,
);
const isDeleted = ref(false);
const muted = ref(getWordSoftMute(note, $i, defaultStore.state.mutedWords));
const translation = ref(null);
const translating = ref(false);
const replies: misskey.entities.Note[] =
	props.conversation
		?.filter(
			(item) =>
				item.replyId === props.note.id ||
				item.renoteId === props.note.id,
		)
		.reverse() ?? [];
const enableEmojiReactions = defaultStore.state.enableEmojiReactions;
const expandOnNoteClick = defaultStore.state.expandOnNoteClick;

useNoteCapture({
	rootEl: el,
	note: $$(appearNote),
	isDeletedRef: isDeleted,
});

function reply(viaKeyboard = false): void {
	pleaseLogin();
	os.post({
		reply: appearNote,
		animation: !viaKeyboard,
	}).then(() => {
		focus();
	});
}

function react(viaKeyboard = false): void {
	pleaseLogin();
	blur();
	reactionPicker.show(
		reactButton.value,
		(reaction) => {
			os.api("notes/reactions/create", {
				noteId: appearNote.id,
				reaction: reaction,
			});
		},
		() => {
			focus();
		},
	);
}

function undoReact(note): void {
	const oldReaction = note.myReaction;
	if (!oldReaction) return;
	os.api("notes/reactions/delete", {
		noteId: note.id,
	});
}

const currentClipPage = inject<Ref<misskey.entities.Clip> | null>(
	"currentClipPage",
	null,
);

function menu(viaKeyboard = false): void {
	os.popupMenu(
		getNoteMenu({
			note: note,
			translating,
			translation,
			menuButton,
			isDeleted,
			currentClipPage,
		}),
		menuButton.value,
		{
			viaKeyboard,
		},
	).then(focus);
}

function onContextmenu(ev: MouseEvent): void {
	const isLink = (el: HTMLElement) => {
		if (el.tagName === "A") return true;
		if (el.parentElement) {
			return isLink(el.parentElement);
		}
	};
	if (isLink(ev.target)) return;
	if (window.getSelection().toString() !== "") return;

	if (defaultStore.state.useReactionPickerForContextMenu) {
		ev.preventDefault();
		react();
	} else {
		os.contextMenu(
			[
				{
					type: "label",
					text: notePage(appearNote),
				},
				{
					icon: "ph-browser ph-bold ph-lg",
					text: i18n.ts.openInWindow,
					action: () => {
						os.pageWindow(notePage(appearNote));
					},
				},
				notePage(appearNote) != location.pathname
					? {
							icon: "ph-arrows-out-simple ph-bold ph-lg",
							text: i18n.ts.showInPage,
							action: () => {
								router.push(notePage(appearNote), "forcePage");
							},
					  }
					: undefined,
				null,
				{
					type: "a",
					icon: "ph-arrow-square-out ph-bold ph-lg",
					text: i18n.ts.openInNewTab,
					href: notePage(appearNote),
					target: "_blank",
				},
				{
					icon: "ph-link-simple ph-bold ph-lg",
					text: i18n.ts.copyLink,
					action: () => {
						copyToClipboard(`${url}${notePage(appearNote)}`);
					},
				},
				note.user.host != null
					? {
							type: "a",
							icon: "ph-arrow-square-up-right ph-bold ph-lg",
							text: i18n.ts.showOnRemote,
							href: note.url ?? note.uri ?? "",
							target: "_blank",
					  }
					: undefined,
			],
			ev,
		);
	}
}

function focus() {
	el.value.focus();
}

function blur() {
	el.value.blur();
}

function noteClick(e) {
	if (document.getSelection().type === "Range" || !expandOnNoteClick) {
		e.stopPropagation();
	} else {
		router.push(notePage(props.note));
	}
}
</script>

<style lang="scss" scoped>
.wrpstxzv {
	padding: 16px 32px;
	outline: none;
	&.children {
		padding: 10px 0 0 var(--indent);
		padding-left: var(--indent) !important;
		font-size: 1em;
		cursor: auto;

		&.max-width_500px {
			padding: 10px 0 0 8px;
		}
	}

	> .main {
		display: flex;

		> .avatar-container {
			margin-right: 8px;
			z-index: 2;
			> .avatar {
				flex-shrink: 0;
				display: block;
				width: 38px;
				height: 38px;
				border-radius: 8px;
			}
		}

		> .body {
			position: relative;
			flex: 1;
			min-width: 0;
			margin: 0 -200px;
			padding: 0 200px;
			overflow: clip;
			@media (pointer: coarse) {
				cursor: default;
			}

			> .header {
				margin-bottom: 2px;
				cursor: auto;
			}

			> .body {
				> .translation {
					border: solid 0.5px var(--divider);
					border-radius: var(--radius);
					padding: 12px;
					margin-top: 8px;
				}
			}
			> .footer {
				position: relative;
				z-index: 2;
				display: flex;
				flex-wrap: wrap;

				> :deep(.button) {
					position: relative;
					margin: 0;
					padding: 8px;
					opacity: 0.7;
					&:disabled {
						opacity: 0.5 !important;
					}
					flex-grow: 1;
					max-width: 3.5em;
					width: max-content;
					min-width: max-content;
					height: auto;
					transition: opacity 0.2s;
					&::before {
						content: "";
						position: absolute;
						inset: 0;
						bottom: 2px;
						background: var(--panel);
						z-index: -1;
						transition: background 0.2s;
					}
					&:first-of-type {
						margin-left: -0.5em;
						&::before {
							border-radius: 100px 0 0 100px;
						}
					}
					&:last-of-type {
						&::before {
							border-radius: 0 100px 100px 0;
						}
					}
					&:hover {
						color: var(--fgHighlighted);
					}

					> i {
						display: inline !important;
					}

					> .count {
						display: inline;
						margin: 0 0 0 8px;
						opacity: 0.7;
					}

					&.reacted {
						color: var(--accent);
					}
				}
			}
		}
	}

	&.reply > .main {
		margin-inline: -200px;
		padding-inline: 200px;
		&::before {
			inset-inline: 176px !important;
		}
	}
	&.reply,
	&.reply-to {
		> .main > .body {
			margin-right: -24px;
			padding-right: 24px;
			margin-top: -12px;
			padding-top: 12px;
			margin-left: calc(0px - var(--avatarSize) - 32px);
			padding-left: calc(var(--avatarSize) + 32px);
			border-radius: var(--radius);
		}
	}
	&.reply-to {
		> .main > .body {
			margin-left: calc(0px - var(--avatarSize) - 38px);
			padding-left: calc(var(--avatarSize) + 38px);
			margin-top: -16px;
			padding-top: 16px;
		}
	}
	&.reply {
		--avatarSize: 38px;
		.avatar-container {
			margin-right: 8px !important;
		}
	}
	> .reply,
	> .more {
		margin-top: 10px;
		&.single {
			padding: 0 !important;
			> .line {
				display: none;
			}
		}
	}

	> .more {
		display: flex;
		padding-block: 10px;
		font-weight: 600;
		> .line {
			position: relative;
			z-index: 2;
			flex-grow: 0 !important;
			margin-top: -10px !important;
			margin-bottom: 10px !important;
			margin-right: 10px !important;
			&::before {
				border-left-style: dashed !important;
				border-bottom-left-radius: 100px !important;
			}
		}
		i {
			font-size: 1em !important;
			vertical-align: middle !important;
		}
		a {
			position: static;
			&::before {
				content: "";
				position: absolute;
				inset: 0;
			}
			&::after {
				content: unset;
			}
		}
	}

	&.reply,
	&.reply-to,
	&.reply-to-more {
		> .main:hover,
		> .main:focus-within {
			:deep(.footer .button) {
				opacity: 1;
			}
		}
	}

	&.reply-to,
	&.reply-to-more {
		padding-bottom: 0;
		&:first-child {
			padding-top: 24px;
		}
		.line::before {
			margin-bottom: -16px;
		}
	}

	// Reply Lines
	&.reply,
	&.reply-to,
	&.reply-to-more {
		--indent: calc(var(--avatarSize) - 5px);
		> .main {
			> .avatar-container {
				display: flex;
				flex-direction: column;
				align-items: center;
				margin-right: 14px;
				width: var(--avatarSize);
				> .avatar {
					width: var(--avatarSize);
					height: var(--avatarSize);
					margin: 0;
				}
			}
		}
		.line {
			position: relative;
			z-index: 2;
			width: var(--avatarSize);
			display: flex;
			flex-grow: 1;
			margin-bottom: -10px;
			pointer-events: none;
			opacity: 0.25;
			&::before {
				content: "";
				position: absolute;
				border-left: 2px solid currentColor;
				margin-left: calc((var(--avatarSize) / 2) - 1px);
				width: calc(var(--indent) / 2);
				inset-block: 0;
				min-height: 8px;
			}
		}
	}
	&.reply-to,
	&.reply-to-more {
		> .main > .avatar-container > .line {
			margin-bottom: 0px !important;
		}
	}
	&.single,
	&.singleStart {
		> .main > .avatar-container > .line {
			margin-bottom: -10px !important;
		}
	}
	.reply.children:not(:last-child) {
		// Line that goes through multiple replies
		position: relative;
		> .line {
			position: absolute;
			top: 0;
			left: 0;
			bottom: 0;
		}
	}
	// Reply line connectors
	.reply.children:not(.single) {
		position: relative;
		> .line {
			position: absolute;
			z-index: 2;
			left: 0;
			top: 0;
			opacity: 0.25;
			&::after {
				content: "";
				position: absolute;
				border-left: 2px solid currentColor;
				border-bottom: 2px solid currentColor;
				margin-left: calc((var(--avatarSize) / 2) - 1px);
				width: calc(var(--indent) / 2);
				height: calc((var(--avatarSize) / 2));
				border-bottom-left-radius: calc(var(--indent) / 2);
				top: 8px;
			}
		}
		&:not(:last-child) > .line::after {
			mask: linear-gradient(to right, transparent 2px, black 2px);
			-webkit-mask: linear-gradient(to right, transparent 2px, black 2px);
		}
	}
	// End Reply Divider
	.children > .main:last-child {
		padding-bottom: 1em;
		&::before {
			bottom: 1em;
		}
		// &::after {
		// 	content: "";
		// 	border-top: 1px solid var(--X13);
		// 	position: absolute;
		// 	bottom: 0;
		// 	margin-left: calc(var(--avatarSize) + 12px);
		// 	inset-inline: 0;
		// }
	}
	&.firstColumn > .children:last-child > .main {
		padding-bottom: 0 !important;
		&::before {
			bottom: 0 !important;
		}
		// &::after { content: unset }
	}

	&.max-width_500px {
		padding: 14px 16px;
		:not(.reply) > & {
			.reply {
				--avatarSize: 24px;
				--indent: calc(var(--avatarSize) - 4px);
			}
		}
		&.firstColumn {
			> .main,
			> .line,
			> .children:not(.single) > .line {
				--avatarSize: 35px;
				--indent: 35px;
			}
			> .children:not(.single) {
				padding-left: 28px !important;
			}
		}
		&.reply-to {
			--avatarSize: 46px;
			padding: 14px 16px;
			padding-top: 14px !important;
			padding-bottom: 0 !important;
			margin-bottom: 0 !important;
		}
		> .main > .avatar-container {
			margin-right: 10px;
		}
		&:first-child > .main > .body {
			margin-top: -20px;
			padding-top: 22px;
		}
	}
}

.muted {
	padding: 8px;
	text-align: center;
	opacity: 0.7;
}
</style>
