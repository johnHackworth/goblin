<template>
	<div class="zmdxowus">
		<p v-if="choices.length < 2" class="caution">
			<i class="ph-warning ph-bold ph-lg"></i
			>{{ i18n.ts._poll.noOnlyOneChoice }}
		</p>
		<ul>
			<li v-for="(choice, i) in choices" :key="i">
				<MkInput
					class="input"
					small
					maxLength="128"
					:model-value="choice"
					:placeholder="i18n.t('_poll.choiceN', { n: i + 1 })"
					@update:modelValue="onInput(i, $event)"
				>
				</MkInput>
				<button
					class="_button"
					@click="remove(i)"
					:aria-label="i18n.t('remove')"
				>
					<i class="ph-x ph-bold ph-lg"></i>
				</button>
			</li>
		</ul>
		<div class="singleLine">
			<i
				class="add ph-plus-square ph-fill ph-bold ph-3x"
				v-if="choices.length < 10"
				@click="add"
			></i>
			<MkButton v-else class="add" disabled>{{
				i18n.ts._poll.noMore
			}}</MkButton>
			<MkSwitch v-model="multiple" class="clearBackground"> {{
				i18n.ts._poll.canMultipleVote
			}}</MkSwitch>
		</div>
		<section class="expiration">
			<div>
				<MkSelect v-model="expiration" small class="clearBackground">
					<template #label>{{ i18n.ts._poll.expiration }}</template>
					<option value="infinite">
						{{ i18n.ts._poll.infinite }}
					</option>
					<option value="at">{{ i18n.ts._poll.at }}</option>
					<option value="after">{{ i18n.ts._poll.after }}</option>
				</MkSelect>
				<section v-if="expiration === 'at'">
					<MkInput v-model="atDate" small type="date" class="input">
						<template #label>{{
							i18n.ts._poll.deadlineDate
						}}</template>
					</MkInput>
					<MkInput v-model="atTime" small type="time" class="input">
						<template #label>{{
							i18n.ts._poll.deadlineTime
						}}</template>
					</MkInput>
				</section>
				<section v-else-if="expiration === 'after'">
					<MkInput v-model="after" small type="number" class="input">
						<template #label>{{ i18n.ts._poll.duration }}</template>
					</MkInput>
					<MkSelect v-model="unit" small>
						<option value="second">
							{{ i18n.ts._time.second }}
						</option>
						<option value="minute">
							{{ i18n.ts._time.minute }}
						</option>
						<option value="hour">{{ i18n.ts._time.hour }}</option>
						<option value="day">{{ i18n.ts._time.day }}</option>
					</MkSelect>
				</section>
			</div>
		</section>
	</div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import MkInput from "./form/input.vue";
import MkSelect from "./form/select.vue";
import MkSwitch from "./form/switch.vue";
import MkButton from "./MkButton.vue";
import { formatDateTimeString } from "@/scripts/format-time-string";
import { addTime } from "@/scripts/time";
import { i18n } from "@/i18n";

const props = defineProps<{
	modelValue: {
		expiresAt: string;
		expiredAfter: number;
		choices: string[];
		multiple: boolean;
	};
}>();
const emit = defineEmits<{
	(
		ev: "update:modelValue",
		v: {
			expiresAt: string;
			expiredAfter: number;
			choices: string[];
			multiple: boolean;
		},
	): void;
}>();

const choices = ref(props.modelValue.choices);
const multiple = ref(props.modelValue.multiple);
const expiration = ref("infinite");
const atDate = ref(
	formatDateTimeString(addTime(new Date(), 1, "day"), "yyyy-MM-dd"),
);
const atTime = ref("00:00");
const after = ref(0);
const unit = ref("second");

if (props.modelValue.expiresAt) {
	expiration.value = "at";
	atDate.value = atTime.value = props.modelValue.expiresAt;
} else if (typeof props.modelValue.expiredAfter === "number") {
	expiration.value = "after";
	after.value = props.modelValue.expiredAfter / 1000;
} else {
	expiration.value = "infinite";
}

function onInput(i, value) {
	choices.value[i] = value;
}

function add() {
	choices.value.push("");
	// TODO
	// nextTick(() => {
	//   (this.$refs.choices as any).childNodes[this.choices.length - 1].childNodes[0].focus();
	// });
}

function remove(i) {
	choices.value = choices.value.filter((_, _i) => _i !== i);
}

function get() {
	const calcAt = () => {
		return new Date(`${atDate.value} ${atTime.value}`).getTime();
	};

	const calcAfter = () => {
		let base = parseInt(after.value);
		switch (unit.value) {
			case "day":
				base *= 24;
			// fallthrough
			case "hour":
				base *= 60;
			// fallthrough
			case "minute":
				base *= 60;
			// fallthrough
			case "second":
				return (base *= 1000);
			default:
				return null;
		}
	};

	return {
		choices: choices.value,
		multiple: multiple.value,
		...(expiration.value === "at"
			? { expiresAt: calcAt() }
			: expiration.value === "after"
			? { expiredAfter: calcAfter() }
			: {}),
	};
}

watch(
	[choices, multiple, expiration, atDate, atTime, after, unit],
	() => emit("update:modelValue", get()),
	{
		deep: true,
	},
);
</script>

<style lang="scss" scoped>
.zmdxowus {
	padding: 8px 16px;

	.expiration {
		width: 100%;
		display: flex;
  	justify-content: flex-start;
  	align-items: baseline;

		:deep(.input) {
			border: 1px solid var(--accent);

			&.matxzzsk {
				border: 0;
			}
		}

		:deep(.label) {
			color: var(--fg);
			margin-right: 8px;
		}
	}

	._button {
		background: var(--accent);
		color: white;
	}

	> .caution {
		margin: 0 0 8px 0;
		font-size: 0.8em;
		color: #f00;

		> i {
			margin-right: 4px;
		}
	}

	> ul {
		display: block;
		margin: 0;
		padding: 0;
		list-style: none;

		> li {
			display: flex;
			margin: 8px 0;
			padding: 0;
			width: 100%;

			> .input {
				flex: 1;
				border: 1px solid var(--accent);
			}

			> button {
				width: 32px;
				padding: 4px 0;
			}
		}
	}

	.singleLine {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.add {
		z-index: 1;
		color: var(--accent);
		cursor: pointer;

		&:hover {
			color: var(--fg);
		}
	}

	> section {
		margin: 16px 0 0 0;

		> div {
			margin: 0 8px;
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
			gap: 12px;

			&:last-child {
				flex: 1 0 auto;

				> div {
					flex-grow: 1;
				}

				> section {
					// MAGIC: Prevent div above from growing unless wrapped to its own line
					flex-grow: 9999;
					align-items: end;
					display: flex;
					gap: 4px;

					> .input {
						flex: 1 1 auto;
					}
				}
			}
		}
	}
}
</style>
