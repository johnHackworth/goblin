<template>
	<XModalWindow
		ref="dialogEl"
		:with-ok-button="true"
		:ok-button-disabled="selected == null"
		@click="cancel()"
		@close="cancel()"
		@ok="ok()"
		@closed="$emit('closed')"
	>
		<template #header>{{ i18n.ts.selectInstance }}</template>
		<div class="mehkoush">
			<div class="form">
				<MkInput
					v-model="hostname"
					:autofocus="true"
					@update:modelValue="search"
				>
					<template #label>{{ i18n.ts.instance }}</template>
				</MkInput>
			</div>
			<div
				v-if="hostname != ''"
				class="result"
				:class="{ hit: instances.length > 0 }"
			>
				<div v-if="instances.length > 0" class="instances">
					<div
						v-for="item in instances"
						:key="item.id"
						class="instance"
						:class="{
							selected: selected && selected.id === item.id,
						}"
						@click="selected = item"
						@dblclick="ok()"
					>
						<div class="body">
							<img
								class="icon"
								:src="
									item.iconUrl ?? '/client-assets/dummy.png'
								"
								aria-hidden="true"
							/>
							<span class="name">{{ item.host }}</span>
						</div>
					</div>
				</div>
				<div v-else class="empty">
					<span>{{ i18n.ts.noInstances }}</span>
				</div>
			</div>
		</div>
	</XModalWindow>
</template>

<script lang="ts" setup>
import MkInput from "@/components/form/input.vue";
import XModalWindow from "@/components/MkModalWindow.vue";
import * as os from "@/os";
import { i18n } from "@/i18n";
import { Instance } from "firefish-js/built/entities";

const emit = defineEmits<{
	(ev: "ok", selected: Instance): void;
	(ev: "cancel"): void;
	(ev: "closed"): void;
}>();

let hostname = $ref("");
let instances: Instance[] = $ref([]);
let selected: Instance | null = $ref(null);
let dialogEl = $ref<InstanceType<typeof XModalWindow>>();

let searchOrderLatch = 0;
const search = () => {
	if (hostname === "") {
		instances = [];
		return;
	}

	const searchId = ++searchOrderLatch;
	os.api("federation/instances", {
		host: hostname,
		limit: 10,
		blocked: false,
		suspended: false,
		sort: "+pubSub",
	}).then((_instances) => {
		if (searchId !== searchOrderLatch) return;
		instances = _instances.map(
			(x) =>
				({
					id: x.id,
					host: x.host,
					iconUrl: x.iconUrl,
				}) as Instance,
		);
	});
};

const ok = () => {
	if (selected == null) return;
	emit("ok", selected);
	dialogEl?.close();
};

const cancel = () => {
	emit("cancel");
	dialogEl?.close();
};
</script>

<style lang="scss" scoped>
.mehkoush {
	margin: var(--marginFull) 0;

	> .form {
		padding: 0 var(--root-margin);
	}

	> .result {
		display: flex;
		flex-direction: column;
		overflow: auto;
		height: 100%;

		&.result.hit {
			padding: 0;
		}

		> .instances {
			flex: 1;
			overflow: auto;
			padding: 8px 0;

			> .instance {
				display: flex;
				align-items: center;
				padding: 8px var(--root-margin);
				font-size: 14px;

				&:hover {
					background: var(--X7);
				}

				&.selected {
					background: var(--accent);
					color: #fff;
				}

				> * {
					pointer-events: none;
					user-select: none;
				}

				> .body {
					padding: 0 8px;
					width: 100%;

					> .name {
						display: block;
						font-weight: bold;
					}

					> .icon {
						width: 16px;
						height: 16px;
						margin-right: 8px;
						float: left;
					}
				}
			}
		}

		> .empty {
			opacity: 0.7;
			text-align: center;
		}
	}
}
</style>
