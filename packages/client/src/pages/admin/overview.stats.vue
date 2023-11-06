<template>
	<div>
		<Transition
			:name="$store.state.animation ? '_transition_zoom' : ''"
			mode="out-in"
		>
			<MkLoading v-if="fetching" />
			<div v-else :class="$style.root">
				<div class="item _panel users">
					<div class="icon">
						<i class="ph-users ph-bold ph-xl"></i>
					</div>
					<div class="body">
						<div class="value">
							<MkNumber
								:value="stats.originalUsersCount"
								style="margin-right: 0.5em"
							/>
							<MkNumberDiff
								v-tooltip="i18n.ts.dayOverDayChanges"
								class="diff"
								:value="usersComparedToThePrevDay"
							></MkNumberDiff>
						</div>
						<div class="label">{{ i18n.ts.users }}</div>
					</div>
				</div>
				<div class="item _panel notes">
					<div class="icon">
						<i class="ph-pencil ph-bold ph-xl"></i>
					</div>
					<div class="body">
						<div class="value">
							<MkNumber
								:value="stats.originalNotesCount"
								style="margin-right: 0.5em"
							/>
							<MkNumberDiff
								v-tooltip="i18n.ts.dayOverDayChanges"
								class="diff"
								:value="notesComparedToThePrevDay"
							></MkNumberDiff>
						</div>
						<div class="label">{{ i18n.ts.notes }}</div>
					</div>
				</div>
				<div class="item _panel instances">
					<div class="icon">
						<i class="ph-planet ph-bold ph-xl"></i>
					</div>
					<div class="body">
						<div class="value">
							<MkNumber
								:value="stats.instances"
								style="margin-right: 0.5em"
							/>
						</div>
						<div class="label">{{ i18n.ts.instances }}</div>
					</div>
				</div>
				<div class="item _panel online">
					<div class="icon">
						<i class="ph-broadcast ph-bold ph-xl"></i>
					</div>
					<div class="body">
						<div class="value">
							<MkNumber
								:value="onlineUsersCount"
								style="margin-right: 0.5em"
							/>
						</div>
						<div class="label">{{ i18n.ts.online }}</div>
					</div>
				</div>
				<div class="item _panel emojis">
					<div class="icon">
						<i class="ph-smiley ph-bold ph-xl"></i>
					</div>
					<div class="body">
						<div class="value">
							<MkNumber
								:value="emojiCount"
								style="margin-right: 0.5em"
							/>
						</div>
						<div class="label">{{ i18n.ts.emojis }}</div>
					</div>
				</div>
			</div>

			<!-- TODO: Drive -->
		</Transition>
	</div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from "vue";
import MkMiniChart from "@/components/MkMiniChart.vue";
import * as os from "@/os";
import number from "@/filters/number";
import MkNumberDiff from "@/components/MkNumberDiff.vue";
import MkNumber from "@/components/MkNumber.vue";
import { i18n } from "@/i18n";

let stats: any = $ref(null);
let usersComparedToThePrevDay = $ref<number>();
let notesComparedToThePrevDay = $ref<number>();
let onlineUsersCount = $ref(0);
let emojiCount = $ref(0);
let fetching = $ref(true);

onMounted(async () => {
	const [_stats, _onlineUsersCount] = await Promise.all([
		os.api("stats", {}),
		os.api("get-online-users-count").then((res) => res.count),
	]);
	stats = _stats;
	onlineUsersCount = _onlineUsersCount;

	os.apiGet("charts/users", { limit: 2, span: "day" }).then((chart) => {
		usersComparedToThePrevDay =
			stats.originalUsersCount - chart.local.total[1];
	});

	os.apiGet("charts/notes", { limit: 2, span: "day" }).then((chart) => {
		notesComparedToThePrevDay =
			stats.originalNotesCount - chart.local.total[1];
	});

	os.api("meta", { detail: false }).then((meta) => {
		emojiCount = meta.emojis.length;
	});

	fetching = false;
});
</script>

<style lang="scss" module>
.root {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
	grid-gap: 12px;

	&:global {
		> .item {
			display: flex;
			box-sizing: border-box;
			padding: 12px;

			> .icon {
				display: grid;
				place-items: center;
				height: 100%;
				aspect-ratio: 1;
				margin-right: 12px;
				background: var(--accentedBg);
				color: var(--accent);
				border-radius: 10px;
			}

			&.users {
				> .icon {
					background: #56949f22;
					color: #9ccfd8;
				}
			}

			&.notes {
				> .icon {
					background: #28698322;
					color: #31748f;
				}
			}

			&.instances {
				> .icon {
					background: #d7827e22;
					color: #ebbcba;
				}
			}

			&.emojis {
				> .icon {
					background: #ea9d3422;
					color: #f6c177;
				}
			}

			&.online {
				> .icon {
					background: #907aa922;
					color: #c4a7e7;
				}
			}

			&.drive {
				> .icon {
					background: #b4637a22;
					color: #eb6f92;
				}
			}

			> .body {
				padding: 2px 0;

				> .value {
					font-size: 1.2em;
					font-weight: bold;

					> .diff {
						font-size: 0.65em;
						font-weight: normal;
					}
				}

				> .label {
					font-size: 0.8em;
					opacity: 0.5;
				}
			}
		}
	}
}
</style>
