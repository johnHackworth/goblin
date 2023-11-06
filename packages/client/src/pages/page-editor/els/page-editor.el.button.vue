<template>
	<XContainer :draggable="true" @remove="() => $emit('remove')">
		<template #header
			><i class="ph-lightning ph-bold ph-lg"></i>
			{{ i18n.ts._pages.blocks.button }}</template
		>

		<section class="xfhsjczc">
			<MkInput v-model="value.text"
				><template #label>{{
					i18n.ts._pages.blocks._button.text
				}}</template></MkInput
			>
			<MkSwitch v-model="value.primary"
				><span>{{
					i18n.ts._pages.blocks._button.colored
				}}</span></MkSwitch
			>
			<MkSelect v-model="value.action">
				<template #label>{{
					i18n.ts._pages.blocks._button.action
				}}</template>
				<option value="dialog">
					{{ i18n.ts._pages.blocks._button._action.dialog }}
				</option>
				<option value="resetRandom">
					{{ i18n.ts._pages.blocks._button._action.resetRandom }}
				</option>
				<option value="pushEvent">
					{{ i18n.ts._pages.blocks._button._action.pushEvent }}
				</option>
				<option value="callAiScript">
					{{ i18n.ts._pages.blocks._button._action.callAiScript }}
				</option>
			</MkSelect>
			<template v-if="value.action === 'dialog'">
				<MkInput v-model="value.content"
					><template #label>{{
						i18n.ts._pages.blocks._button._action._dialog.content
					}}</template></MkInput
				>
			</template>
			<template v-else-if="value.action === 'pushEvent'">
				<MkInput v-model="value.event"
					><template #label>{{
						i18n.ts._pages.blocks._button._action._pushEvent.event
					}}</template></MkInput
				>
				<MkInput v-model="value.message"
					><template #label>{{
						i18n.ts._pages.blocks._button._action._pushEvent.message
					}}</template></MkInput
				>
				<MkSelect v-model="value.var">
					<template #label>{{
						i18n.ts._pages.blocks._button._action._pushEvent
							.variable
					}}</template>
					<option :value="null">
						{{
							i18n.t(
								"_pages.blocks._button._action._pushEvent.no-variable",
							)
						}}
					</option>
					<option v-for="v in hpml.getVarsByType()" :value="v.name">
						{{ v.name }}
					</option>
					<optgroup :label="i18n.ts._pages.script.pageVariables">
						<option
							v-for="v in hpml.getPageVarsByType()"
							:value="v"
						>
							{{ v }}
						</option>
					</optgroup>
					<optgroup
						:label="i18n.ts._pages.script.enviromentVariables"
					>
						<option v-for="v in hpml.getEnvVarsByType()" :value="v">
							{{ v }}
						</option>
					</optgroup>
				</MkSelect>
			</template>
			<template v-else-if="value.action === 'callAiScript'">
				<MkInput v-model="value.fn"
					><template #label>{{
						i18n.ts._pages.blocks._button._action._callAiScript
							.functionName
					}}</template></MkInput
				>
			</template>
		</section>
	</XContainer>
</template>

<script lang="ts" setup>
import {} from "vue";
import XContainer from "../page-editor.container.vue";
import MkSelect from "@/components/form/select.vue";
import MkInput from "@/components/form/input.vue";
import MkSwitch from "@/components/form/switch.vue";
import { i18n } from "@/i18n";

withDefaults(
	defineProps<{
		value: any;
		hpml: any;
	}>(),
	{
		value: {
			text: "",
			action: "dialog",
			content: null,
			event: null,
			message: null,
			primary: false,
			var: null,
			fn: null,
		},
	},
);
</script>

<style lang="scss" scoped>
.xfhsjczc {
	padding: 0 16px 0 16px;
}
</style>
