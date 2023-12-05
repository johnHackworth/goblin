import tumblr from 'tumblr.js'
import config from "@/config/index.js";
import { UserProfiles } from "@/models/index.js";

import { apiLogger } from "@/server/api/logger.js";

const getPostURL = (blogName: string) => {
  return `https://api.tumblr.com/v2/blog/${blogName}/post`;
}

export async function postToTumblr(user, note, tumblrBlog) {
  const profile = await UserProfiles.findOneByOrFail({ userId: user.id });
  if(profile.integrations.tumblr) {
    if( !note.reblogtrail || !note.reblogtrail.length) {
      const url = getPostURL(tumblrBlog);
      const { accessToken, accessTokenSecret } = profile.integrations.tumblr;
      const client = tumblr.createClient({
        consumer_key: config.tumblr.key,
        consumer_secret: config.tumblr.secret,
        token: accessToken,
        token_secret: accessTokenSecret,
      });

      const requestParams = {
        type: 'text',
        state: 'published',
        tags: note.tags? note.tags.join(','): '',
        format: 'html',
        native_inline_images: true,
        body: note.text
      }
      const createdPost = await client.createLegacyPost(tumblrBlog, requestParams);
      apiLogger.warn('created tumblr post: ' + JSON.stringify(createdPost));
      return createdPost;
    }
  }

  return null;
}
