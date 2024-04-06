<template>
	<button
		v-if="!hideMenu"
		class="menu _button"
		@click.stop="menu"
		v-tooltip="i18n.ts.menu"
	>
		<i class="ph-dots-three-outline ph-bold ph-lg"></i>
	</button>
	<button
		v-if="$i != null && $i.id != user.id"
		class="kpoogebi _button follow-button"
		:class="{
			wait,
			active: isFollowing || hasPendingFollowRequestFromYou,
			full,
			large,
			blocking: isBlocking,
		}"
		:disabled="wait"
		@click.stop="onClick"
		:aria-label="`${state} ${user.name || user.username}`"
		v-tooltip="full ? null : `${state} ${user.name || user.username}`"
	>
		<template v-if="!wait">
			<template v-if="isBlocking">
				<span>{{ (state = i18n.ts.blocked) }}</span
				><i class="ph-prohibit ph-bold ph-lg"></i>
			</template>
			<template
				v-else-if="hasPendingFollowRequestFromYou && user.isLocked"
			>
				<span>{{ (state = i18n.ts.followRequestPending) }}</span
				><i class="ph-hourglass-medium ph-bold ph-lg"></i>
			</template>
			<template
				v-else-if="hasPendingFollowRequestFromYou && !user.isLocked"
			>
				<!-- つまりリモートフォローの場合。 -->
				<span>{{ (state = i18n.ts.processing) }}</span
				><i class="ph-circle-notch ph-bold ph-lg fa-pulse"></i>
			</template>
			<template v-else-if="isFollowing">
				<span>{{ (state = i18n.ts.unfollow) }}</span
				><i class="ph-minus ph-bold ph-lg"></i>
			</template>
			<template v-else-if="!isFollowing && user.isLocked">
				<span>{{ (state = i18n.ts.followRequest) }}</span
				><i class="ph-lock-open ph-bold ph-lg"></i>
			</template>
			<template v-else-if="!isFollowing && !user.isLocked">
				<span>{{ (state = i18n.ts.follow) }}</span
				><i class="ph-plus ph-bold ph-lg"></i>
			</template>
		</template>
		<template v-else>
			<span>{{ (state = i18n.ts.processing) }}</span
			><i class="ph-circle-notch ph-bold ph-lg fa-pulse ph-fw ph-lg"></i>
		</template>
	</button>
	<button
		v-else-if="!$i"
		class="kpoogebi _button follow-button"
		:class="{
			full,
			large,
			blocking: isBlocking,
		}"
		:disabled="wait"
		@click.stop="onClickNotLogged"
		:aria-label="`${state} ${user.name || user.username}`"
		v-tooltip="full ? null : `${state} ${user.name || user.username}`"
	>
		<template v-if="!wait">
			<template v-if="user.isLocked">
				<span>{{ (state = i18n.ts.followRequest) }}</span
				><i class="ph-lock-open ph-bold ph-lg"></i>
			</template>
			<template v-else>
				<span>{{ (state = i18n.ts.follow) }}</span
				><i class="ph-plus ph-bold ph-lg"></i>
			</template>
		</template>
	</button>
	<div class="follow-modal" v-if="followRemoteDialogVisible">
		<XModalWindow
			:prefer-type="'dialog'"
			@click="cancelModal"
			@close="cancelModal"
			@closed="emit('closed')"
			ref="dialog"
			:width="370"
		>
			<div class="follow-remote">
					<h4 class="follow-title">{{ `Follow ${user.username }` }} </h4>
					<div class="follow-text">
						You need to have a Goblin account to follow this user. Where is your account hosted?
					</div>
					<div class="follow-where">
						<input class="follow-server" v-model="remoteServer"/>
						<button class="follow-go" @click="onFollowRemote">go!</button>
					</div>
					<div class="follow-tip">Tip: That's the website where you signed up, like goblin.band, kobold.page, etc.</div>
					<div class="follow-login">
						{{ `If you already have an account in ${host} or wish to create one, ` }}
						<a :href="`https://${host}`">click here</a>
					</div>
			</div>
		</XModalWindow>
	</div>
</template>

<script lang="ts" setup>
import { ref, computed, onBeforeUnmount, onMounted } from "vue";
import XModalWindow from "@/components/MkModalWindow.vue";
import type * as Misskey from "firefish-js";
import * as os from "@/os";
import { stream } from "@/stream";
import { i18n } from "@/i18n";
import { $i } from "@/account";
import { getUserMenu } from "@/scripts/get-user-menu";
import { useRouter } from "@/router";
import { host } from "@/config";

const router = useRouter();

const emit = defineEmits(["refresh"]);
const props = withDefaults(
	defineProps<{
		user: Misskey.entities.UserDetailed;
		full?: boolean;
		large?: boolean;
		hideMenu?: boolean;
	}>(),
	{
		full: false,
		large: false,
	},
);

const remoteServer = ref("");
const followRemoteDialogVisible = ref(false);


const cancelModal = () => {
	followRemoteDialogVisible.value = false;
}


const isBlocking = computed(() => props.user.isBlocking);

let state = $ref(i18n.ts.processing);

let isFollowing = $ref(props.user.isFollowing);
let hasPendingFollowRequestFromYou = $ref(
	props.user.hasPendingFollowRequestFromYou,
);
let wait = $ref(false);
const connection = stream.useChannel("main");

if (props.user.isFollowing == null) {
	os.api("users/show", {
		userId: props.user.id,
	}).then(onFollowChange);
}

function onFollowChange(user: Misskey.entities.UserDetailed) {
	if (user.id === props.user.id) {
		isFollowing = user.isFollowing;
		hasPendingFollowRequestFromYou = user.hasPendingFollowRequestFromYou;
	}
}

async function onFollowRemote() {
	let url = '';
	let remote = remoteServer.value.trim();
	if(remote.startsWith('http://') || remote.startsWith('https://')) {
		url = `${remote}/authorize-follow?acct=@${props.user.username}@${host}`;
	} else {
		url = `https://${remote}/authorize-follow?acct=@${props.user.username}@${host}`;
	}
	window.location.href = url;
}

async function onClickNotLogged() {
	followRemoteDialogVisible.value = true;
}

async function onClick() {
	wait = true;

	try {
		if (isBlocking.value) {
			const { canceled } = await os.confirm({
				type: "warning",
				text: i18n.t("unblockConfirm"),
			});
			if (canceled) return;

			await os.api("blocking/delete", {
				userId: props.user.id,
			});
			if (props.user.isMuted) {
				await os.api("mute/delete", {
					userId: props.user.id,
				});
			}
			emit("refresh");
		} else if (isFollowing) {
			const { canceled } = await os.confirm({
				type: "warning",
				text: i18n.t("unfollowConfirm", {
					name: props.user.name || props.user.username,
				}),
			});

			if (canceled) return;

			await os.api("following/delete", {
				userId: props.user.id,
			});
		} else {
			if (hasPendingFollowRequestFromYou) {
				await os.api("following/requests/cancel", {
					userId: props.user.id,
				});
				hasPendingFollowRequestFromYou = false;
			} else {
				await os.api("following/create", {
					userId: props.user.id,
				});
				hasPendingFollowRequestFromYou = true;
			}
		}
	} catch (err) {
		console.error(err);
	} finally {
		wait = false;
	}
}

function menu(ev) {
	os.popupMenu(
		getUserMenu(props.user, router),
		ev.currentTarget ?? ev.target,
	);
}

onMounted(() => {
	connection.on("follow", onFollowChange);
	connection.on("unfollow", onFollowChange);
});

onBeforeUnmount(() => {
	connection.dispose();
});
</script>

<style lang="scss" scoped>
.menu {
	width: 3em;
	height: 2em;
	vertical-align: middle;
}
.follow-button {
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-weight: bold;
	color: var(--accent);
	border: solid 1px var(--accent);
	padding: 0;
	font-size: 16px;
	width: 2em;
	height: 2em;
	border-radius: 100px;
	background: var(--bg);
	vertical-align: middle;

	&.full {
		padding: 0.2em 0.7em;
		width: auto;
		font-size: 14px;
	}

	&.large {
		font-size: 16px;
		height: 38px;
		padding: 0 12px 0 16px;
	}

	&:not(.full) {
		width: 31px;
		span {
			display: none;
		}
	}

	&:focus-visible {
		&:after {
			content: "";
			pointer-events: none;
			position: absolute;
			top: -5px;
			right: -5px;
			bottom: -5px;
			left: -5px;
			border: 2px solid var(--focus);
			border-radius: 32px;
		}
	}

	&:hover {
		//background: mix($primary, #fff, 20);
	}

	&:active {
		//background: mix($primary, #fff, 40);
	}

	&.active {
		color: var(--fgOnAccent);
		background: var(--accent);

		&:hover {
			background: var(--accentLighten);
			border-color: var(--accentLighten);
		}

		&:active {
			background: var(--accentDarken);
			border-color: var(--accentDarken);
		}
	}

	&.wait {
		cursor: wait !important;
		opacity: 0.7;
	}

	> span {
		margin-right: 6px;
	}
}

.blocking {
	background-color: var(--bg) !important;
	border: none;
}

.follow-modal {
	z-index: 99999;
	.follow-remote {
		padding: 0 16px 32px;

		.follow-tip {
			margin-top: 8px;
			font-size: 0.8em;
		}

		.follow-where {
			display: flex;
			width: 100&;
			justify-content: space-between;
			margin-top: 16px;

			.follow-go {
				display: block;
				min-width: 100px;
				min-height: 35px;
				padding: 8px 16px;
				text-align: center;
				font-weight: normal;
				font-size: max(12px, 1em);
				background: var(--buttonBg);
				border-radius: 5px;
				box-sizing: border-box;
				transition: background 0.1s ease;
				margin-right: 0.2rem;
				margin-left: 0.2rem;
				font-weight: bold;
				color: var(--fgOnAccent) !important;
				background: var(--accent);
			}

			.follow-server {
				color: var(--fg);
	  		background: var(--panel);
	  		border: solid 1px var(--X8);
	  		border-color: var(--X8) !important;
				padding: 8px 16px;
				font-size: max(12px, 1em);
				flex-grow: 2;
			}
		}

		.follow-login {
			margin-top: 16px;

			a {
				color: var(--accent);
			}
		}
	}
}
</style>
