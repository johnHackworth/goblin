<template>
  <div class="loginContainer">
    <div class="logoContainer">
      <Logo />
    </div>
    <div class="loginForm">
      <h1 v-if="meta" :class="{ full }">

        <MkA to="/" class="link"
          ><img
            v-if="meta.logoImageUrl"
            class="logo"
            :src="meta.logoImageUrl"
            alt="logo"
          /><span v-else class="text">{{
            instanceName
          }}</span></MkA
        >
      </h1>
      <div v-if="meta" class="about">
        <div
          class="desc"
          v-html="meta.description"
        ></div>
      </div>
      <div class="action">
        <MkButton inline gradate @click="signup()">
          {{ i18n.ts.signup }}
        </MkButton>
        <MkButton inline @click="signin()">
          {{ i18n.ts.login }}
        </MkButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from "vue";
import { host, instanceName } from "@/config";
import * as os from "@/os";
import XSigninDialog from "@/components/MkSigninDialog.vue";
import XSignupDialog from "@/components/MkSignupDialog.vue";
import MkButton from "@/components/MkButton.vue";
import { i18n } from "@/i18n";
import Logo from "@/components/icons/logo.vue";

export default defineComponent({
  components: {
    MkButton,
    Logo,
  },
  data() {
    return {
      host,
      instanceName,
      pageInfo: null,
      meta: null,
      narrow: window.innerWidth < 1280,
      i18n,
    };
  },
  created() {
    os.api("meta", { detail: true }).then((meta) => {
      this.meta = meta;
    });
  },
  methods: {
    signin() {
      os.popup(
        XSigninDialog,
        {
          autoSet: true,
        },
        {},
        "closed",
      );
    },
    signup() {
      os.popup(
        XSignupDialog,
        {
          autoSet: true,
        },
        {},
        "closed",
      );
    },
  },
});
</script>

<style lang="scss" scoped>
.loginContainer {
  max-width: 380px;
  width: 20%;
  top: 96px;
  position: fixed;
  left: 20px;
  z-index: 99;

  @media (max-width: 1300px) {
    width: 18%;
  }

  @media (max-width: 1100px) {
    display: none;
  }

  .logoContainer {
    width: 100%;
    text-align: center;

    :deep(svg) {
      width: 144px;
      margin-bottom: 4px;
      height: 48px;
    }
  }

  .loginForm {
    width: 100%;
    padding: 0 16px;
    box-sizing: border-box;
    margin: 32px auto 0;
    border-radius: var(--radius);
    background: var(--panel);
    color: var(--fg);

    > h1 {
      display: block;
      margin: 0;
      padding: 32px 0 8px 0;
      text-align: center;
      font-size: 16px;

      &.full {
        padding: 64px 0 0 0;

        > .link {
          > ::v-deep(.logo) {
            max-height: 130px;
          }
        }
      }

      > .link {
        display: block;

        > ::v-deep(.logo) {
          vertical-align: bottom;
          max-height: 100px;
        }
      }
    }

    > .about {
      display: block;
      margin: 24px 0;
      text-align: center;
      box-sizing: border-box;
    }

    > .action {
      padding-bottom: 32px;
      display: flex;
      justify-content: space-around;
    }
  }
}
</style>
