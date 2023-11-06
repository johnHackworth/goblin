<template>
	<MkModal
		ref="modal"
		:prefer-type="'dialog'"
		@click="done(true)"
		@closed="emit('closed')"
	>
		<div :class="$style.root">
			<div v-if="icon" :class="$style.icon">
				<i :class="icon"></i>
			</div>
			<div
				v-else-if="!input && !select"
				:class="[$style.icon, $style['type_' + type]]"
			>
				<i
					v-if="type === 'success'"
					:class="$style.iconInner"
					class="ph-check ph-bold ph-lg"
				></i>
				<i
					v-else-if="type === 'error'"
					:class="$style.iconInner"
					class="ph-circle-wavy-warning ph-bold ph-lg"
				></i>
				<i
					v-else-if="type === 'warning'"
					:class="$style.iconInner"
					class="ph-warning ph-bold ph-lg"
				></i>
				<i
					v-else-if="type === 'info'"
					:class="$style.iconInner"
					class="ph-info ph-bold ph-lg"
				></i>
				<i
					v-else-if="type === 'question'"
					:class="$style.iconInner"
					class="ph-circle-question ph-bold ph-lg"
				></i>
				<MkLoading
					v-else-if="type === 'waiting'"
					:class="$style.iconInner"
					:em="true"
				/>
			</div>
			<header v-if="title" :class="$style.title">
				<Mfm :text="title" />
			</header>
			<header
				v-if="title == null && input && input.type === 'password'"
				:class="$style.title"
			>
				<Mfm :text="i18n.ts.password" />
			</header>
			<div v-if="text" :class="$style.text">
				<Mfm :text="text" />
			</div>
			<MkInput
				v-if="input && input.type !== 'paragraph'"
				ref="inputEl"
				v-model="inputValue"
				autofocus
				:autocomplete="input.autocomplete"
				:type="input.type == 'search' ? 'search' : input.type || 'text'"
				:placeholder="input.placeholder || undefined"
				:style="{
					width: input.type === 'search' ? '300px' : null,
				}"
				@keydown="onInputKeydown"
			>
				<template v-if="input.type === 'password'" #prefix
					><i class="ph-password ph-bold ph-lg"></i
				></template>
				<template #caption>
					<span
						v-if="
							okButtonDisabled &&
							disabledReason === 'charactersExceeded'
						"
						v-text="
							i18n.t('_dialog.charactersExceeded', {
								current: (inputValue as string).length,
								max: input.maxLength ?? 'NaN',
							})
						"
					/>
					<span
						v-else-if="
							okButtonDisabled &&
							disabledReason === 'charactersBelow'
						"
						v-text="
							i18n.t('_dialog.charactersBelow', {
								current: (inputValue as string).length,
								min: input.minLength ?? 'NaN',
							})
						"
					/>
				</template>
				<template v-if="input.type === 'search'" #suffix>
					<button
						v-tooltip.noDelay="i18n.ts.filter"
						class="_buttonIcon"
						@click.stop="openSearchFilters"
					>
						<i class="ph-funnel ph-bold"></i>
					</button>
				</template>
			</MkInput>
			<MkTextarea
				v-if="input && input.type === 'paragraph'"
				v-model="inputValue"
				autofocus
				:type="paragraph"
				:placeholder="input.placeholder || undefined"
			>
			</MkTextarea>
			<MkSelect v-if="select" v-model="selectedValue" autofocus>
				<template v-if="select.items">
					<option v-for="item in select.items" :value="item.value">
						{{ item.text }}
					</option>
				</template>
				<template v-else>
					<optgroup
						v-for="groupedItem in select.groupedItems"
						:label="groupedItem.label"
					>
						<option
							v-for="item in groupedItem.items"
							:value="item.value"
						>
							{{ item.text }}
						</option>
					</optgroup>
				</template>
			</MkSelect>

			<div
				v-if="(showOkButton || showCancelButton) && !actions"
				:class="$style.buttons"
			>
				<div v-if="!isYesNo">
					<MkButton
						v-if="showOkButton"
						inline
						primary
						:autofocus="!input && !select"
						:disabled="okButtonDisabled"
						@click="ok"
						>{{
							showCancelButton || input || select
								? i18n.ts.ok
								: i18n.ts.gotIt
						}}</MkButton
					>
					<MkButton
						v-if="showCancelButton || input || select"
						inline
						@click="cancel"
						>{{ i18n.ts.cancel }}</MkButton
					>
				</div>
				<div v-else>
					<MkButton
						v-if="showOkButton"
						inline
						primary
						:autofocus="!input && !select"
						@click="ok"
						>{{ i18n.ts.yes }}
					</MkButton>
					<MkButton
						v-if="showCancelButton || input || select"
						inline
						@click="cancel"
						>{{ i18n.ts.no }}</MkButton
					>
				</div>
			</div>
			<div v-if="actions" :class="$style.buttons">
				<MkButton
					v-for="action in actions"
					:key="action.text"
					inline
					:primary="action.primary"
					@click="
						() => {
							action.callback();
							modal?.close();
						}
					"
					>{{ action.text }}</MkButton
				>
			</div>
		</div>
	</MkModal>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import * as Acct from "firefish-js/built/acct";
import MkModal from "@/components/MkModal.vue";
import MkButton from "@/components/MkButton.vue";
import MkInput from "@/components/form/input.vue";
import MkTextarea from "@/components/form/textarea.vue";
import MkSelect from "@/components/form/select.vue";
import * as os from "@/os";
import { i18n } from "@/i18n";

interface Input {
	type: HTMLInputElement["type"];
	placeholder?: string | null;
	autocomplete?: string;
	default: string | number | null;
	minLength?: number;
	maxLength?: number;
}

interface Select {
	items: {
		value: string;
		text: string;
	}[];
	groupedItems: {
		label: string;
		items: {
			value: string;
			text: string;
		}[];
	}[];
	default: string | null;
}

const props = withDefaults(
	defineProps<{
		type?:
			| "success"
			| "error"
			| "warning"
			| "info"
			| "question"
			| "waiting"
			| "search";
		title: string;
		text?: string;
		input?: Input;
		select?: Select;
		icon?: string;
		actions?: {
			text: string;
			primary?: boolean;
			callback: (...args: any[]) => void;
		}[];
		showOkButton?: boolean;
		showCancelButton?: boolean;
		isYesNo?: boolean;

		cancelableByBgClick?: boolean;
		okText?: string;
		cancelText?: string;
	}>(),
	{
		type: "info",
		showOkButton: true,
		showCancelButton: false,
		isYesNo: false,

		cancelableByBgClick: true,
	},
);

const emit = defineEmits<{
	(ev: "done", v: { canceled: boolean; result: any }): void;
	(ev: "closed"): void;
}>();

const modal = shallowRef<InstanceType<typeof MkModal>>();

const inputValue = ref<string | number | null>(props.input?.default ?? null);
const selectedValue = ref(props.select?.default ?? null);

let disabledReason = $ref<null | "charactersExceeded" | "charactersBelow">(
	null,
);
const okButtonDisabled = $computed<boolean>(() => {
	if (props.input) {
		if (props.input.minLength) {
			if (
				(inputValue.value || inputValue.value === "") &&
				(inputValue.value as string).length < props.input.minLength
			) {
				disabledReason = "charactersBelow";
				return true;
			}
		}
		if (props.input.maxLength) {
			if (
				inputValue.value &&
				(inputValue.value as string).length > props.input.maxLength
			) {
				disabledReason = "charactersExceeded";
				return true;
			}
		}
	}
	return false;
});

const inputEl = ref<typeof MkInput>();

function done(canceled: boolean, result?) {
	emit("done", { canceled, result });
	modal.value?.close();
}

async function ok() {
	if (!props.showOkButton) return;

	const result = props.input
		? inputValue.value
		: props.select
		? selectedValue.value
		: true;
	done(false, result);
}

function cancel() {
	done(true);
}
/*
function onBgClick() {
	if (props.cancelableByBgClick) cancel();
}
*/
function onKeydown(evt: KeyboardEvent) {
	if (evt.key === "Escape") cancel();
}

function onInputKeydown(evt: KeyboardEvent) {
	if (evt.key === "Enter") {
		evt.preventDefault();
		evt.stopPropagation();
		ok();
	}
}

function formatDateToYYYYMMDD(date) {
	const year = date.getFullYear();
	const month = ("0" + (date.getMonth() + 1)).slice(-2);
	const day = ("0" + (date.getDate() + 1)).slice(-2);
	return `${year}-${month}-${day}`;
}

async function openSearchFilters(ev) {
	await os.popupMenu(
		[
			{
				icon: "ph-user ph-bold ph-lg",
				text: i18n.ts._filters.fromUser,
				action: () => {
					os.selectUser().then((user) => {
						inputValue.value += " from:@" + Acct.toString(user);
					});
				},
			},
			{
				type: "parent",
				text: i18n.ts._filters.withFile,
				icon: "ph-paperclip ph-bold ph-lg",
				children: [
					{
						text: i18n.ts.image,
						icon: "ph-image-square ph-bold ph-lg",
						action: () => {
							inputValue.value += " has:image";
						},
					},
					{
						text: i18n.ts.video,
						icon: "ph-video-camera ph-bold ph-lg",
						action: () => {
							inputValue.value += " has:video";
						},
					},
					{
						text: i18n.ts.audio,
						icon: "ph-music-note ph-bold ph-lg",
						action: () => {
							inputValue.value += " has:audio";
						},
					},
					{
						text: i18n.ts.file,
						icon: "ph-file ph-bold ph-lg",
						action: () => {
							inputValue.value += " has:file";
						},
					},
				],
			},
			{
				icon: "ph-link ph-bold ph-lg",
				text: i18n.ts._filters.fromDomain,
				action: () => {
					inputValue.value += " domain:";
				},
			},
			{
				icon: "ph-calendar-blank ph-bold ph-lg",
				text: i18n.ts._filters.notesBefore,
				action: () => {
					os.inputDate({
						title: i18n.ts._filters.notesBefore,
					}).then((res) => {
						if (res.canceled) return;
						inputValue.value +=
							" before:" + formatDateToYYYYMMDD(res.result);
					});
				},
			},
			{
				icon: "ph-calendar-blank ph-bold ph-lg",
				text: i18n.ts._filters.notesAfter,
				action: () => {
					os.inputDate({
						title: i18n.ts._filters.notesAfter,
					}).then((res) => {
						if (res.canceled) return;
						inputValue.value +=
							" after:" + formatDateToYYYYMMDD(res.result);
					});
				},
			},
			{
				icon: "ph-eye ph-bold ph-lg",
				text: i18n.ts._filters.followingOnly,
				action: () => {
					inputValue.value += " filter:following ";
				},
			},
			{
				icon: "ph-users-three ph-bold ph-lg",
				text: i18n.ts._filters.followersOnly,
				action: () => {
					inputValue.value += " filter:followers ";
				},
			},
		],
		ev.target,
		{ noReturnFocus: true },
	);
	inputEl.value.focus();
	inputEl.value.selectRange(inputValue.value.length, inputValue.value.length); // cursor at end
}

onMounted(() => {
	document.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
	document.removeEventListener("keydown", onKeydown);
});
</script>

<style lang="scss" module>
.root {
	position: relative;
	margin: auto;
	padding: 32px;
	min-width: 320px;
	max-width: 480px;
	box-sizing: border-box;
	text-align: center;
	background: var(--panel);
	border-radius: var(--radius);
}

.icon {
	font-size: 24px;

	& + .title {
		margin-top: 8px;
	}
}

.iconInner {
	display: block;
	margin: 0 auto;
}

.type_info {
	color: var(--accent);
}

.type_success {
	color: var(--success);
}

.type_error {
	color: var(--error);
}

.type_warning {
	color: var(--warn);
}

.title {
	margin: 0 0 8px 0;
	font-weight: bold;
	font-size: 1.1em;

	& + .text {
		margin-top: 8px;
	}
}

.text {
	margin: 16px 0 0 0;
}

.buttons {
	margin-top: 16px;
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	justify-content: center;
}
</style>
