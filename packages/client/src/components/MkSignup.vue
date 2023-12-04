<template>
	<div v-if="instance.disableRegistration" style="margin-bottom: 1rem">
		<p>{{ i18n.ts.signupsDisabled }}</p>
		<a href="https://joinfirefish.org/join">
			<MkButton rounded gradate
				>{{ i18n.ts.findOtherInstance }}
			</MkButton>
		</a>
	</div>
	<form
		class="qlvuhzng _formRoot"
		autocomplete="new-password"
		@submit.prevent="onSubmit"
	>
		<MkInput
			v-if="instance.disableRegistration"
			v-model="invitationCode"
			class="_formBlock clear"
			type="text"
			:spellcheck="false"
			required
			data-cy-signup-invitation-code
			@update:modelValue="onChangeInvitationCode"
		>
			<template #label>{{ i18n.ts.invitationCode }}</template>
			<template #prefix><i class="ph-key ph-bold ph-lg"></i></template>
		</MkInput>
		<div
			v-if="
				!instance.disableRegistration ||
				(instance.disableRegistration && invitationState === 'entered')
			"
		>
			<MkInput
				v-model="username"
				class="_formBlock clear"
				type="text"
				pattern="^[a-zA-Z0-9_]{1,20}$"
				:spellcheck="false"
				required
				data-cy-signup-username
				@update:modelValue="onChangeUsername"
			>
				<template #label
					>{{ i18n.ts.username }}
					<div
						v-tooltip:dialog="i18n.ts.usernameInfo"
						class="_button _help"
					>
						<i class="ph-question ph-bold"></i></div
				></template>
				<template #prefix>@</template>
				<template #suffix>@{{ host }}</template>
				<template #caption>
					<span v-if="usernameState === 'wait'" style="color: #6e6a86"
						><i
							class="ph-circle-notch ph-bold ph-lg fa-pulse ph-fw ph-lg"
						></i>
						{{ i18n.ts.checking }}</span
					>
					<span
						v-else-if="usernameState === 'ok'"
						style="color: var(--success)"
						><i class="ph-check ph-bold ph-lg ph-fw ph-lg"></i>
						{{ i18n.ts.available }}</span
					>
					<span
						v-else-if="usernameState === 'unavailable'"
						style="color: var(--error)"
						><i class="ph-warning ph-bold ph-lg ph-fw ph-lg"></i>
						{{ i18n.ts.unavailable }}</span
					>
					<span
						v-else-if="usernameState === 'error'"
						style="color: var(--error)"
						><i class="ph-warning ph-bold ph-lg ph-fw ph-lg"></i>
						{{ i18n.ts.error }}</span
					>
					<span
						v-else-if="usernameState === 'invalid-format'"
						style="color: var(--error)"
						><i class="ph-warning ph-bold ph-lg ph-fw ph-lg"></i>
						{{ i18n.ts.usernameInvalidFormat }}</span
					>
					<span
						v-else-if="usernameState === 'min-range'"
						style="color: var(--error)"
						><i class="ph-warning ph-bold ph-lg ph-fw ph-lg"></i>
						{{ i18n.ts.tooShort }}</span
					>
					<span
						v-else-if="usernameState === 'max-range'"
						style="color: var(--error)"
						><i class="ph-warning ph-bold ph-lg ph-fw ph-lg"></i>
						{{ i18n.ts.tooLong }}</span
					>
				</template>
			</MkInput>
			<MkInput
				v-if="instance.emailRequiredForSignup"
				v-model="email"
				class="_formBlock clear"
				:debounce="true"
				type="email"
				:spellcheck="false"
				required
				data-cy-signup-email
				@update:modelValue="onChangeEmail"
			>
				<template #label
					>{{ i18n.ts.emailAddress }}
					<div
						v-tooltip:dialog="i18n.ts._signup.emailAddressInfo"
						class="_button _help"
					>
						<i class="ph-question ph-bold"></i></div
				></template>
				<template #prefix
					><i class="ph-envelope-simple-open ph-bold ph-lg"></i
				></template>
				<template #caption>
					<span v-if="emailState === 'wait'" style="color: #6e6a86"
						><i
							class="ph-circle-notch ph-bold ph-lg fa-pulse ph-fw ph-lg"
						></i>
						{{ i18n.ts.checking }}</span
					>
					<span
						v-else-if="emailState === 'ok'"
						style="color: var(--success)"
						><i class="ph-check ph-bold ph-lg ph-fw ph-lg"></i>
						{{ i18n.ts.available }}</span
					>
					<span
						v-else-if="emailState === 'unavailable:used'"
						style="color: var(--error)"
						><i class="ph-warning ph-bold ph-lg ph-fw ph-lg"></i>
						{{ i18n.ts._emailUnavailable.used }}</span
					>
					<span
						v-else-if="emailState === 'unavailable:format'"
						style="color: var(--error)"
						><i class="ph-warning ph-bold ph-lg ph-fw ph-lg"></i>
						{{ i18n.ts._emailUnavailable.format }}</span
					>
					<span
						v-else-if="emailState === 'unavailable:disposable'"
						style="color: var(--error)"
						><i class="ph-warning ph-bold ph-lg ph-fw ph-lg"></i>
						{{ i18n.ts._emailUnavailable.disposable }}</span
					>
					<span
						v-else-if="emailState === 'unavailable:mx'"
						style="color: var(--error)"
						><i class="ph-warning ph-bold ph-lg ph-fw ph-lg"></i>
						{{ i18n.ts._emailUnavailable.mx }}</span
					>
					<span
						v-else-if="emailState === 'unavailable:smtp'"
						style="color: var(--error)"
						><i class="ph-warning ph-bold ph-lg ph-fw ph-lg"></i>
						{{ i18n.ts._emailUnavailable.smtp }}</span
					>
					<span
						v-else-if="emailState === 'unavailable'"
						style="color: var(--error)"
						><i class="ph-warning ph-bold ph-lg ph-fw ph-lg"></i>
						{{ i18n.ts.unavailable }}</span
					>
					<span
						v-else-if="emailState === 'error'"
						style="color: var(--error)"
						><i class="ph-warning ph-bold ph-lg ph-fw ph-lg"></i>
						{{ i18n.ts.error }}</span
					>
				</template>
			</MkInput>
			<MkInput
				v-model="password"
				class="_formBlock clear"
				type="password"
				autocomplete="new-password"
				required
				data-cy-signup-password
				@update:modelValue="onChangePassword"
			>
				<template #label>{{ i18n.ts.password }}</template>
				<template #prefix
					><i class="ph-lock ph-bold ph-lg"></i
				></template>
				<template #caption>
					<span
						v-if="passwordStrength == 'low'"
						style="color: var(--error)"
						><i class="ph-warning ph-bold ph-lg ph-fw ph-lg"></i>
						{{ i18n.ts.weakPassword }}</span
					>
					<span
						v-if="passwordStrength == 'medium'"
						style="color: var(--warn)"
						><i class="ph-check ph-bold ph-lg ph-fw ph-lg"></i>
						{{ i18n.ts.normalPassword }}</span
					>
					<span
						v-if="passwordStrength == 'high'"
						style="color: var(--success)"
						><i class="ph-check ph-bold ph-lg ph-fw ph-lg"></i>
						{{ i18n.ts.strongPassword }}</span
					>
				</template>
			</MkInput>
			<MkInput
				v-model="retypedPassword"
				class="_formBlock clear"
				type="password"
				autocomplete="new-password"
				required
				data-cy-signup-password-retype
				@update:modelValue="onChangePasswordRetype"
			>
				<template #label
					>{{ i18n.ts.password }} ({{ i18n.ts.retype }})</template
				>
				<template #prefix
					><i class="ph-lock ph-bold ph-lg"></i
				></template>
				<template #caption>
					<span
						v-if="passwordRetypeState == 'match'"
						style="color: var(--success)"
						><i class="ph-check ph-bold ph-lg ph-fw ph-lg"></i>
						{{ i18n.ts.passwordMatched }}</span
					>
					<span
						v-if="passwordRetypeState == 'not-match'"
						style="color: var(--error)"
						><i class="ph-warning ph-bold ph-lg ph-fw ph-lg"></i>
						{{ i18n.ts.passwordNotMatched }}</span
					>
				</template>
			</MkInput>
			<MkSwitch
				v-if="instance.tosUrl"
				v-model="ToSAgreement"
				class="_formBlock clear tou"
			>
				<I18n :src="i18n.ts.agreeTo">
					<template #0>
						<a
							:href="instance.tosUrl"
							class="_link"
							target="_blank"
							>{{ i18n.ts.tos }}</a
						>
					</template>
				</I18n>
			</MkSwitch>
			<MkCaptcha
				v-if="instance.enableHcaptcha"
				ref="hcaptcha"
				v-model="hCaptchaResponse"
				class="_formBlock clear captcha"
				provider="hcaptcha"
				:sitekey="instance.hcaptchaSiteKey"
			/>
			<MkCaptcha
				v-if="instance.enableRecaptcha"
				ref="recaptcha"
				v-model="reCaptchaResponse"
				class="_formBlock clear captcha"
				provider="recaptcha"
				:sitekey="instance.recaptchaSiteKey"
			/>
			<MkButton
				class="_formBlock clear"
				type="submit"
				:disabled="shouldDisableSubmitting"
				gradate
				data-cy-signup-submit
				>{{ i18n.ts.start }}</MkButton
			>
		</div>
	</form>
</template>

<script lang="ts" setup>
import {} from "vue";
import getPasswordStrength from "syuilo-password-strength";
import { toUnicode } from "punycode/";
import MkButton from "./MkButton.vue";
import MkInput from "./form/input.vue";
import MkSwitch from "./form/switch.vue";
import MkCaptcha from "@/components/MkCaptcha.vue";
import * as config from "@/config";
import * as os from "@/os";
import { login } from "@/account";
import { instance } from "@/instance";
import { i18n } from "@/i18n";

const props = withDefaults(
	defineProps<{
		autoSet?: boolean;
	}>(),
	{
		autoSet: false,
	},
);

const emit = defineEmits<{
	(ev: "signup", user: Record<string, any>): void;
	(ev: "signupEmailPending"): void;
}>();

const host = toUnicode(config.host);

let hcaptcha = $ref();
let recaptcha = $ref();

let username: string = $ref("");
let password: string = $ref("");
let retypedPassword: string = $ref("");
let invitationCode: string = $ref("");
let email = $ref("");
let usernameState:
	| null
	| "wait"
	| "ok"
	| "unavailable"
	| "error"
	| "invalid-format"
	| "min-range"
	| "max-range" = $ref(null);
let invitationState: null | "entered" = $ref(null);
let emailState:
	| null
	| "wait"
	| "ok"
	| "unavailable:used"
	| "unavailable:format"
	| "unavailable:disposable"
	| "unavailable:mx"
	| "unavailable:smtp"
	| "unavailable"
	| "error" = $ref(null);
let passwordStrength: "" | "low" | "medium" | "high" = $ref("");
let passwordRetypeState: null | "match" | "not-match" = $ref(null);
let submitting: boolean = $ref(false);
let ToSAgreement: boolean = $ref(false);
let hCaptchaResponse = $ref(null);
let reCaptchaResponse = $ref(null);

const shouldDisableSubmitting = $computed((): boolean => {
	return (
		submitting ||
		(instance.tosUrl && !ToSAgreement) ||
		(instance.enableHcaptcha && !hCaptchaResponse) ||
		(instance.enableRecaptcha && !reCaptchaResponse) ||
		passwordRetypeState === "not-match"
	);
});

function onChangeInvitationCode(): void {
	if (invitationCode === "") {
		invitationState = null;
		return;
	}
	invitationState = "entered";
}

function onChangeUsername(): void {
	if (username === "") {
		usernameState = null;
		return;
	}

	{
		const err = !username.match(/^[a-zA-Z0-9_-]+$/)
			? "invalid-format"
			: username.length < 1
			? "min-range"
			: username.length > 50
			? "max-range"
			: null;

		if (err) {
			usernameState = err;
			return;
		}
	}

	usernameState = "wait";

	os.api("username/available", {
		username,
	})
		.then((result) => {
			usernameState = result.available ? "ok" : "unavailable";
		})
		.catch(() => {
			usernameState = "error";
		});
}

function onChangeEmail(): void {
	if (email === "") {
		emailState = null;
		return;
	}

	emailState = "wait";

	os.api("email-address/available", {
		emailAddress: email,
	})
		.then((result) => {
			emailState = result.available
				? "ok"
				: result.reason === "used"
				? "unavailable:used"
				: result.reason === "format"
				? "unavailable:format"
				: result.reason === "disposable"
				? "unavailable:disposable"
				: result.reason === "mx"
				? "unavailable:mx"
				: result.reason === "smtp"
				? "unavailable:smtp"
				: "unavailable";
		})
		.catch(() => {
			emailState = "error";
		});
}

function onChangePassword(): void {
	if (password === "") {
		passwordStrength = "";
		return;
	}

	const strength = getPasswordStrength(password);
	passwordStrength =
		strength > 0.7 ? "high" : strength > 0.3 ? "medium" : "low";
}

function onChangePasswordRetype(): void {
	if (retypedPassword === "") {
		passwordRetypeState = null;
		return;
	}

	passwordRetypeState = password === retypedPassword ? "match" : "not-match";
}

function onSubmit(): void {
	if (submitting) return;
	submitting = true;

	os.api("signup", {
		username,
		password,
		emailAddress: email,
		invitationCode,
		"hcaptcha-response": hCaptchaResponse,
		"g-recaptcha-response": reCaptchaResponse,
	})
		.then(() => {
			if (instance.emailRequiredForSignup) {
				os.alert({
					type: "success",
					title: i18n.ts._signup.almostThere,
					text: i18n.t("_signup.emailSent", { email }),
				});
				emit("signupEmailPending");
			} else {
				os.api("signin", {
					username,
					password,
				}).then((res) => {
					emit("signup", res);

					if (props.autoSet) {
						login(res.i);
					}
				});
			}
		})
		.catch(() => {
			submitting = false;
			hcaptcha.reset?.();
			recaptcha.reset?.();

			os.alert({
				type: "error",
				text: i18n.ts.somethingHappened,
			});
		});
}
</script>

<style lang="scss" scoped>
.qlvuhzng {
	.captcha {
		margin: 16px 0;
	}

	color: var(--fg);
}
</style>
