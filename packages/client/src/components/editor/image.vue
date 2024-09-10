<template>
  <node-view-wrapper class="vue-component">
    <div class="goblinImage">
      <img :src="node.attrs.src" :alt="node.attrs.alt" />
      <span class="altButton" @click="editAlt">
        <span v-if="node.attrs.alt != ''" class="hasAlt"><i class="ph-bold ph-lg ph-seal-check"></i></span>
        <span v-else><i class="ph-bold ph-lg ph-seal-warning"></i></span>
      </span>
      <div class="altInput" v-if="altVisible">
        <textarea placeholder="Describe your image" v-model="altInputValue" @change="update">{{ node.attrs.alt }}</textarea>
      </div>
    </div>
  </node-view-wrapper>
</template>

<script>
import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'

export default {
  components: {
    NodeViewWrapper,
  },

  props: nodeViewProps,

  data() {
    return {
      altInputValue: this.node.attrs.alt,
      altVisible: false
    }
  },

  methods: {
    editAlt() {
      this.altVisible = ! this.altVisible;
    },
    update() {
      this.updateAttributes({ alt: this.altInputValue })
    }
  },
}
</script>

<style lang="scss">
.tiptap {
  .goblinImage {
    position: relative;
  }

  .altButton {
    > span {
      cursor: pointer;
      background: red;
      width: 18px;
      height: 18px;
      position: absolute;
      top: 16px;
      left: 0;
      font-size: 20px;
      font-weight: bold;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 20px;

      &.hasAlt {
        background: green;
      }
    }
  }
  .altInput {
    display: block;
    width: 100%;

    > textarea {
      width: calc(100% + 32px);
      margin-left: -16px;
      border: 0;
      border-bottom: 1px dashed var(--accent);
      padding: 4px 16px 0;
    }
  }
}
</style>