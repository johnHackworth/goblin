<template>
	<div v-if="$i && fetching" class="">
		<MkLoading />
	</div>
	<div v-else-if="$i">
		<XForm
			v-if="state == 'waiting'"
			ref="form"
			class="form"
			:session="session"
			@denied="state = 'denied'"
			@accepted="accepted"
		/>
		<div v-if="state == 'denied'" class="denied">
			<h1>{{ i18n.ts._auth.denied }}</h1>
		</div>
		<div v-if="state == 'accepted'" class="accepted">
			<h1>
				{{
					session.app.isAuthorized
						? i18n.t("already-authorized")
						: i18n.ts.allowed
				}}
			</h1>
			<p v-if="session.app.callbackUrl && !auth_code">
				{{ i18n.ts._auth.callback }}<MkEllipsis />
			</p>
			<MkKeyValue
				v-if="session.app.callbackUrl && auth_code"
				:copy="auth_code"
			>
				<template #key>{{ i18n.ts._auth.copyAsk }}</template>
				<template #value>{{ auth_code }}</template>
			</MkKeyValue>
			<p v-if="!session.app.callbackUrl">
				{{ i18n.ts._auth.pleaseGoBack }}
			</p>
		</div>
		<div v-if="state == 'fetch-session-error'" class="error">
			<p>{{ i18n.ts.somethingHappened }}</p>
		</div>
	</div>
	<div v-else class="signin">
		<MkSignin @login="onLogin" />
	</div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import XForm from "./auth.form.vue";
import MkSignin from "@/components/MkSignin.vue";
import MkKeyValue from "@/components/MkKeyValue.vue";
import * as os from "@/os";
import { login } from "@/account";
import { i18n } from "@/i18n";

export default defineComponent({
	components: {
		XForm,
		MkSignin,
		MkKeyValue,
	},
	props: ["token"],
	data() {
		return {
			state: null,
			session: null,
			fetching: true,
			i18n,
			auth_code: null,
		};
	},
	mounted() {
		if (!this.$i) return;

		// Fetch session
		os.api("auth/session/show", {
			token: this.token,
		})
			.then((session) => {
				this.session = session;
				this.fetching = false;

				// 既に連携していた場合
				if (this.session.app.isAuthorized) {
					os.api("auth/accept", {
						token: this.session.token,
					}).then(() => {
						this.accepted();
					});
				} else {
					this.state = "waiting";
				}
			})
			.catch((error) => {
				this.state = "fetch-session-error";
				this.fetching = false;
			});
	},
	methods: {
		accepted() {
			this.state = "accepted";
			const getUrlParams = () =>
				window.location.search
					.substring(1)
					.split("&")
					.reduce((result, query) => {
						const [k, v] = query.split("=");
						result[k] = decodeURI(v);
						return result;
					}, {});
			const isMastodon = !!getUrlParams().mastodon;
			if (this.session.app.callbackUrl && isMastodon) {
				const callbackUrl = new URL(this.session.app.callbackUrl);
				callbackUrl.searchParams.append("code", this.session.token);
				if (!!getUrlParams().state)
					callbackUrl.searchParams.append(
						"state",
						getUrlParams().state,
					);
				location.href = callbackUrl.toString();
			} else if (this.session.app.callbackUrl) {
				const url = new URL(this.session.app.callbackUrl);
				if (
					[
						"javascript:",
						"file:",
						"data:",
						"mailto:",
						"tel:",
					].includes(url.protocol)
				)
					throw new Error("invalid url");
				if (
					this.session.app.callbackUrl === "urn:ietf:wg:oauth:2.0:oob"
				) {
					this.auth_code = this.session.token;
				} else {
					location.href = `${this.session.app.callbackUrl}?token=${
						this.session.token
					}&code=${this.session.token}&state=${
						getUrlParams().state || ""
					}`;
				}
			}
		},
		onLogin(res) {
			login(res.i);
		},
	},
});
</script>

<style lang="scss" scoped></style>
