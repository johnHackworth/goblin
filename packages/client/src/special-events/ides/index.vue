<template>
  <div class="idesOfMarch" v-if="areWeInTheIdesOfMarch">
    <div class="hitBox" @click="stab" @mouseenter="stab">
      <Caesar />

      <template v-for="blood in bloodSplashes">
        <div
          class="splash"
          :style="{ top: blood.pos.y + '%', left: blood.pos.x + '%', width: blood.size + 'px',  height: blood.size + 'px', opacity: blood.opacity, background: blood.color ? blood.color : '' }"
        >
        </div>
      </template>
    </div>
  </div>
  <div v-else class="idesWarning">
    <div class="glow">
      Beware of the ides of March
    </div>
  </div>
</template>


<script lang="ts" setup>
  import Caesar from "../../components/icons/caesar.vue";
  const bloodSplashes = $ref([]);
  const areWeInTheIdesOfMarch = $ref((new Date()).getDate() === 15);

  function addBloodSplash() {
    const colors = [ '#0FF', '#00F', '#0F0', '#06F' ];
    const pos = { x: 10 + (Math.random() * 80), y: 10 + (Math.random() * 70) };
    const size = Math.floor((Math.random() * 20)) + 5;
    const opacity = (0.7 * Math.random());
    const color = bloodSplashes.length >= 23 ? colors[ Math.floor(Math.random() * colors.length)] : null;
    bloodSplashes.push({ pos, size, opacity, color });
  }

  function stab() {
    addBloodSplash();
  }
</script>

<style lang="scss" scoped>
.idesOfMarch {
  position: fixed;
  width: 100px;
  display: block;
  padding: 200px 0 0 200px;
  bottom: 30px;
  right: 50px;
  cursor: url("/client-assets/dagger.png"), auto;
  z-index: 99;

  .splash {
    position: absolute;
    border-radius: 30px;
    background:
      repeating-conic-gradient(#F00 0 3%, #0000 0 11%),
      repeating-conic-gradient(#0000 0 7%, #f00 0 9%) 50% / 70% 70%,
      repeating-conic-gradient(#0000 0 11%, #f00 0 13%) 50% / 80% 80%,
      radial-gradient(#f00 22%, #0000 0),
      transparent;
  }

  .hitBox {
    position: relative;
    width: 100px;

    &:hover {
      animation: animateDagger 1s 1;
    }

    &:active {
      animation: animateDagger 0.25s 1;
      cursor: url("/client-assets/dagger2.png"), auto;
    }

    svg {
      width: 150%;
      margin-left: -25%;
    }
  }
}

.idesWarning {
  position: fixed;
  bottom: 30px;
  left: 50%;
  z-index: 9;
  animation: fadeOut 20s ease-out;
  animation-iteration-count: 1;
  opacity: 0;
  height: 0px;

  .glow {
    text-transform: uppercase;
    font-size: 20px;
    color: #FFF;
    opacity: 0.5;
    text-align: center;
    animation: glowing 0.5s ease-in-out infinite alternate;
  }
}

@keyframes fadeOut {
  0% {
    opacity: 1;
    display: block;
    height: 30px;
  }
  70% {
    opacity: 1;
  }
  99% {
    opacity: 0;
    display: block;
    height: 30px;
  }
  100% {
    opacity: 0;
    height: 0px;
    display: none;
  }
}

@keyframes animateDagger{
  0%{
    cursor: url("/client-assets/dagger2.png"), auto;
  }
  100%{
    cursor: url("/client-assets/dagger.png"), auto;
  }
}

@-webkit-keyframes glowing {
  from {
    text-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px #e60073, 0 0 40px #e60073, 0 0 50px #e60073, 0 0 60px #e60073, 0 0 70px #e60073;
  }
  to {
    text-shadow: 0 0 20px #fff, 0 0 30px #ff4da6, 0 0 40px #ff4da6, 0 0 50px #ff4da6, 0 0 60px #ff4da6, 0 0 70px #ff4da6, 0 0 80px #ff4da6;
  }
}

</style>

