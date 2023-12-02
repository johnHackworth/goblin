<template>
	<section
		v-size="{ max: [310, 500] }"
		class="gafaadew"
		:class="{ modal, _popup: modal }"
		:aria-label="i18n.ts._pages.blocks.post"
		@dragover.stop="onDragover"
		@dragenter="onDragenter"
		@dragleave="onDragleave"
		@drop.stop="onDrop"
	>
		<header>
			<button
				v-if="$props.editId == null"
				v-click-anime
				v-tooltip="i18n.ts.switchAccount"
				class="account _button"
				@click="openAccountMenu"
			>
				<span class="username">{{ postAccount ? postAccount.username : $i.username }} </span><Caret />
			</button>
			<span v-if="$props.renote" class="reblog-header">
				<Reblog /> <span class="reblog-username">{{ $props.renote.user.username }}</span>
			</span>
			<div class="right">
				<span v-if="localOnly" class="local-only"
					><i class="ph-hand-fist ph-bold ph-lg"></i
				></span>
				<button
					ref="visibilityButton"
					v-tooltip="i18n.ts.visibility"
					class="_button visibility"
					:disabled="channel != null"
					@click="setVisibility"
				>
					<span v-if="visibility === 'public'"
						><i class="ph-planet ph-bold ph-lg"></i
					></span>
					<span v-if="visibility === 'home'"
						><i class="ph-house ph-bold ph-lg"></i
					></span>
					<span v-if="visibility === 'followers'"
						><i class="ph-lock ph-bold ph-lg"></i
					></span>
					<span v-if="visibility === 'specified'"
						><i class="ph-envelope-simple-open ph-bold ph-lg"></i
					></span>
				</button>
				<button v-if="!fixed" class="cancel _button" @click="cancel">
					<i class="ph-x ph-bold ph-lg" :aria-label="i18n.t('close')"></i>
				</button>
			</div>
		</header>
		<div class="form" :class="{ fixed }">
			<div v-for="(trailNote, index) in reblogtrail" :key="index">
    		<div class="reblog">
      		<ReblogItem :note="trailNote" />
    		</div>
  		</div>

			<div v-if="visibility === 'specified'" class="to-specified">
				<span style="margin-right: 8px">{{ i18n.ts.recipient }}</span>
				<div class="visibleUsers">
					<span v-for="u in visibleUsers" :key="u.id">
						<MkAcct :user="u" />
						<button
							class="_button"
							@click="removeVisibleUser(u)"
							:aria-label="i18n.t('removeRecipient')"
						>
							<i class="ph-x ph-bold ph-lg"></i>
						</button>
					</span>
					<button class="_button" @click="addVisibleUser">
						<i class="ph-plus ph-bold ph-md ph-fw ph-lg"></i>
					</button>
				</div>
			</div>
			<MkInfo
				v-if="hasNotSpecifiedMentions"
				warn
				class="hasNotSpecifiedMentions"
				>{{ i18n.ts.notSpecifiedMentionWarning }} -
				<button class="_textButton" @click="addMissingMention()">
					{{ i18n.ts.add }}
				</button></MkInfo
			>
			<input
				v-show="useCw"
				ref="cwInputEl"
				v-model="cw"
				class="cw"
				placeholder="Add your content warning here"
				@keydown="onKeydown"
			/>
			<Tiptap
				@update="updateTiptap"
				@updateTags="updateTiptapTags"
				@post="onEditorPostClick"
				@addedImage="onEditorImageAdd"
				ref="textareaEl"
				v-model="text"
				class="text"
				:class="{ withCw: useCw }"
				:placeholder="placeholder"
				data-cy-post-form-text
				@keydown="onKeydown"
				@enableContentWarning="enableContentWarning"
				:submitText="submitText"
				:canPost="canPost"
				:upload="upload"
				:reply="!!props.reply"
				:renote="!!props.renote"
				:initialTags="props.initialNote ? props.initialNote.tags : []"
				:initialText="props.initialNote ? removeTagsFromTextContent(props.initialNote.text) : ''"
			/>
			<XPollEditor v-if="poll" v-model="poll" @destroyed="poll = null" />
			<XNotePreview v-if="showPreview" class="preview" :text="text" />
		</div>
	</section>
</template>

<script lang="ts" setup>
import { inject, watch, nextTick, onMounted, defineAsyncComponent } from "vue";
import Tiptap from '@/components/editor/index.vue'
import * as mfm from "mfm-js";
import * as misskey from "firefish-js";
import insertTextAtCursor from "insert-text-at-cursor";
import { length } from "stringz";
import { toASCII } from "punycode/";
import * as Acct from "firefish-js/built/acct";
import { throttle } from "throttle-debounce";
import XNoteSimple from "@/components/MkNoteSimple.vue";
import XNotePreview from "@/components/MkNotePreview.vue";
import XPostFormAttaches from "@/components/MkPostFormAttaches.vue";
import XPollEditor from "@/components/MkPollEditor.vue";
import ReblogItem from "@/components/note/ReblogItem.vue";
import Caret from "@/components/icons/caret.vue";
import Reblog from "@/components/icons/reblog.vue";

import { host, url } from "@/config";
import { erase, unique } from "@/scripts/array";
import { extractMentions } from "@/scripts/extract-mentions";
import { formatTimeString } from "@/scripts/format-time-string";
import { Autocomplete } from "@/scripts/autocomplete";
import * as os from "@/os";
import { stream } from "@/stream";
import { selectFiles } from "@/scripts/select-file";
import { defaultStore, notePostInterruptors, postFormActions } from "@/store";
import MkInfo from "@/components/MkInfo.vue";
import { i18n } from "@/i18n";
import { instance } from "@/instance";
import {
	$i,
	getAccounts,
	openAccountMenu as openAccountMenu_,
} from "@/account";
import { uploadFile } from "@/scripts/upload";
import { deepClone } from "@/scripts/clone";
import XCheatSheet from "@/components/MkCheatSheetDialog.vue";
import { preprocess } from "@/scripts/preprocess";

const removeTagsFromTextContent = ( content ) => {
	return content.split('<!-- tags -->')[0]
}

const modal = inject("modal");

const props = withDefaults(
	defineProps<{
		reply?: misskey.entities.Note;
		renote?: misskey.entities.Note;
		reblogtrail?: misskey.entities.Note[];
		channel?: any; // TODO
		mention?: misskey.entities.User;
		specified?: misskey.entities.User;
		initialText?: string;
		initialVisibility?: typeof misskey.noteVisibilities;
		initialFiles?: misskey.entities.DriveFile[];
		initialLocalOnly?: boolean;
		initialVisibleUsers?: misskey.entities.User[];
		initialNote?: misskey.entities.Note;
		instant?: boolean;
		fixed?: boolean;
		autofocus?: boolean;
		showMfmCheatSheet?: boolean;
		editId?: misskey.entities.Note["id"];
	}>(),
	{
		initialVisibleUsers: () => [],
		autofocus: true,
		showMfmCheatSheet: true,
	},
);

console.log(props);

const emit = defineEmits<{
	(ev: "posted"): void;
	(ev: "cancel"): void;
	(ev: "esc"): void;
}>();

const textareaEl = $ref<HTMLTextAreaElement | null>(null);
const cwInputEl = $ref<HTMLInputElement | null>(null);
const hashtagsInputEl = $ref<HTMLInputElement | null>(null);
const visibilityButton = $ref<HTMLElement | null>(null);

let posting = $ref(false);
let text = $ref(props.initialText ?? "");
let tags = $ref(props.initialTags ?? []);
let files = $ref(props.initialFiles ?? []);
let reblogtrail = $ref(props.renote?.reblogtrail?.length ? props.renote.reblogtrail : []);
if(props.renote) {
	let cloneNote = deepClone(props.renote);
	delete cloneNote.reblogtrail;
	cloneNote.text = removeTagsFromTextContent(cloneNote.text);
	reblogtrail.push(cloneNote);
}

let poll = $ref<{
	choices: string[];
	multiple: boolean;
	expiresAt: string | null;
	expiredAfter: string | null;
} | null>(null);
let useCw = $ref(false);
let showPreview = $ref(false);
let cw = $ref<string | null>(null);
let localOnly = $ref<boolean>(
	props.initialLocalOnly ?? defaultStore.state.rememberNoteVisibility
		? defaultStore.state.localOnly
		: defaultStore.state.defaultNoteLocalOnly,
);
let isEditorEmpty = $ref(true);
let visibility = $ref(
	props.initialVisibility ??
		((defaultStore.state.rememberNoteVisibility
			? defaultStore.state.visibility
			: defaultStore.state
					.defaultNoteVisibility) as (typeof misskey.noteVisibilities)[number]),
);
let visibleUsers = $ref([]);
if (props.initialVisibleUsers) {
	props.initialVisibleUsers.forEach(pushVisibleUser);
}
let autocomplete = $ref(null);
let draghover = $ref(false);
let quoteId = $ref(null);
let hasNotSpecifiedMentions = $ref(false);
let canPost = $ref(false);
let recentHashtags = $ref(JSON.parse(localStorage.getItem("hashtags") || "[]"));
let imeText = $ref("");

const draftKey = $computed((): string => {
	if (props.editId) {
		return `edit:${props.editId}`;
	}

	let key = props.channel ? `channel:${props.channel.id}` : "";

	if (props.renote) {
		key += `renote:${props.renote.id}`;
	} else if (props.reply) {
		key += `reply:${props.reply.id}`;
	} else {
		key += "note";
	}

	return key;
});

const enableContentWarning = () => {
	useCw = true;
}

const placeholder = $computed((): string => {
	if (props.renote) {
		return i18n.ts._postForm.quotePlaceholder;
	} else if (props.reply) {
		return i18n.ts._postForm.replyPlaceholder;
	} else if (props.channel) {
		return i18n.ts._postForm.channelPlaceholder;
	} else {
		const xs = [
			i18n.ts._postForm._placeholders.a,
			i18n.ts._postForm._placeholders.b,
			i18n.ts._postForm._placeholders.c,
			i18n.ts._postForm._placeholders.d,
			i18n.ts._postForm._placeholders.e,
			i18n.ts._postForm._placeholders.f,
		];
		return xs[Math.floor(Math.random() * xs.length)];
	}
});

const computedText = $computed((): string => {
	return props.editId
		? i18n.ts.edit
		: props.renote
		? i18n.ts.quote
		: props.reply
		? i18n.ts.reply
		: i18n.ts.note;
});

const submitText = $ref(computedText);
const textLength = $computed((): number => {
	return length((preprocess(text) + imeText).trim());
});

const maxTextLength = $computed((): number => {
	return instance ? instance.maxNoteTextLength : 3000;
});

const computedCanPost = $computed((): boolean => {
	console.log('computing can post)')
	return (
		!posting &&
		!isEditorEmpty &&
		(!poll || poll.choices.length >= 2)
	);
});

watch($$(computedCanPost), () => {
	canPost = computedCanPost;
} )

const withHashtags = $computed(
	defaultStore.makeGetterSetter("postFormWithHashtags"),
);
const hashtags = $computed(defaultStore.makeGetterSetter("postFormHashtags"));

watch($$(text), () => {
	checkMissingMention();
});

watch(
	$$(visibleUsers),
	() => {
		checkMissingMention();
	},
	{
		deep: true,
	},
);

if (props.mention) {
	text = props.mention.host
		? `@${props.mention.username}@${toASCII(props.mention.host)}`
		: `@${props.mention.username}`;
	text += " ";
}

if (
	props.reply &&
	(props.reply.user.username !== $i.username ||
		(props.reply.user.host != null && props.reply.user.host !== host))
) {
	text = `@${props.reply.user.username}${
		props.reply.user.host != null
			? "@" + toASCII(props.reply.user.host)
			: ""
	} `;
}

if (props.reply && props.reply.text != null) {
	const ast = mfm.parse(props.reply.text);
	const otherHost = props.reply.user.host;

	for (const x of extractMentions(ast)) {
		const mention = x.host
			? `@${x.username}@${toASCII(x.host)}`
			: otherHost == null || otherHost === host
			? `@${x.username}`
			: `@${x.username}@${toASCII(otherHost)}`;

		// 自分は除外
		if ($i.username === x.username && (x.host == null || x.host === host))
			continue;

		// 重複は除外
		if (text.includes(`${mention} `)) continue;

		text += `${mention} `;
	}
}

if (props.channel) {
	visibility = "public";
	localOnly = true; // TODO: チャンネルが連合するようになった折には消す
}

// 公開以外へのリプライ時は元の公開範囲を引き継ぐ
if (
	props.reply &&
	["home", "followers", "specified"].includes(props.reply.visibility)
) {
	if (props.reply.visibility === "home" && visibility === "followers") {
		visibility = "followers";
	} else if (
		["home", "followers"].includes(props.reply.visibility) &&
		visibility === "specified"
	) {
		visibility = "specified";
	} else {
		visibility = props.reply.visibility;
	}
	if (visibility === "specified") {
		if (props.reply.visibleUserIds) {
			os.api("users/show", {
				userIds: props.reply.visibleUserIds.filter(
					(uid) => uid !== $i.id && uid !== props.reply.userId,
				),
			}).then((users) => {
				users.forEach(pushVisibleUser);
			});
		}

		if (props.reply.userId !== $i.id) {
			os.api("users/show", { userId: props.reply.userId }).then(
				(user) => {
					pushVisibleUser(user);
				},
			);
		}
	}
}

if (props.specified) {
	visibility = "specified";
	pushVisibleUser(props.specified);
}

// keep cw when reply
if (defaultStore.state.keepCw && props.reply && props.reply.cw) {
	useCw = true;
	cw = props.reply.cw;
}

function watchForDraft() {
	watch($$(text), () => saveDraft());
	watch($$(useCw), () => saveDraft());
	watch($$(cw), () => saveDraft());
	watch($$(poll), () => saveDraft());
	watch($$(files), () => saveDraft(), { deep: true });
	watch($$(visibility), () => saveDraft());
	watch($$(localOnly), () => saveDraft());
}

function checkMissingMention() {
	if (visibility === "specified") {
		const ast = mfm.parse(text);

		for (const x of extractMentions(ast)) {
			if (
				!visibleUsers.some(
					(u) => u.username === x.username && u.host === x.host,
				)
			) {
				hasNotSpecifiedMentions = true;
				return;
			}
		}
		hasNotSpecifiedMentions = false;
	}
}

function addMissingMention() {
	const ast = mfm.parse(text);

	for (const x of extractMentions(ast)) {
		if (
			!visibleUsers.some(
				(u) => u.username === x.username && u.host === x.host,
			)
		) {
			os.api("users/show", { username: x.username, host: x.host }).then(
				(user) => {
					visibleUsers.push(user);
				},
			);
		}
	}
}

function togglePoll() {
	if (poll) {
		poll = null;
	} else {
		poll = {
			choices: ["", ""],
			multiple: false,
			expiresAt: null,
			expiredAfter: null,
		};
	}
}

function addTag(tag: string) {
	insertTextAtCursor(textareaEl, ` #${tag} `);
}

function focus() {
	if (textareaEl) {
		textareaEl.focus();
		textareaEl.setSelectionRange(
			textareaEl.value.length,
			textareaEl.value.length,
		);
	}
}

function onEditorImageAdd(file) {
	files.push(file);
}

function chooseFileFrom(ev) {
	selectFiles(ev.currentTarget ?? ev.target, i18n.ts.attachFile).then(
		(files_) => {
			for (const file of files_) {
				files.push(file);
			}
		},
	);
}

function detachFile(id) {
	files = files.filter((x) => x.id !== id);
}

function updateFiles(_files) {
	files = _files;
}

function updateFileSensitive(file, sensitive) {
	files[files.findIndex((x) => x.id === file.id)].isSensitive = sensitive;
}

function updateFileName(file, name) {
	files[files.findIndex((x) => x.id === file.id)].name = name;
}

function upload(file: File, name?: string): Promise<any> {
	console.log('uploading', file)
	return uploadFile(file, defaultStore.state.uploadFolder, name);
}

function setVisibility() {
	if (props.channel) {
		// TODO: information dialog
		return;
	}

	os.popup(
		defineAsyncComponent(
			() => import("@/components/MkVisibilityPicker.vue"),
		),
		{
			currentVisibility: visibility,
			currentLocalOnly: localOnly,
			src: visibilityButton,
		},
		{
			changeVisibility: (v) => {
				visibility = v;
				if (defaultStore.state.rememberNoteVisibility) {
					defaultStore.set("visibility", visibility);
				}
			},
			changeLocalOnly: (v) => {
				localOnly = v;
				if (defaultStore.state.rememberNoteVisibility) {
					defaultStore.set("localOnly", localOnly);
				}
			},
		},
		"closed",
	);
}

function pushVisibleUser(user) {
	if (
		!visibleUsers.some(
			(u) => u.username === user.username && u.host === user.host,
		)
	) {
		visibleUsers.push(user);
	}
}

function addVisibleUser() {
	os.selectUser().then((user) => {
		pushVisibleUser(user);
	});
}

function removeVisibleUser(user) {
	visibleUsers = erase(user, visibleUsers);
}

function clear() {
	text = "";
	files = [];
	poll = null;
	quoteId = null;
}

function onEditorPostClick() {
	console.log('post!');
	post();
}

function onKeydown(ev: KeyboardEvent) {
	if (
		(ev.which === 10 || ev.which === 13) &&
		(ev.ctrlKey || ev.metaKey) &&
		canPost
	) {
		post();
	}
}

function onCompositionUpdate(ev: CompositionEvent) {
	imeText = ev.data;
}

function onCompositionEnd(ev: CompositionEvent) {
	imeText = "";
}


function onDragover(ev) {
	if (!ev.dataTransfer.items[0]) return;
	const isFile = ev.dataTransfer.items[0].kind === "file";
	const isDriveFile = ev.dataTransfer.types[0] === _DATA_TRANSFER_DRIVE_FILE_;
	if (isFile || isDriveFile) {
		ev.preventDefault();
		draghover = true;
		switch (ev.dataTransfer.effectAllowed) {
			case "all":
			case "uninitialized":
			case "copy":
			case "copyLink":
			case "copyMove":
				ev.dataTransfer.dropEffect = "copy";
				break;
			case "linkMove":
			case "move":
				ev.dataTransfer.dropEffect = "move";
				break;
			default:
				ev.dataTransfer.dropEffect = "none";
				break;
		}
	}
}

function onDragenter(ev) {
	draghover = true;
}

function onDragleave(ev) {
	draghover = false;
}

function onDrop(ev): void {
	draghover = false;

	// ファイルだったら
	if (ev.dataTransfer.files.length > 0) {
		ev.preventDefault();
		for (const x of Array.from(ev.dataTransfer.files)) upload(x);
		return;
	}

	//#region ドライブのファイル
	const driveFile = ev.dataTransfer.getData(_DATA_TRANSFER_DRIVE_FILE_);
	if (driveFile != null && driveFile !== "") {
		const file = JSON.parse(driveFile);
		files.push(file);
		ev.preventDefault();
	}
	//#endregion
}

function saveDraft() {
	const draftData = JSON.parse(localStorage.getItem("drafts") || "{}");

	draftData[draftKey] = {
		updatedAt: new Date(),
		data: {
			text: text,
			useCw: useCw,
			cw: cw,
			visibility: visibility,
			localOnly: localOnly,
			files: files,
			poll: poll,
		},
	};

	localStorage.setItem("drafts", JSON.stringify(draftData));
}

function deleteDraft() {
	const draftData = JSON.parse(localStorage.getItem("drafts") || "{}");

	delete draftData[draftKey];

	localStorage.setItem("drafts", JSON.stringify(draftData));
}

async function post() {
	const processedText = preprocess(text);

	const usedFiles = []

	console.log('FFFFFFF', files);
	console.log('TTTTTT', processedText);

	files.forEach( (file) => {
		console.log(file, file.url);
		console.log(file.toRaw)
		if(file.url) {
			console.log('a')
			if(processedText.indexOf(file.url)>=0) {
				console.log('added¡')
				usedFiles.push(file);
			}
		}
	});
		console.log('usedFiles', usedFiles)

	let renoteId = props.renote
			? props.renote.id
			: quoteId
			? quoteId
			: undefined;
	if(reblogtrail.length) {
		renoteId = reblogtrail[0].id
	}

	let postData = {
		editId: props.editId ? props.editId : undefined,
		text: processedText === "" ? undefined : processedText,
		fileIds: usedFiles.length > 0 ? usedFiles.map((f) => f.id) : undefined,
		replyId: props.reply ? props.reply.id : undefined,
		renoteId: renoteId,
		channelId: props.channel ? props.channel.id : undefined,
		poll: poll,
		cw: useCw ? cw || "" : undefined,
		localOnly: localOnly,
		visibility: visibility,
		visibleUserIds:
			visibility === "specified"
				? visibleUsers.map((u) => u.id)
				: undefined,
	};

	const wrapTag = (tag) => {
		const tagWithHash = tag.startsWith("#") ? tag : "#" + tag;

		return '<a href="/tags/' + tag + '" class="tagLink">' + tagWithHash + '</a>';
	}

	if (tags.length > 0) {
		const hashtags_ = tags
			.map(wrapTag)
			.join(" ");
		postData.text = postData.text
			? `${postData.text} <!-- tags --> <span class="noteTags">${hashtags_}</span>`
			: hashtags_;
	}

	// plugin
	if (notePostInterruptors.length > 0) {
		for (const interruptor of notePostInterruptors) {
			postData = await interruptor.handler(deepClone(postData));
		}
	}

	postData.reblogtrail = reblogtrail;
	let token = undefined;

	if (postAccount) {
		const storedAccounts = await getAccounts();
		token = storedAccounts.find((x) => x.id === postAccount.id)?.token;
	}

	posting = true;
	os.api(postData.editId ? "notes/edit" : "notes/create", postData, token)
		.then(() => {
			clear();
			nextTick(() => {
				deleteDraft();
				emit("posted");
				if (postData.text && postData.text !== "") {
					const hashtags_ = mfm
						.parse(postData.text)
						.filter((x) => x.type === "hashtag")
						.map((x) => x.props.hashtag);
					const history = JSON.parse(
						localStorage.getItem("hashtags") || "[]",
					) as string[];
					localStorage.setItem(
						"hashtags",
						JSON.stringify(unique(hashtags_.concat(history))),
					);
				}
				posting = false;
				postAccount = null;
			});
		})
		.catch((err) => {
			posting = false;
			os.alert({
				type: "error",
				text: err.message + "\n" + (err as any).id,
			});
		});
}

function updateTiptap( editorValue ) {
	text = editorValue;
	if(editorValue==="<p></p>") {
		isEditorEmpty = true;
	} else {
		isEditorEmpty = false;
	}
}

function updateTiptapTags( tagsValue ) {
	tags = tagsValue;
}


function cancel() {
	console.log('CANCEL')
	emit("cancel");
}

function insertMention() {
	os.selectUser().then((user) => {
		insertTextAtCursor(textareaEl, "@" + Acct.toString(user) + " ");
	});
}

async function insertEmoji(ev: MouseEvent) {
	os.openEmojiPicker(ev.currentTarget ?? ev.target, {}, textareaEl);
}

async function openCheatSheet(ev: MouseEvent) {
	os.popup(XCheatSheet, {}, {}, "closed");
}

function showActions(ev) {
	os.popupMenu(
		postFormActions.map((action) => ({
			text: action.title,
			action: () => {
				action.handler(
					{
						text: text,
					},
					(key, value) => {
						if (key === "text") {
							text = value;
						}
					},
				);
			},
		})),
		ev.currentTarget ?? ev.target,
	);
}

let postAccount = $ref<misskey.entities.UserDetailed | null>(null);

function openAccountMenu(ev: MouseEvent) {
	openAccountMenu_(
		{
			withExtraOperation: false,
			includeCurrentAccount: true,
			active: postAccount != null ? postAccount.id : $i.id,
			onChoose: (account) => {
				if (account.id === $i.id) {
					postAccount = null;
				} else {
					postAccount = account;
				}
			},
		},
		ev,
	);
}

onMounted(() => {
	if (props.autofocus) {
		focus();

		nextTick(() => {
			focus();
		});
	}

	// TODO: detach when unmount
	new Autocomplete(textareaEl, $$(text));
	new Autocomplete(cwInputEl, $$(cw));
	new Autocomplete(hashtagsInputEl, $$(hashtags));

	nextTick(() => {
		// 書きかけの投稿を復元
		if (!props.instant && !props.mention && !props.specified) {
			const draft = JSON.parse(localStorage.getItem("drafts") || "{}")[
				draftKey
			];
			if (draft) {
				text = draft.data.text;
				useCw = draft.data.useCw;
				cw = draft.data.cw;
				visibility = draft.data.visibility;
				localOnly = draft.data.localOnly;
				files = (draft.data.files || []).filter(
					(draftFile) => draftFile,
				);
				if (draft.data.poll) {
					poll = draft.data.poll;
				}
			}
		}

		// 削除して編集
		if (props.initialNote) {
			const init = props.initialNote;
			text = init.text ? init.text : "";
			files = init.files;
			cw = init.cw;
			useCw = init.cw != null;
			if (init.poll) {
				poll = {
					choices: init.poll.choices.map((x) => x.text),
					multiple: init.poll.multiple,
					expiresAt: init.poll.expiresAt,
					expiredAfter: init.poll.expiredAfter,
				};
			}
			visibility = init.visibility;
			localOnly = init.localOnly;
			quoteId = init.renote ? init.renote.id : null;
		}

		nextTick(() => watchForDraft());
	});
});
</script>

<style lang="scss" scoped>
.right {
	float: right;
}
.gafaadew {
	position: relative;
	&.modal {
		width: 100%;
		max-width: 720px;
	}

	> header {
		display: flex;
		flex-wrap: wrap;
		z-index: 1000;
		height: 66px;
		border-bottom: 1px solid #C1C1C1;

		> .cancel {
			padding: 0;
			font-size: 20px;
			width: 64px;
			line-height: 66px;
		}

		> .reblog-header {
			svg {
				fill: #555;
				width: 12px;
			}

			height: 100%;
			color: #555;
			display: inline-flex;
			vertical-align: bottom;
			align-items: center;

			.reblog-username {
				margin-left: 12px;
				font-weight: bold;
			}
		}

		> .account {
			height: 100%;
			margin-left: 32px;
			margin-right: 12px;
			display: inline-flex;
			vertical-align: bottom;
			align-items: center;

			.username {
				font-weight: bold;
				margin-right: 4px;
			}

			svg {
				fill: #222;
				width: 16px;
			}

			> .avatar {
				width: 28px;
				height: 28px;
				margin: auto;
			}
		}

		> .right {
			position: absolute;
			top: 0;
			right: 16px;

			> .text-count {
				opacity: 0.7;
				line-height: 66px;
			}

			> .visibility {
				height: 34px;
				width: 34px;
				margin: 16px;

				.ph-planet {
					font-size: 18px;
					color: RGB(0, 207, 53);
				}

				& + .localOnly {
					margin-left: 0 !important;
				}
			}

			> .local-only {
				margin: 0 0 0 12px;
				opacity: 0.7;
			}

			> .preview {
				display: inline-block;
				padding: 0;
				margin: 0 8px 0 0;
				font-size: 16px;
				width: 34px;
				height: 34px;
				border-radius: 6px;

				&:hover {
					background: var(--X5);
				}

				&.active {
					color: var(--accent);
				}
			}

			> .submit {
				display: inline-flex;
				align-items: center;
				margin: 16px 16px 16px 0;
				padding: 0 12px;
				line-height: 34px;
				font-weight: bold;
				vertical-align: bottom;
				border-radius: 4px;
				font-size: 0.9em;

				&:disabled {
					opacity: 0.7;
				}

				> i {
					margin-left: 6px;
				}
			}
		}
	}

	> .form {
		> .preview {
			padding: 16px;
		}

		> .with-quote {
			display: flex;
			align-items: center;
			gap: 0.4em;
			margin-inline: 24px;
			margin-bottom: 12px;
			color: var(--accent);

			> button {
				display: flex;
				padding: 0;
				color: var(--accentAlpha04);

				&:hover {
					color: var(--accentAlpha06);
				}

				&:active {
					color: var(--accentDarken30);
				}
			}
		}

		> .to-specified {
			padding: 6px 24px;
			margin-bottom: 8px;
			overflow: auto;
			line-height: 2rem;

			> .visibleUsers {
				display: inline;
				top: -1px;
				font-size: 14px;

				> button {
					padding: 2px;
					border-radius: 8px;

					> i {
						transform: translateX(2px);
					}
				}

				> span {
					margin: 0.3rem;
					padding: 4px 0 4px 4px;
					border-radius: 999px;
					background: var(--X3);

					> button {
						padding: 4px 8px;
					}
				}
			}
		}

		> .hasNotSpecifiedMentions {
			margin: 0 20px 16px 20px;
		}

		> .cw,
		> .hashtags,
		> .text {
			display: block;
			box-sizing: border-box;
			padding: 0 24px;
			margin: 0;
			width: 100%;
			font-size: 1.05em;
			border: none;
			border-radius: 0;
			background: transparent;
			color: var(--fg);
			font-family: inherit;

			&:focus {
				outline: none;
			}

			&:disabled {
				opacity: 0.5;
			}
		}

		> .cw {
			z-index: 1;
			padding: 16px;
			margin-bottom:16px;
			border-bottom: 0.5px solid var(--accent);
		}

		> .hashtags {
			z-index: 1;
			padding-top: 8px;
			padding-bottom: 8px;
			border-top: solid 0.5px var(--divider);
		}

		> .text {
			max-width: 100%;
			min-width: 100%;

			&.withCw {
				padding-top: 8px;
			}
		}

		> footer {
			padding: 0 16px 16px 16px;
			svg {
				width: 28px;
				height: 28px;

			}
			.photo svg {
				fill: rgb(255, 73, 48);
			}
			.video svg {
				fill: RGB(255, 98, 206);
			}

			> button {
				display: inline-block;
				padding: 0;
				margin: 0;
				font-size: 16px;
				width: 48px;
				height: 48px;
				border-radius: 6px;

				&:hover {
					background: var(--X5);
				}

				&.active {
					color: var(--accent);
				}
			}
		}
	}

	&.max-width_500px {
		> header {
			height: 50px;

			> .cancel {
				width: 50px;
				line-height: 50px;
			}

			> .right {
				> .text-count {
					line-height: 50px;
				}

				> .submit {
					margin: 8px;
				}
			}
		}

		> .form {
			> .to-specified {
				padding: 6px 16px;
			}

			> .cw,
			> .hashtags,
			> .text {
				padding: 0 16px;
			}

			> .text {
				min-height: 80px;
			}

			> footer {
				padding: 0 8px 8px 8px;
			}
		}
	}

	&.max-width_310px {
		> .form {
			> footer {
				> button {
					font-size: 14px;
					width: 44px;
					height: 44px;
				}
			}
		}
	}
}
</style>


<style lang="scss">
.gafaadew {
	.reblog {
		border-bottom: 1px solid #e1e1e1;
		width: calc(100% - 32px);

		.reblog-item {
			padding: 0 24px;
			margin-top: 4px;

			div.reblog-item-content {
				margin: 4px 0;
			}
		}

	}
}
</style>