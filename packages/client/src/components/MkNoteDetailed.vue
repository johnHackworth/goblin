<template>
	<div
		v-if="!muted.muted"
		v-show="!isDeleted"
		ref="el"
		v-hotkey="keymap"
		v-size="{ max: [500, 350, 300] }"
		class="lxwezrsl _block"
		:tabindex="!isDeleted ? '-1' : null"
		:class="{ renote: isRenote, isClosed: props.hideTabs }"
	>
		<MkUserCardMini
			v-if="tab === 'renotes' && renotes"
			v-for="item in renotes"
			:key="item.user.id"
			:user="item.user"
			:with-chart="false"
		/>

		<MkNoteSub
			v-if="conversation"
			v-for="note in conversation"
			:key="note.id"
			class="reply-to"
			:note="note"
			:detailedView="true"
		/>
		<MkLoading v-else-if="note.reply" mini />
		<MkNoteSub
			v-if="note.reply"
			:note="note.reply"
			class="reply-to"
			:detailedView="true"
		/>
		<MkNote
			ref="noteEl"
			tabindex="-1"
			:note="note"
			detailedView
			@toggle="toggle"
			:hideNotesCounter="!props.showNotesCounter"
			:showCloseButton="!props.hideTabs"
		></MkNote>
		<div class="bottomSection" v-if="!hideTabs">
			<div class="separator" />
			<MkTab v-model="tab" :style="'underline'" @update:modelValue="loadTab">
				<option value="replies">
						<span v-if="repliesCount > 0" class="count">{{
						repliesCount
					}}</span>
					{{ i18n.ts._notification._types.reply }}
				</option>
				<option value="renotes" v-if="renoteCount > 0">
					 <i class="ph-repeat ph-bold ph-lg"></i>
					<span class="count">{{ renoteCount }}</span>
					Reblogs
				</option>
				<option value="reactions" v-if="reactionsCount > 0">
					<i class="ph-smiley ph-bold ph-lg"></i>
					<span class="count">{{ reactionsCount }}</span>
					{{ i18n.ts.reaction }}
				</option>
				<option value="quotes" v-if="directQuotes?.length > 0">
					<i class="ph-quotes ph-bold ph-lg"></i>
					<span class="count">{{ directQuotes.length }}</span>
					{{ i18n.ts._notification._types.quote }}
				</option>
			</MkTab>

			<div class="editor" v-if="tab === 'replies'"	>
				<XPostForm
					class="post-form _block"
					:reply="noteToReplyTo"
					@posted="onPosted"
					fixed
					isReply
				/>
			</div>
			<MkNoteSub
				v-if="directReplies && tab === 'replies'"
				v-for="note in directReplies"
				:key="note.id"
				:note="note"
				class="reply"
				:conversation="replies"
				:detailedView="true"
				:parentId="note.id"
			/>
			<MkLoading v-else-if="tab === 'replies' && repliesCount > 0" />

			<MkNoteSub
				v-if="directQuotes && tab === 'quotes'"
				v-for="note in directQuotes"
				:key="note.id"
				:note="note"
				class="reply"
				:conversation="replies"
				:detailedView="true"
				:parentId="note.id"
			/>
			<MkLoading v-else-if="tab === 'quotes' && directQuotes.length > 0" />

			<MkPagination
				v-if="tab === 'renotes'"
				v-slot="{ items }"
				ref="pagingComponent"
				:pagination="pagination"
				class="reblogs"
			>
				<div
					v-for="(reblog, i) in items"
					:key="`reblog-$(i)`">
					<div v-if="reblog.text === null" class="rebloggedBy">
							<img :src="reblog.user.avatarUrl" />
							<a :href="'/' + (reblog.user.host ?
								reblog.user.username + '@' + reblog.user.host :
								reblog.user.username)">
								@{{ reblog.user.host ?
								reblog.user.username + '@' + reblog.user.host :
								reblog.user.username }}
							</a>
					</div>
				</div>

			</MkPagination>
			<MkLoading v-else-if="tab === 'renotes' && renoteCount > 0" />

			<MkReactedUsers
				v-if="tab === 'reactions' && reactionsCount > 0"
				:note-id="note.id"
			></MkReactedUsers>
		</div>
	</div>
	<div v-else class="_panel muted" @click="muted.muted = false">
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
import {
	computed,
	inject,
	onMounted,
	onUnmounted,
	onUpdated,
	reactive,
	ref,
} from "vue";
import * as misskey from "firefish-js";
import MkTab from "@/components/MkTab.vue";
import MkNote from "@/components/MkNote.vue";
import MkNoteSub from "@/components/MkNoteSub.vue";
import XStarButton from "@/components/MkStarButton.vue";
import XRenoteButton from "@/components/MkRenoteButton.vue";
import MkPagination from "@/components/MkPagination.vue";
import MkUserCardMini from "@/components/MkUserCardMini.vue";
import MkReactedUsers from "@/components/MkReactedUsers.vue";
import { pleaseLogin } from "@/scripts/please-login";
import { getWordSoftMute } from "@/scripts/check-word-mute";
import { userPage } from "@/filters/user";
import * as os from "@/os";
import { defaultStore, noteViewInterruptors } from "@/store";
import { reactionPicker } from "@/scripts/reaction-picker";
import { $i } from "@/account";
import { i18n } from "@/i18n";
import { getNoteMenu } from "@/scripts/get-note-menu";
import { useNoteCapture } from "@/scripts/use-note-capture";
import { deepClone } from "@/scripts/clone";
import { stream } from "@/stream";
import { NoteUpdatedEvent } from "firefish-js/built/streaming.types";
import appear from "@/directives/appear";

import XPostForm from "@/components/MkPostForm.vue";

const props = defineProps<{
	key?: string;
	parentKey?: string;
	note: misskey.entities.Note;
	pinned?: boolean;
	hideTabs?: boolean;
	showCloseButton?: boolean;
	showNotesCounter?: boolean;
}>();

let tab = $ref("replies");

let note = $ref(deepClone(props.note));

const emit = defineEmits(['toggle']);

const toggle = (noteId) => {
	emit('toggle', props.parentKey);
}

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

const el = ref<HTMLElement>();
const noteEl = $ref();
const menuButton = ref<HTMLElement>();
const renoteButton = ref<InstanceType<typeof XRenoteButton>>();
const reactButton = ref<HTMLElement>();
const showContent = ref(false);
const isDeleted = ref(false);
const muted = ref(getWordSoftMute(note, $i, defaultStore.state.mutedWords));
const translation = ref(null);
const translating = ref(false);
let conversation = $ref<null | misskey.entities.Note[]>([]);
const replies = ref<misskey.entities.Note[]>([]);
let directReplies = $ref<null | misskey.entities.Note[]>([]);
let directQuotes = $ref<null | misskey.entities.Note[]>([]);
let clips = $ref();
let renotes = $ref();
let isScrolling;

let rootNote = $ref<misskye.entities.Note>();
let noteToReplyTo = $ref<misskye.entities.Note>();

if(note.reply) {
	rootNote = note.reply;
} else if (note.renote) {
	rootNote = note.renote;
} else {
	rootNote = note;
}
noteToReplyTo = rootNote


let repliesCount = $ref(rootNote.repliesCount);
let renoteCount = $ref(rootNote.renoteCount);

const reactionsCount = Object.values(props.note.reactions).reduce(
	(x, y) => x + y,
	0,
);

const keymap = {
	r: () => reply(true),
	"e|a|plus": () => react(true),
	q: () => renoteButton.value.renote(true),
	esc: blur,
	"m|o": () => menu(true),
	s: () => showContent.value !== showContent.value,
};

useNoteCapture({
	rootEl: el,
	note: $$(note),
	isDeletedRef: isDeleted,
});

function reply(viaKeyboard = false): void {
	pleaseLogin();
	document.querySelector('.tiptap').focus();
}

function react(viaKeyboard = false): void {
	pleaseLogin();
	blur();
	reactionPicker.show(
		reactButton.value,
		(reaction) => {
			os.api("notes/reactions/create", {
				noteId: note.id,
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
			getNoteMenu({
				note: note,
				translating,
				translation,
				menuButton,
				isDeleted,
			}),
			ev,
		).then(focus);
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
		}),
		menuButton.value,
		{
			viaKeyboard,
		},
	).then(focus);
}

function focus() {
	noteEl.focus();
}

function blur() {
	noteEl.blur();
}

directReplies = null;
const onPosted = () => {
	repliesCount++;
	updateNoteChildren();
}

const updateNoteChildren = () => {
	os.api("notes/children", {
		noteId: note.reply? note.reply.id : note.renote ? note.renote.id : note.id,
		limit: 30,
		depth: 12,
	}).then((res) => {
		res = res.reduce((acc, resNote) => {
			if (resNote.userId == note.userId) {
				return [...acc, resNote];
			}
			return [resNote, ...acc];
		}, []);
		replies.value = res;
		directReplies = res
			.filter( (note) => !!note.replyId )
			.reverse();
		directQuotes = res.filter( (note) => !!note.renoteId );
	});
}


updateNoteChildren();

conversation = null;
if (note.replyId) {
	os.api("notes/conversation", {
		noteId: note.replyId,
		limit: 30,
	}).then((res) => {
		conversation = res.reverse();
		focus();
	});
}

const pagination = {
	endpoint: "notes/renotes",
	params: {
		noteId: note.id,
		limit: 10,
	}
};

const pagingComponent = $ref<InstanceType<typeof MkPagination>>();

renotes = null;
function loadTab() {
	if (tab === "renotes" && !renotes) {
		os.api("notes/renotes", {
			noteId: note.id,
			limit: 100,
		}).then((res) => {
			renotes = res;
		});
	}
}

async function onNoteUpdated(noteData: NoteUpdatedEvent): Promise<void> {
	const { type, id, body } = noteData;
	const relevantNoteId = note.reply ? note.reply.id : note.renote ? note.renote.id : note.id;
	let found = -1;
	if (id === relevantNoteId ) {
		found = 0;
	} else {
		for (let i = 0; i < replies.value.length; i++) {
			const reply = replies.value[i];
			if (reply.id === id) {
				found = i + 1;
				break;
			}
		}
	}

	if (found === -1) {
		return;
	}

	switch (type) {
		case "replied":
			const { id: createdId } = body;
			const replyNote = await os.api("notes/show", {
				noteId: createdId,
			});

			replies.value.splice(found, 0, replyNote);
			if (found === 0) {
				directReplies.push(replyNote);
			}
			break;

		case "deleted":
			if (found === 0) {
				isDeleted.value = true;
			} else {
				replies.value.splice(found - 1, 1);
			}
			break;
	}
}

document.addEventListener("wheel", () => {
	isScrolling = true;
});

onMounted(() => {
	stream.on("noteUpdated", onNoteUpdated);
	isScrolling = false;
	noteEl.scrollIntoView();
});

onUpdated(() => {
	if (!isScrolling) {
		noteEl.scrollIntoView();
		if (location.hash) {
			location.replace(location.hash); // Jump to highlighted reply
		}
	}
});

onUnmounted(() => {
	stream.off("noteUpdated", onNoteUpdated);
});
</script>

<style lang="scss" scoped>
.lxwezrsl {
	font-size: 1.05em;
	position: relative;
	transition: box-shadow 0.1s ease;
	contain: content;

	&.isClosed {
		padding-bottom: 16px;
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

			&.max-width_500px {
				border-radius: 3px;
			}
		}
	}

	> .reply-to {
		margin-bottom: -16px;
		padding-bottom: 16px;
	}

	> :deep(.note-container) {
		padding-block: 28px 0;
		padding-top: 12px;
		font-size: 1.1rem;
		overflow: clip;
		outline: none;
		scroll-margin-top: calc(var(--stickyTop) + 20vh);
		&:not(:last-child) {
			border-bottom: 1px solid var(--divider);
			margin-bottom: 4px;
		}
		.article {
			cursor: unset;
			padding-bottom: 0;
		}
		&:first-child {
			padding-top: 28px;
		}
	}

	> :deep(.chips) {
		padding-block: 6px 12px;
		padding-left: 32px;
		&:last-child {
			margin-bottom: 12px;
		}
	}
	> :deep(.user-card-mini),
	> :deep(.reacted-users > *) {
		padding-inline: 32px;
		border-top: 1px solid var(--divider);
		border-radius: 0;
	}
	> :deep(.reacted-users > div) {
		padding-block: 12px;
	}

	> .reply {
		border-top: solid 0.5px var(--divider);
		padding-top: 24px;
		padding-bottom: 10px;
	}

	// Hover
	:deep(.reply > .main),
	.reply-to,
	:deep(.more) {
		position: relative;
		&::before {
			content: "";
			position: absolute;
			inset: -12px -24px;
			bottom: -0px;
			background: var(--panelHighlight);
			border-radius: var(--radius);
			opacity: 0;
			transition:
				opacity 0.2s,
				background 0.2s;
			z-index: -1;
		}
		&.reply-to {
			&::before {
				inset: 0px 8px;
			}
			&:not(.max-width_500px)::before {
				bottom: 16px;
			}
			&:first-of-type::before {
				top: 12px;
			}
			&.reply.max-width_500px:first-of-type::before {
				top: 4px;
			}
		}
		// &::after {
		// 	content: "";
		// 	position: absolute;
		// 	inset: -9999px;
		// 	background: var(--modalBg);
		// 	opacity: 0;
		// 	z-index: -2;
		// 	pointer-events: none;
		// 	transition: opacity .2s;
		// }
		&.more::before {
			inset: 0 !important;
		}
		&:hover,
		&:focus-within {
			--panel: var(--panelHighlight);
			&::before {
				opacity: 1;
				background: var(--panelHighlight) !important;
			}
		}
		// @media (pointer: coarse) {
		// 	&:has(.button:focus-within) {
		// 		z-index: 2;
		// 		--X13: transparent;
		// 		&::after {
		// 			opacity: 1;
		// 			backdrop-filter: var(--modalBgFilter);
		// 		}
		// 	}
		// }
	}
	:deep(.reply:target > .main),
	:deep(.reply-to:target) {
		z-index: 2;
		&::before {
			outline: auto;
			opacity: 1;
			background: none;
		}
	}
	&.max-width_500px {
		font-size: 0.975em;
		> .reply-to {
			&::before {
				inset-inline: -24px;
			}
			&:first-child {
				padding-top: 14px;
				&::before {
					top: -24px;
				}
			}
		}

		> :deep(.note-container) {
			padding: 12px 0 0 0;
			font-size: 1.05rem;
			> .header > .body {
				padding-left: 10px;
			}
		}
		> .clips,
		> :deep(.user-card-mini),
		> :deep(.reacted-users > *) {
			padding-inline: 16px !important;
		}
		> :deep(.underline) {
			padding-left: 16px !important;
		}
	}

	&.max-width_300px {
		font-size: 0.825em;
	}
}

.muted {
	padding: 8px;
	text-align: center;
	opacity: 0.7;
}

.clips {
	// want to redesign at some point
	padding: 24px 32px;
	padding-top: 0;
	> .item {
		display: block;
		padding: 16px;
		// background: var(--buttonBg);
		border: 1px solid var(--divider);
		margin-bottom: var(--margin);
		transition: background 0.2s;
		&:hover,
		&:focus-within {
			background: var(--panelHighlight);
		}

		> .description {
			padding: 8px 0;
		}

		> .user {
			$height: 32px;
			padding-top: 16px;
			border-top: solid 0.5px var(--divider);
			line-height: $height;

			> .avatar {
				width: $height;
				height: $height;
			}
		}
	}
}

.reblogs {
	padding: 24px;

	.rebloggedBy {
		display: flex;
		font-weight: bold;
		margin-bottom: 8px;

		img {
			width: 32px;
			height: 32px;
			margin-right: 16px;
		}
	}
}

.separator {
	width: 100%;
	height: 1px;
	background: rgb(2,0,36);
	background: linear-gradient(90deg, rgba(2,0,36,1) 0%, rgba(19,55,73,1) 49%, rgba(28,66,36,1) 62%, rgba(146,161,23,1) 76%, rgba(255,255,255,1) 100%);
	opacity: 0.5;
}
</style>
