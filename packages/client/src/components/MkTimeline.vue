<template>
	<MkInfo
		v-if="tlHint && !tlHintClosed"
		:closeable="true"
		class="_gap"
		@close="closeHint"
	>
		<I18n :src="tlHint">
			<template #icon></template>
		</I18n>
	</MkInfo>
	<div v-if="queue > 0" class="new">
		<button
			class="_buttonPrimary _shadow"
			@click="tlComponent.scrollTop()"
			:class="{ instant: !$store.state.animation }"
		>
			{{ i18n.ts.newNoteRecived }}
			<i class="ph-arrow-up ph-bold"></i>
		</button>
	</div>
	<XNotes
		ref="tlComponent"
		:no-gap="!$store.state.showGapBetweenNotesInTimeline"
		:pagination="pagination"
		@queue="(x) => (queue = x)"
	/>
</template>

<script lang="ts" setup>
import { ref, watch, computed, provide, onUnmounted } from "vue";
import XNotes from "@/components/MkNotes.vue";
import MkInfo from "@/components/MkInfo.vue";
import * as os from "@/os";
import { stream } from "@/stream";
import * as sound from "@/scripts/sound";
import { $i } from "@/account";
import { i18n } from "@/i18n";
import { defaultStore } from "@/store";

const props = defineProps<{
	src: string;
	list?: string;
	antenna?: string;
	channel?: string;
	sound?: boolean;
}>();

let queue = $ref(0);

const emit = defineEmits<{
	(ev: "note"): void;
	(ev: "queue", count: number): void;
}>();

provide(
	"inChannel",
	computed(() => props.src === "channel"),
);

const tlComponent: InstanceType<typeof XNotes> = $ref();

const prepend = (note) => {
	tlComponent.pagingComponent?.prepend(note);

	emit("note");

	if (props.sound) {
		sound.play($i && note.userId === $i.id ? "noteMy" : "note");
	}
};

const onUserAdded = () => {
	tlComponent.pagingComponent?.reload();
};

const onUserRemoved = () => {
	tlComponent.pagingComponent?.reload();
};

const onChangeFollowing = () => {
	if (!tlComponent.pagingComponent?.backed) {
		tlComponent.pagingComponent?.reload();
	}
};

let endpoint;
let query;
let connection;
let connection2;

let tlHint;
let tlHintClosed;

if (props.src === "antenna") {
	endpoint = "antennas/notes";
	query = {
		antennaId: props.antenna,
	};
	connection = stream.useChannel("antenna", {
		antennaId: props.antenna,
	});
	connection.on("note", prepend);
} else if (props.src === "home") {
	endpoint = "notes/timeline";
	query = {
		withReplies: defaultStore.state.showTimelineReplies,
	};
	connection = stream.useChannel("homeTimeline", {
		withReplies: defaultStore.state.showTimelineReplies,
	});
	connection.on("note", prepend);

	connection2 = stream.useChannel("main");
	connection2.on("follow", onChangeFollowing);
	connection2.on("unfollow", onChangeFollowing);

	tlHint = i18n.ts._tutorial.step5_3;
	tlHintClosed = defaultStore.state.tlHomeHintClosed;
} else if (props.src === "local") {
	endpoint = "notes/local-timeline";
	query = {
		withReplies: defaultStore.state.showTimelineReplies,
	};
	connection = stream.useChannel("localTimeline", {
		withReplies: defaultStore.state.showTimelineReplies,
	});
	connection.on("note", prepend);

	tlHint = i18n.ts._tutorial.step5_4;
	tlHintClosed = defaultStore.state.tlLocalHintClosed;
} else if (props.src === "recommended") {
	endpoint = "notes/recommended-timeline";
	query = {
		withReplies: defaultStore.state.showTimelineReplies,
	};
	connection = stream.useChannel("recommendedTimeline", {
		withReplies: defaultStore.state.showTimelineReplies,
	});
	connection.on("note", prepend);

	tlHint = i18n.ts._tutorial.step5_6;
	tlHintClosed = defaultStore.state.tlRecommendedHintClosed;
} else if (props.src === "social") {
	endpoint = "notes/hybrid-timeline";
	query = {
		withReplies: defaultStore.state.showTimelineReplies,
	};
	connection = stream.useChannel("hybridTimeline", {
		withReplies: defaultStore.state.showTimelineReplies,
	});
	connection.on("note", prepend);

	tlHint = i18n.ts._tutorial.step5_5;
	tlHintClosed = defaultStore.state.tlSocialHintClosed;
} else if (props.src === "global") {
	endpoint = "notes/global-timeline";
	query = {
		withReplies: defaultStore.state.showTimelineReplies,
	};
	connection = stream.useChannel("globalTimeline", {
		withReplies: defaultStore.state.showTimelineReplies,
	});
	connection.on("note", prepend);

	tlHint = i18n.ts._tutorial.step5_7;
	tlHintClosed = defaultStore.state.tlGlobalHintClosed;
} else if (props.src === "mentions") {
	endpoint = "notes/mentions";
	connection = stream.useChannel("main");
	connection.on("mention", prepend);
} else if (props.src === "directs") {
	endpoint = "notes/mentions";
	query = {
		visibility: "specified",
	};
	const onNote = (note) => {
		if (note.visibility === "specified") {
			prepend(note);
		}
	};
	connection = stream.useChannel("main");
	connection.on("mention", onNote);
} else if (props.src === "list") {
	endpoint = "notes/user-list-timeline";
	query = {
		listId: props.list,
	};
	connection = stream.useChannel("userList", {
		listId: props.list,
	});
	connection.on("note", prepend);
	connection.on("userAdded", onUserAdded);
	connection.on("userRemoved", onUserRemoved);
} else if (props.src === "channel") {
	endpoint = "channels/timeline";
	query = {
		channelId: props.channel,
	};
	connection = stream.useChannel("channel", {
		channelId: props.channel,
	});
	connection.on("note", prepend);
}

function closeHint() {
	switch (props.src) {
		case "home":
			defaultStore.set("tlHomeHintClosed", true);
			break;
		case "local":
			defaultStore.set("tlLocalHintClosed", true);
			break;
		case "recommended":
			defaultStore.set("tlRecommendedHintClosed", true);
			break;
		case "social":
			defaultStore.set("tlSocialHintClosed", true);
			break;
		case "global":
			defaultStore.set("tlGlobalHintClosed", true);
			break;
	}
}

const pagination = {
	endpoint: endpoint,
	limit: 10,
	params: query,
};

onUnmounted(() => {
	connection.dispose();
	if (connection2) connection2.dispose();
});

/* TODO
const timetravel = (date?: Date) => {
	this.date = date;
	this.$refs.tl.reload();
};
*/
</script>
<style lang="scss" scoped>
@keyframes slideUp {
	to {
		transform: translateY(-100%);
		opacity: 0;
	}
}
.new {
	position: sticky;
	display: flex;
	justify-content: center;
	top: calc(var(--stickyTop, 0px) - 60px);
	width: 600px;
	max-width: 100%;
	height: 60px;
	pointer-events: none;
	margin: auto;
	margin-top: -60px;
	z-index: 1001;
	box-shadow: 0 24px 24px -20px var(--accentedBg);
	&::after {
		content: "";
		position: absolute;
		inset: -2px 0;
		border: 2px solid var(--accentDarken);
		mask: linear-gradient(
			to right,
			transparent,
			black 40% 60%,
			transparent
		);
		-webkit-mask: linear-gradient(
			to right,
			transparent,
			black 40% 60%,
			transparent
		);
	}
	> button {
		display: flex;
		position: absolute;
		top: 120%;
		margin-inline: auto;
		border-radius: 2em;
		padding: 0.5em 1.2em;
		background: var(--accentedBg);
		border: 0;
		color: var(--accent);
		overflow: hidden;
		pointer-events: all;
		transform: translateY(-100%);
		opacity: 0;
		animation:
			reset 0.4s forwards cubic-bezier(0, 0.4, 0, 1.1),
			slideUp 1s 5s forwards cubic-bezier(1, 0, 1, 1);
		&::before {
			content: "";
			position: absolute;
			inset: 0;
			background: var(--bg);
			z-index: -1;
		}
		i {
			margin-left: 0.7em;
			border-left: 1px solid var(--accentedBg);
			padding-left: 0.4em;
		}
	}
}
</style>
