<template>
  <a
    v-if="user"
    class="pfp"
    :title="acct(user)"
    :href="userPage(user)"
  >
    <img class="pfp-image" :src="user.avatarUrl" decoding="async" />
  </a>
  <a
    v-else-if="syntheticUser"
    class="pfp"
    :title="syntheticUser.user"
    :href="props.url"
  >
    <img class="pfp-image" :src="getSyntheticUrl()" decoding="async" />
  </a>
  <span
    v-else
    class="pfp"
  >
    <img
      class="pfp-image"
      src="/static-assets/user-unknown.png"
    />
  </span>
 </template>

<script lang="ts" setup>
import type * as misskey from "firefish-js";
import { acct, userPage } from "@/filters/user";
import { getUserAndHostFromUrl } from "@/helpers/note/note-content"

const props = withDefaults(
  defineProps<{
    user: misskey.entities.User;
    url?: string;
  }>(),
  {
  },
);

let syntheticUser = $ref( null );
if(!props.user && props.url) {
  syntheticUser = getUserAndHostFromUrl( props.url );
}
const getSyntheticUrl = () => {
  if(! syntheticUser ) {
    return '/static-assets/user-unknown.png'
  }
  return '/avatar/' + syntheticUser.full;
}


</script>

<style lang="scss" scoped>
.pfp {
  width: 48px;
  height: 48px;
  background: rgba(200,200,200, 0.3);
  display: flex;

  .pfp-image {
    width: 48px;
    max-height: 48px;
  }
}

</style>