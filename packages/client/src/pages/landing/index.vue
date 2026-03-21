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
  display: flex;
  min-height: 100vh;
  
  > .left {
    flex: 0 0 450px;
    min-width: 320px;
    max-width: 450px;
    position: sticky;
    top: 0;
    left: 0;
    height: 100vh;
    display: flex;
    text-align: center;
    box-sizing: border-box;
    padding: 16px;
    z-index: 10;

    @media (max-width: 1200px) {
      position: sticky;
      flex: 0 0 auto;
      width: 100%;
      max-width: 100%;
      height: auto;
      border-bottom: 1px solid var(--divider);
    }

    @media (max-width: 450px) {
      position: sticky;
      min-width: 0;
    }

    > .bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;

      @media (max-width: 1200px) {
        display: none;
      }
    }

    > .fade {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.25);

      @media (max-width: 1200px) {
        display: none;
      }
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

      @media (max-width: 1200px) {
        width: 100%;
        max-width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 16px;
        gap: 16px;
      }

      @media (max-width: 700px) {
        flex-wrap: wrap;
        justify-content: center;
        gap: 8px;
      }


      > .form {
        position: relative;
        box-shadow: 0 12px 32px rgb(0 0 0 / 25%);

        @media (max-width: 1200px) {
          box-shadow: none;
          background: transparent;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        @media (max-width: 700px) {
          flex-wrap: wrap;
          justify-content: center;
          width: 100%;
        }

        > .bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 128px;
          background-position: center;
          background-size: cover;
          opacity: 0.75;

          @media (max-width: 1200px) {
            display: none;
          }

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

            @media (max-width: 1200px) {
              display: none;
            }
          }
        }

        > .fg {
          position: relative;
          z-index: 1;

          @media (max-width: 1200px) {
            display: flex;
            align-items: center;
            gap: 16px;
            width: 100%;
          }

          @media (max-width: 700px) {
            flex-wrap: wrap;
            justify-content: center;
          }

          > h1 {
            display: block;
            margin: 0;
            padding: 32px 32px 24px 32px;
            font-size: 16px;

            @media (max-width: 1200px) {
              padding: 8px;
              display: flex;
              align-items: center;
            }

            @media (max-width: 700px) {
              width: 100%;
              justify-content: center;
            }

            > .logo {
              vertical-align: bottom;
              max-height: 120px;
            }
          }

          > .about {
            padding: 0 32px;

            @media (max-width: 1200px) {
              padding: 8px;
              flex: 1;
              min-width: 200px;
            }

            @media (max-width: 700px) {
              width: 100%;
              text-align: center;
            }
          }

          > .action {
            padding: 32px;

            @media (max-width: 1200px) {
              padding: 8px;
              display: flex;
              gap: 8px;
            }

            > * {
              line-height: 28px;
            }
          }

          > .status {
            border-top: solid 0.5px var(--divider);
            padding: 0 32px 16px;
            font-size: 90%;

            @media (max-width: 1200px) {
              display: none;
            }

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

        @media (max-width: 1200px) {
          display: none;
        }

        > *:not(:last-child) {
          margin-right: 1.5em;
        }
      }
    }
  }
}
.right {
  flex: 1;
  min-width: 0;
  margin-left: 450px;
  padding-top: 16px;
  padding-right: 16px;

  @media (max-width: 1200px) {
    margin-left: 0;
    padding-top: 16px;
  }

  @media (max-width: 700px) {
    margin-left: 0;
    padding: 8px;
    width: 100%;
  }

}

</style>
