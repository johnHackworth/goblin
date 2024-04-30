<template>
  <div v-if="meta" class="rsqzvsbo">
    <div class="left">
      <div class="main">
        <div class="logo">
          <Logo />
        </div>
        <div class="form _panel">
          <div class="bg">
            <div class="fade"></div>
          </div>
          <div class="fg">
            <h1>
              <img
                v-if="meta.logoImageUrl"
                class="logo"
                :src="meta.logoImageUrl"
              /><span v-else class="text">{{
                instanceName
              }}</span>
            </h1>
            <div class="about">
              <div
                class="desc"
                v-html="
                  meta.description || i18n.ts.headlineMisskey
                "
              ></div>
            </div>
            <div class="action">
              <MkButton inline gradate @click="signup()">{{
                i18n.ts.signup
              }}</MkButton>
              <MkButton inline @click="signin()">{{
                i18n.ts.login
              }}</MkButton>
            </div>
            <div v-if="onlineUsersCount && stats" class="status">
              <I18n
                :src="i18n.ts.onlineUsersCount"
                text-tag="span"
                class="online"
              >
                <template #n
                  ><b>{{ onlineUsersCount }}</b></template
                >
              </I18n>
            </div>
            <button class="_button _acrylic menu" @click="showMenu">
              <i class="ph-dots-three-outline ph-bold ph-lg"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="right">
      <Featured />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Featured from "./featured.vue";
import { toUnicode } from "punycode/";
import Logo from "@/components/icons/logo.vue";
import XSigninDialog from "@/components/MkSigninDialog.vue";
import XSignupDialog from "@/components/MkSignupDialog.vue";
import MkButton from "@/components/MkButton.vue";
import XNote from "@/components/MkNote.vue";
import { host, instanceName } from "@/config";
import * as os from "@/os";
import number from "@/filters/number";
import { i18n } from "@/i18n";

export default defineComponent({
  components: {
    MkButton,
    XNote,
    Featured,
    Logo,
  },

  data() {
    return {
      host: toUnicode(host),
      instanceName,
      meta: null,
      stats: null,
      tags: [],
      onlineUsersCount: null,
      i18n,
    };
  },

  created() {
    os.api("meta", { detail: true }).then((meta) => {
      this.meta = meta;
    });

    os.api("stats").then((stats) => {
      this.stats = stats;
    });

    os.api("get-online-users-count").then((res) => {
      this.onlineUsersCount = res.count;
    });

    os.api("hashtags/list", {
      sort: "+mentionedLocalUsers",
      limit: 8,
    }).then((tags) => {
      this.tags = tags;
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

    showMenu(ev) {
      os.popupMenu(
        [
          {
            text: i18n.t("aboutX", { x: instanceName }),
            icon: "ph-info ph-bold ph-lg",
            action: () => {
              os.pageWindow("/about");
            },
          },
        ],
        ev.currentTarget ?? ev.target,
      );
    },
    number,
  },
});
</script>

<style lang="scss" scoped>

:deep(.logo) {
  svg {
    height: 100px;
    width: 150px;
    @media (max-width: 450px) {
      width: 130px;
    }
  }
}
.rsqzvsbo {
  > .left {
    max-width: 450px;
    position: fixed;
    top: 0;
    left: 0;
    display: flex;
    text-align: center;
    box-sizing: border-box;
    padding: 16px;

    @media (max-width: 1200px) {
      max-width: 700px;
      position: absolute;
    }

    > .bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    > .fade {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.25);
    }

    > .emojis {
      position: absolute;
      bottom: 32px;
      left: 35px;

      > * {
        margin-right: 8px;
      }

      @media (max-width: 1200px) {
        display: none;
      }
    }

    > .main {
      position: relative;
      width: min(460px, 100%);
      margin: auto;


      > .form {
        position: relative;
        box-shadow: 0 12px 32px rgb(0 0 0 / 25%);

        > .bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 128px;
          background-position: center;
          background-size: cover;
          opacity: 0.75;

          > .fade {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 128px;
            background: linear-gradient(
              0deg,
              var(--panel),
              var(--X15)
            );
          }
        }

        > .fg {
          position: relative;
          z-index: 1;

          > h1 {
            display: block;
            margin: 0;
            padding: 32px 32px 24px 32px;
            font-size: 16px;

            > .logo {
              vertical-align: bottom;
              max-height: 120px;
            }
          }

          > .about {
            padding: 0 32px;
          }

          > .action {
            padding: 32px;

            > * {
              line-height: 28px;
            }
          }

          > .status {
            border-top: solid 0.5px var(--divider);
            padding: 0 32px 16px;
            font-size: 90%;

            > div {
              > span:not(:last-child) {
                padding-right: 1em;
                margin-right: 1em;
                border-right: solid 0.5px var(--divider);
              }
            }

            > .online {
              ::v-deep(b) {
                color: #41b781;
              }

              ::v-deep(span) {
                opacity: 0.7;
              }
            }
          }

          > .menu {
            position: absolute;
            top: 16px;
            right: 16px;
            width: 32px;
            height: 32px;
            border-radius: 8px;
          }
        }
      }

      > .nav {
        position: relative;
        z-index: 2;
        margin-top: 20px;
        color: #fff;
        text-shadow: 0 0 8px black;
        font-size: 0.9em;

        > *:not(:last-child) {
          margin-right: 1.5em;
        }
      }
    }
  }
}
.right {
  position: absolute;
  top: 0;
  right: 50%;
  margin-right: -320px;

  @media (max-width: 1600px) {
    right: 0;
    margin-right: 10px;
  }

  @media (max-width: 1200px) {
    top: 450px;
    right: inherit;
    left: 10px;
    margin-right: 0;
  }

  @media (max-width: 700px) {
    left: 0px;
  }

}

</style>
