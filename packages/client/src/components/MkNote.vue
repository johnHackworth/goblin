<template>
	<div
		:aria-label="accessibleLabel"
		v-if="!muted.muted"
		v-show="!isDeleted"
		:ref="el"
		v-hotkey="keymap"
		v-size="{ max: [500, 350] }"
		class="tkcbzcuz note-container"
		:tabindex="!isDeleted ? '-1' : 10"
		:class="{ renote: isRenote }"
		:data-visibility="note.visibility"
		:id="appearNote.id"
	>
		<MkNoteSub
			v-if="appearNote.reply && !detailedView && !collapsedReply"
			:note="appearNote.reply"
			class="reply-to"
		/>
		<div
			v-if="!detailedView"
			class="note-context"
			:class="{
				collapsedReply: collapsedReply && appearNote.reply,
			}"
		>
			<div class="line"></div>
			<div v-if="appearNote._prId_" class="info">
				<i class="ph-megaphone-simple-bold ph-lg"></i>
				{{ i18n.ts.promotion
				}}<button class="_textButton hide" @click.stop="readPromo()">
					{{ i18n.ts.hideThisNote }}
					<i class="ph-x ph-bold ph-lg"></i>
				</button>
			</div>
			<div v-if="appearNote._featuredId_" class="info">
				<i class="ph-lightning ph-bold ph-lg"></i>
				{{ i18n.ts.featured }}
			</div>
			<div v-if="pinned" class="info">
				<i class="ph-push-pin ph-bold ph-lg"></i
				>{{ i18n.ts.pinnedNote }}
			</div>

			<div v-if="collapsedReply && appearNote.reply" class="info">
				<MkAvatar class="avatar" :user="appearNote.reply.user" />
				<MkUserName
					class="username"
					:user="appearNote.reply.user"
				></MkUserName>
				<Mfm
					class="summary"
					:text="getNoteSummary(appearNote.reply)"
					:plain="true"
					:nowrap="true"
					:custom-emojis="note.emojis"
				/>
			</div>
		</div>
		<article
			class="article"
		>
			<div class="main">
				<div v-if="renotedBy" class="renoteHeader">
					<MkA
					:to="`/@${renotedBy}`">
						{{ renotedBy }} <ReblogIcon /> reblogged (<MkTime :time="note.createdAt" />)
					</MkA>
				</div>
				<div class="header-container" @click="noteLink">
					<MkAvatar class="avatar" :user="appearNote.user" />
					<XNoteHeader class="header" :note="appearNote" />
				</div>
				<div class="body">
					<NoteContent
						class="text"
						:note="appearNote"
						:detailed="true"
						:detailedView="detailedView"
						:parentId="appearNote.parentId"
						@push="(e) => router.push(notePage(e))"
						@expanded="(e) => setPostExpanded(e)"
					></NoteContent>
				</div>
				<div
					v-if="detailedView || (appearNote.channel && !inChannel)"
					class="info"
				>
					<MkA
						v-if="appearNote.channel && !inChannel"
						class="channel"
						:to="`/channels/${appearNote.channel.id}`"
						@click.stop
						><i class="ph-television ph-bold"></i>
						{{ appearNote.channel.name }}</MkA
					>
				</div>
				<div class="previews" v-if="urls && urls.length > 0">
					<MkUrlPreview
						v-for="url in urls"
						:key="url"
						:url="url"
						detail="true"
						class="urlPreview"
					/>
				</div>
				<footer ref="footerEl" class="footer" tabindex="-1">
					<button
						ref="menuButton"
						v-tooltip.noDelay.bottom="Notes"
						class="button _button noteCount"
						v-if="!props.hideNotesCounter && !isRss"
						@click="noteClick"
					>
						<template v-if="props.showCloseButton">
							<i class="ph-x-circle ph-bold ph-lg"></i> Close notes
						</template>
						<template v-else>
							<b>{{noteCount}}</b> Notes
						</template>
					</button>

					<div
						class="rssSource"
						v-if="isRss"
					>
						<span class="rssLabel"><i class="ph-bold ph-rss"></i> rss</span>
						<a :href="note.url" target="_blank">{{ i18n.ts.originalPost || "Original Post" }} <i class="ph-bold ph-arrow-square-out"></i></a>
					</div>

					<button
						v-if="!isRss"
						v-tooltip.noDelay.bottom="i18n.ts.reply"
						class="button _button"
						@click.stop="reply()"
					>
						<i class="ph-arrow-u-up-left ph-bold ph-lg"></i>
						<template
							v-if="parentNote.repliesCount > 0 && !detailedView"
						>
							<p class="count">{{ parentNote.repliesCount }}</p>
						</template>
					</button>

					<XRenoteButton
						ref="renoteButton"
						class="button"
						:note="appearNote"
						:count="parentNote.renoteCount"
						:detailedView="detailedView"
						:alwaysDirectRenote="isRss"
					/>

					<XStarButton
						v-if="enableEmojiReactions && !isRss"
						ref="starButton"
						class="button"
						:isFull="parentNote.myReaction !== null"
						:note="parentNote"
					/>
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
		</article>
	</div>
	<button
		v-else
		class="muted _button"
		@click="muted.muted = false"
	>
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
	</button>
</template>

<script lang="ts" setup>
import { computed, inject, onMounted, onUnmounted, reactive, ref } from "vue";
import { mainRouter } from "@/router";
import * as mfm from "mfm-js";
import type { Ref } from "vue";
import type * as misskey from "firefish-js";
import MkNoteSub from "@/components/MkNoteSub.vue";
import NoteContent from "./note/NoteContent.vue";
import XNoteHeader from "@/components/MkNoteHeader.vue";
import XNoteSimple from "@/components/MkNoteSimple.vue";
import XMediaList from "@/components/MkMediaList.vue";
import XNoteDetailed from "@/components/MkNoteDetailed.vue";
import XCwButton from "@/components/MkCwButton.vue";
import XPoll from "@/components/MkPoll.vue";
import XRenoteButton from "@/components/MkRenoteButton.vue";
import XReactionsViewer from "@/components/MkReactionsViewer.vue";
import XStarButton from "@/components/MkStarButton.vue";
import XStarButtonNoEmoji from "@/components/MkStarButtonNoEmoji.vue";
import XQuoteButton from "@/components/MkQuoteButton.vue";
import MkUrlPreview from "@/components/MkUrlPreview.vue";
import MkVisibility from "@/components/MkVisibility.vue";
import ReplyView from "./note/ReplyView.vue";
import ReblogIcon from "@/components/icons/reblog.vue";
import copyToClipboard from "@/scripts/copy-to-clipboard";
import { url } from "@/config";
import { pleaseLogin } from "@/scripts/please-login";
import { focusPrev, focusNext } from "@/scripts/focus";
import { getWordSoftMute } from "@/scripts/check-word-mute";
import { useRouter } from "@/router";
import { userPage } from "@/filters/user";
import * as os from "@/os";
import { defaultStore, noteViewInterruptors } from "@/store";
import { reactionPicker } from "@/scripts/reaction-picker";
import { $i } from "@/account";
import { i18n } from "@/i18n";
import { getNoteMenu } from "@/scripts/get-note-menu";
import { useNoteCapture } from "@/scripts/use-note-capture";
import { notePage } from "@/filters/note";
import { deepClone } from "@/scripts/clone";
import { getNoteSummary } from "@/scripts/get-note-summary";

import { getParentNote } from "@/helpers/note/parent";

const router = useRouter();

const props = defineProps<{
	note: misskey.entities.Note;
	pinned?: boolean;
	detailedView?: boolean;
	collapsedReply?: boolean;
	showCloseButton?: boolean;
	hideNotesCounter?: boolean;
	parentKey?: string;
}>();
const emit = defineEmits(['toggle']);

const inChannel = inject("inChannel", null);
let detailedView = $ref(props.detailedView);

let note = $ref(deepClone(props.note));

const getPlainText = (text) => {
	const div = document.createElement("div");
	div.innerHTML = text;
	return div.textContent || div.innerText || "";
}

const extratedUrls = note.text ? getPlainText(note.text).match(/\b((https?|http?):\/\/|(www|ftp)\.)[-A-Z0-9+&@#\/%?=~_|$!:,.;]*[A-Z0-9+&@#\/%=~_|$]/ig) : [];
const urls = $ref( extratedUrls && extratedUrls.length ?
	extratedUrls.filter(
		(item, index) => extratedUrls.indexOf(item) === index
	) :
	[]
);

const softMuteReasonI18nSrc = (what?: string) => {
	if (what === "note") return i18n.ts.userSaysSomethingReason;
	if (what === "reply") return i18n.ts.userSaysSomethingReasonReply;
	if (what === "renote") return i18n.ts.userSaysSomethingReasonRenote;
	if (what === "quote") return i18n.ts.userSaysSomethingReasonQuote;

	// I don't think here is reachable, but just in case
	return i18n.ts.userSaysSomething;
};

// plugin
if (noteViewInterruptors.length > 0) {
	onMounted(async () => {
		let result = deepClone(note);
		for (const interruptor of noteViewInterruptors) {
			result = await interruptor.handler(result);
		}
		note = result;
	});
}

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
const renoteTime = ref<HTMLElement>();
const reactButton = ref<HTMLElement>();
let appearNote = $computed(() =>
	isRenote ? (note.renote as misskey.entities.Note) : note,
);
if(!appearNote.user) {
	console.log(appearNote)
}

let parentNote = $computed(() => getParentNote(note));
const isRss = ref(parentNote.user.fromRSS);

let reactionCount = 0;
for(let reaction in parentNote.reactions) {
	if (! isNaN(parentNote.reactions[reaction] + reactionCount ) ) {
		reactionCount += parentNote.reactions[reaction]
	}
}
let noteCount = ref(0);
noteCount = parentNote.repliesCount + parentNote.renoteCount + reactionCount;


let renotedBy = null;
if (isRenote && note.user) {
	renotedBy = note.user.username;
	if(note.user.host) {
		renotedBy += '@' + note.user.host;
	}
}
const isMyRenote = $i && $i.id === note.userId;
const showContent = ref(false);
const isDeleted = ref(false);
const muted = ref(getWordSoftMute(note, $i, defaultStore.state.mutedWords));
const translation = ref(null);
const translating = ref(false);
const enableEmojiReactions = defaultStore.state.enableEmojiReactions;
const expandOnNoteClick = defaultStore.state.expandOnNoteClick;

const keymap = {
	r: () => reply(true),
	"e|a|plus": () => react(true),
	"up|k": focusBefore,
	"down|j": focusAfter,
	esc: blur,
	"m|o": () => menu(true),
	s: () => showContent.value !== showContent.value,
};

useNoteCapture({
	rootEl: el,
	note: $$(appearNote),
	isDeletedRef: isDeleted,
});

function reply(viaKeyboard = false): void {
	pleaseLogin();
	window.location.hash="replyTo="+appearNote.id;
	if(props.showCloseButton) {
		document.getElementById(appearNote.id).parentElement.querySelector('.tiptap').focus();
	} else {
		noteClick()
		setTimeout( () => {
			document.getElementById(appearNote.id).parentElement.querySelector('.tiptap').focus();
		},500);
	}
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

function onContextmenu(ev: MouseEvent): void {
	const isLink = (el: HTMLElement) => {
		if (el.tagName === "A") return true;
		// The Audio element's context menu is the browser default, such as for selecting playback speed.
		if (el.tagName === "AUDIO") return true;
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
				appearNote.user.host != null
					? {
							type: "a",
							icon: "ph-arrow-square-up-right ph-bold ph-lg",
							text: i18n.ts.showOnRemote,
							href: appearNote.url ?? appearNote.uri ?? "",
							target: "_blank",
					  }
					: undefined,
			],
			ev,
		);
	}
}

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

function showRenoteMenu(viaKeyboard = false): void {
	if (!isMyRenote) return;
	os.popupMenu(
		[
			{
				text: i18n.ts.unrenote,
				icon: "ph-trash ph-bold ph-lg",
				danger: true,
				action: () => {
					os.api("notes/delete", {
						noteId: note.id,
					});
					isDeleted.value = true;
				},
			},
		],
		renoteTime.value,
		{
			viaKeyboard: viaKeyboard,
		},
	);
}

function focus() {
	el.value.focus();
}

function blur() {
	el.value.blur();
}

function focusBefore() {
	focusPrev(el.value);
}

function focusAfter() {
	focusNext(el.value);
}

function scrollIntoView() {
	if(el && el.value) el.value.scrollIntoView();
}

function noteLink(e) {
	router.push(notePage(appearNote));
}

function noteClick(e) {
	emit('toggle', props.parentKey)
}

function readPromo() {
	os.api("promo/read", {
		noteId: appearNote.id,
	});
	isDeleted.value = true;
}

let postIsExpanded = ref(false);

function setPostExpanded(val: boolean) {
	postIsExpanded.value = val;
}

const accessibleLabel = computed(() => {
	let label = `${appearNote.user.username}; `;
	if (appearNote.renote) {
		label += `${i18n.t("renoted")} ${appearNote.renote.user.username}; `;
		if (appearNote.renote.cw) {
			label += `${i18n.t("cw")}: ${appearNote.renote.cw}; `;
			if (postIsExpanded.value) {
				label += `${appearNote.renote.text}; `;
			}
		} else {
			label += `${appearNote.renote.text}; `;
		}
	} else {
		if (appearNote.cw) {
			label += `${i18n.t("cw")}: ${appearNote.cw}; `;
			if (postIsExpanded.value) {
				label += `${appearNote.text}; `;
			}
		} else {
			label += `${appearNote.text}; `;
		}
	}
	const date = new Date(appearNote.createdAt);
	label += `${date.toLocaleTimeString()}`;
	return label;
});

defineExpose({
	focus,
	blur,
	scrollIntoView,
});
</script>

<style lang="scss" scoped>
.tkcbzcuz {
	position: relative;
	transition: box-shadow 0.1s ease;
	font-size: 1.05em;
	overflow: clip;
	contain: content;
	-webkit-tap-highlight-color: transparent;

	&[data-visibility="specified"] {
		background-image: linear-gradient(to bottom, #f8b3b3, #f9c6d3, #f6daeb, #f6edf9, #ffffff, #ffffff, #ffffff);
	}

	&[data-visibility="followers"] {
		 background-image: linear-gradient(to bottom, #f8f5b3, #ffecca, #ffeeed, #fff7ff, #ffffff);
	}

	&[data-visibility="home"] {
		 background-image: linear-gradient(to bottom, var(--X10), #efefef, #ffffff, #fff7ff, #ffffff);
	}

	&:focus-visible {
		outline: none;

		&:after {
			content: "";
			pointer-events: none;
			display: block;
			position: absolute;
			z-index: 10;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			margin: auto;
			width: calc(100% - 8px);
			height: calc(100% - 8px);
			border: solid 1px var(--focus);
			border-radius: var(--radius);
			box-sizing: border-box;
		}
	}

	& > .article > .main {
		&:hover,
		&:focus-within {
			:deep(.footer .button) {
				opacity: 1;
			}
		}
	}

	> .reply-to {
		& + .note-context {
			.line::before {
				content: "";
				display: block;
				margin-bottom: -4px;
				margin-top: 16px;
				border-left: 2px solid currentColor;
				margin-left: calc((var(--avatarSize) / 2) - 1px);
				opacity: 0.25;
			}
		}
	}

	.note-context {
		position: relative;
		display: flex;
		z-index: 1;
		&:first-child {
			margin-top: 20px;
		}
		> :not(.line) {
			width: 0;
			flex-grow: 1;
			position: relative;
			line-height: 28px;
		}
		> .line {
			position: relative;
			z-index: 2;
			width: var(--avatarSize);
			display: flex;
			margin-right: 14px;
			margin-top: 0;
			flex-grow: 0;
			pointer-events: none;
		}

		> div > i {
			margin-left: -0.5px;
		}
		> .info {
			display: flex;
			align-items: center;
			font-size: 90%;
			white-space: pre;
			color: #f6c177;

			> i {
				margin-right: 4px;
			}

			> .hide {
				margin-left: auto;
				color: inherit;
			}
		}

		> .renote {
			display: flex;
			align-items: center;
			white-space: pre;
			color: var(--renote);
			cursor: pointer;

			> i {
				margin-right: 4px;
			}

			> span {
				overflow: hidden;
				flex-shrink: 1;
				text-overflow: ellipsis;
				white-space: nowrap;

				> .name {
					font-weight: bold;
				}
			}

			> .info {
				margin-left: auto;
				font-size: 0.9em;
				display: flex;

				> .time {
					flex-shrink: 0;
					color: inherit;
					display: inline-flex;
					align-items: center;
					> .dropdownIcon {
						margin-right: 4px;
					}
				}
			}
		}

		&.collapsedReply {
			.line {
				opacity: 0.25;
				&::after {
					content: "";
					position: absolute;
					border-left: 2px solid currentColor;
					border-top: 2px solid currentColor;
					margin-left: calc(var(--avatarSize) / 2 - 1px);
					width: calc(var(--avatarSize) / 2 + 14px);
					border-top-left-radius: calc(var(--avatarSize) / 4);
					top: calc(50% - 1px);
					height: calc(50% + 5px);
				}
			}
			.info {
				color: var(--fgTransparentWeak);
				transition: color 0.2s;
			}
			.avatar {
				width: 1.2em;
				height: 1.2em;
				border-radius: 2em;
				overflow: hidden;
				margin-right: 0.4em;
				background: var(--panelHighlight);
			}
			.username {
				font-weight: 700;
				flex-shrink: 0;
				max-width: 30%;
				&::after {
					content: ": ";
				}
			}
			&:hover,
			&:focus-within {
				.info {
					color: var(--fg);
				}
			}
		}
	}

	> .article {
		position: relative;
		overflow: clip;
		padding: 20px 0px 10px;
		margin-top: -16px;

		&:first-child,
		&:nth-child(2) {
			margin-top: -100px;
			padding-top: 104px;
		}

		@media (pointer: coarse) {
			cursor: default;
		}

		.header-container {
			display: flex;
			position: relative;
			z-index: 2;
			padding: 0 32px 16px;
			cursor: pointer;

			border-bottom: 0.5px solid var(--accent);

			> .avatar {
				flex-shrink: 0;
				display: block;
				margin: 0 14px 0 0;
				width: var(--avatarSize);
				height: var(--avatarSize);
				position: relative;
				top: 0;
				left: 0;
			}
			> .header {
				width: 0;
				flex-grow: 1;
			}
		}
		> .main {
			flex: 1;
			min-width: 0;

			> .body {
				margin-top: 0.7em;
				> .translation {
					border: solid 0.5px var(--divider);
					border-radius: var(--radius);
					padding: 12px;
					margin-top: 8px;
				}
				> .renote {
					padding-top: 8px;
					> * {
						padding: 16px 0;
						border: 0px;
						border-bottom: solid 1px var(--renote);
						border-radius: 0px;
						transition: background 0.2s;
						&:hover,
						&:focus-within {
							background-color: var(--panelHighlight);
						}
					}
				}
			}
			> .info {
				padding: 0 32px;
				display: flex;
				justify-content: space-between;
				flex-wrap: wrap;
				gap: 0.7em;
				margin-top: 16px;
				opacity: 0.7;
				font-size: 0.9em;
			}
			> .footer {
				position: relative;
				z-index: 2;
				display: flex;
				flex-wrap: wrap;
				margin: 8px 16px 8px;
				justify-content: flex-end;

				@media (max-width: 500px) {
					margin: 8px 4px 8px;
				}

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

					&.rssSource {
						margin-right: auto;
						padding: 0 16px;
						border-radius: 32px;
						margin-left: 0;
					}

					&.noteCount {
						margin-right: auto;
						padding: 0 16px;
						border-radius: 32px;
						margin-left: 0;

						transition:
							background 0.3s ease,
							color 0.3s ease;

						@media (max-width: 500px) {
							padding: 0 0;
						}

						&:hover {
							background: var(--navHoverFg);
							color: var(--navFg);
						}
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

	> .reply {
		border-top: solid 0.5px var(--divider);
	}

	&.max-width_500px {
		font-size: 0.975em;
		--avatarSize: 46px;
		padding-top: 6px;
		> .note-context {
			padding-inline: 16px;
			margin-top: 8px;
			> :not(.line) {
				margin-top: 0px;
			}
			> .line {
				margin-right: 10px;
				&::before {
					margin-top: 8px;
				}
			}
		}
		> .article {
			padding: 18px 4px 8px;
			&:first-child,
			&:nth-child(2) {
				padding-top: 104px;
			}
			.header-container {
				padding: 0 4px 16px;
			}

			> .main > .header-container > .avatar {
				margin-right: 10px;
			}
		}
	}

	&.max-width_300px {
		--avatarSize: 40px;
	}
}

.renoteHeader {
	display: flex;
	color: #555;
	padding: 0 32px 8px;
  margin-top: 0;
  border-bottom: 0.5px dotted var(--fgTransparent);
  margin-bottom: 8px;
	font-size: 12px;

	a {
		display: flex;
		height: 16px;
		align-items: center;
	}

  time {
  	font-size: 10px;
  }

  svg {
  	margin: 0 8px;
		fill: #555;
		width: 10px;
  }
}

.muted {
	padding: 8px;
	text-align: center;
	opacity: 0.7;
	width: 100%;

	._blur_text {
		pointer-events: auto;
	}
	&:active ._blur_text {
		filter: blur(0px);
	}
}

.previews {
	padding: 0 32px;
	border-top: .5px dashed var(--panelHeaderFg);
	border-bottom: .5px dashed var(--panelHeaderFg);

	> * {
		margin: 8px 0;
	}
}

.noteCount {
	margin-right: auto;
	margin-left: 8px;
}

.rssSource {
	margin-right: auto;
	margin-left: 8px;
	display: flex;
	font-size: 0.95em;
	align-items: center;

	.rssLabel {
		margin-right: 16px;
		color: var(--acrylicBg);
	}

	a {
		color: var(--accentDarken);
	}
}
</style>
