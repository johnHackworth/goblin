<template>
  <div class="colorButtonSet">
    <button @click="closeMenu" class="_button colorButton">
      <i class="ph-x ph-bold ph-lg"></i>
    </button>

    <template v-for="color in colors">
      <button @click="props.editor.chain().focus().setColor(color).run()" :data-color="color" :style="`background-color: ${color}`" class="_button colorButton">
      </button>
    </template>


    <template v-for="gradient in gradients">
      <button @click="props.editor.chain().focus().setGradient(gradient).run()" :style="`background: linear-gradient(to left, ${gradient})`" class="_button colorButton">
      </button>
    </template>
  </div>
</template>


<script lang="ts" setup>
import { ref } from 'vue'

const props =
  defineProps<{
    editor: object
  }>();

const colors = ref(['#ff4930', '#ff8a00', '#e8d738',  '#00cf35',  '#00b8ff', '#7c5cff', '#ff62ce', '#001935', '#20CD40' ]);

const gradients = ref([
  '#FC466B,#3F5EFB',
  '#9ebd13 0%, #008552 100%',
  '#ffbd77 0%, #f0f4a4 37%, #acfcd9 100%',
  '#c2eaba 0%, #c5f4e0 37%, #efc2cf 100%',
  '#eec0c6, #7ee8fa',
  'rgb(237, 34, 36), rgb(243, 91, 34), rgb(249, 150, 33), rgb(245, 193, 30), rgb(241, 235, 27) 27%, rgb(241, 235, 27), rgb(241, 235, 27) 33%, rgb(99, 199, 32), rgb(12, 155, 73), rgb(33, 135, 141), rgb(57, 84, 165), rgb(97, 55, 155), rgb(147, 40, 142)',
  'rgb(85, 205, 252), rgb(179, 157, 233), rgb(247, 168, 184), rgb(246, 216, 221), rgb(255, 255, 255) 45%, rgb(255, 255, 255), rgb(255, 255, 255) 55%, rgb(246, 216, 221), rgb(247, 168, 184), rgb(179, 157, 233), rgb(85, 205, 252)'
]);

const emit = defineEmits(['color', 'close'])

const setColor = (ev) => {

  emit('color', ev.target.dataset['color']);
}

const closeMenu = () => {
  emit('close');
}

</script>

<style lang="scss">
.colorButtonSet {
  position: absolute;
  width: 380px;
  bottom: 10px;
  background: white;
  display: flex;
  height: 60px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.colorButton {
  padding: 4px;
  border-radius: 16px;
  border: 1px solid #000;
  min-width: 30px;
  height: 30px;
  margin-right: 8px !important;
  margin-bottom: 4px;
}
</style>