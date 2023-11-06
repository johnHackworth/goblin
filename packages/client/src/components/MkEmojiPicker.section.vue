<template>
	<section>
		<header class="_acrylic" @click="shown = !shown">
			<i
				class="toggle ph-fw ph-lg"
				:class="
					shown
						? 'ph-caret-down ph-bold ph-lg'
						: 'ph-caret-up ph-bold ph-lg'
				"
			></i>
			<slot></slot> ({{ emojis.length }})
			<span v-if="props.skinToneSelector && props.skinTones">
				<button
					v-for="skinTone in props.skinTones"
					class="_button"
					@click.stop="
						applyUnicodeSkinTone(
							props.skinTones.indexOf(skinTone) + 1,
						)
					"
				>
					<i
						class="ph-circle ph-fill ph-fw ph-lg"
						:style="{ color: skinTone + ' !important' }"
						:aria-label="
							props.skinToneLabels
								? props.skinToneLabels[
										props.skinTones.indexOf(skinTone)
								  ]
								: ''
						"
					></i>
				</button>
			</span>
		</header>
		<div v-if="shown" class="body">
			<button
				v-for="emoji in localEmojis"
				:key="emoji"
				class="_button item"
				@click="emit('chosen', emoji, $event)"
			>
				<MkEmoji class="emoji" :emoji="emoji" :normal="true" />
			</button>
		</div>
	</section>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from "vue";
import { addSkinTone } from "@/scripts/emojilist";

const props = defineProps<{
	emojis: string[];
	initialShown?: boolean;
	skinToneSelector?: boolean;
	skinTones?: string[];
	skinToneLabels?: string[];
}>();

const localEmojis = ref([...props.emojis]);

function applyUnicodeSkinTone(custom?: number) {
	for (let i = 0; i < localEmojis.value.length; i++) {
		localEmojis.value[i] = addSkinTone(localEmojis.value[i], custom);
	}
}

const emit = defineEmits<{
	(ev: "chosen", v: string, event: MouseEvent): void;
}>();

const shown = ref(!!props.initialShown);

onMounted(() => {
	if (props.skinToneSelector) {
		applyUnicodeSkinTone();
	}
});

watch(
	() => props.emojis,
	(newVal) => {
		localEmojis.value = [...newVal];
	},
);
</script>

<style lang="scss" scoped></style>
