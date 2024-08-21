<template>
  <div class="imageViewer">
    <div :class="{ visible: visible }">
      <div class="background" @click="close" />
      <img src="" />
      <button class="cancel _button" @click="close">
        <i class="ph-x ph-bold ph-lg" :aria-label="i18n.t('close')"></i>
      </button>
    </div>
  </div>
</template>


<script lang="ts" setup>
import { ref } from 'vue'
import { i18n } from "@/i18n";

let visible = $ref(false);

const close = () => {
  visible = false;
  document.querySelector('.imageViewer img').src = "";
}

document.addEventListener( "click", ( e ) => {
  if( e.target.nodeName === "IMG" &&
    ( e.target.offsetParent.className === "noteFile" ||
    e.target.offsetParent.className === "article" )
  ) {
    visible = true;
    document.querySelector('.imageViewer img').src = e.target.currentSrc;
  }
} )

</script>

<style lang="scss">
.imageViewer {

  > div {
    display: none;
  }

  .visible {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    z-index: 99999;
    align-content: center;
    justify-content: center;

    .background {
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      position: fixed;
      background: var(--modalBg);
      -webkit-backdrop-filter: var(--modalBgFilter);
      backdrop-filter: var(--modalBgFilter);

    }

    img {
      z-index: 2;
      padding: 3%;
      max-width:94%;
      max-height:94%;
      object-fit: contain;
      display: block;
    }

    .cancel {
      color: var(--fgOnAccent);
      font-size: 24px;
      position: fixed;
      top: 8px;
      right: 8px;
      z-index: 3;
    }
  }
}

</style>
