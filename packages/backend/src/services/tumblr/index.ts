import { Not, IsNull, MoreThan} from "typeorm"
import { parse } from 'node-html-parser';
import Parser from "rss-parser";
import { getResponse } from "@/misc/fetch.js";

import tumblr from 'tumblr.js'
import config from "@/config/index.js";
import { UserProfiles, Users } from "@/models/index.js";
import { User } from "@/models/entities/user.js";
import { DriveFiles } from "@/models/index.js";

import generateUserToken from "@/server/api/common/generate-native-user-token.js";

import { db } from "@/db/postgre.js";
import { usersChart } from "@/services/chart/index.js";
import { UserProfile } from "@/models/entities/user-profile.js";
import { uploadFromUrl } from "@/services/drive/upload-from-url.js";
import { apiLogger } from "@/server/api/logger.js";
import create from "@/services/note/create.js";
import { sanitize } from "@/misc/html/index.js";
import * as cheerio from 'cheerio';


const rssParser = new Parser();

const getInfoUrl = (blogname: string) => {
  return `https://api.tumblr.com/v2/blog/${blogname}/info?api_key=${config.tumblr.key}`;
}

const getPostsUrl = (blogname: string, offset: number) => {
  return `https://api.tumblr.com/v2/blog/${blogname}/posts?api_key=${config.tumblr.key}&offset=${offset}`;
}

export async function postToTumblr(user, note, tumblrBlog) {
  const profile = await UserProfiles.findOneByOrFail({ userId: user.id });
  if(profile.integrations.tumblr) {
    if( !note.reblogtrail || !note.reblogtrail.length) {
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
      return createdPost;
    }
  }

  return null;
}

export async function getTumblrProfile( tumblrBlog: string ) {
  const blogInfoResponse = await fetch(getInfoUrl(tumblrBlog));
  const blogInfo = await blogInfoResponse.json();
  return blogInfo.response.blog;
}

export async function transformToReblogs( post: string ) {
  const $ = cheerio.load('<div class="postRoot">' + post + '</div>');

  const linksToReblogs = $('p:has(+ blockquote) a').get().reverse();
  const reblogTrail = linksToReblogs.map( (link) => {
    const container = $(link).parent();
    const url = $(link).attr('href');
    const reblog = container.next();
    const source = $(link).text();

    $(reblog).find('.tumblr_blog').parent().next().remove();
    $(reblog).find('.tumblr_blog').parent().remove();

    let content =  $.html(reblog.contents());

    $(container).remove();
    $(reblog).remove();
    return {
      link: url,
      blog: source,
      content: content
    }
  })

  return {
    reblogTrail: reblogTrail,
    postContent: $.html($('.postRoot')),
    original: post
  }
}

const formatReblogItem = (reblog) => {
  return '<div class="reblogTrailItem">' +
    '<div class="reblogHeader">' +
      '<img class="imageReblogTumblr" src="/avatar/@' + reblog.blog + '_at_tumblr_com" />' +
      '<a href="/@' + reblog.blog + '_at_tumblr_com">@' + reblog.blog + '_at_tumblr_com</a>' +
      '<a href="' + reblog.link + '">[source]</a>' +
    '</div>' +
    '<div class="reblogContent">' +
      sanitize(reblog.content) +
    '</div>' +
  '</div>';
}

export async function getTumblrPosts( tumblrBlog: string, offset: number) {

  const feedUrl = 'https://' + tumblrBlog + '.tumblr.com/rss?cache-buster='+ Date.now();
//  const postsResponse = await fetch(getPostsUrl(tumblrBlog, offset));
//  const posts = await postsResponse.json();
  const res = await fetch(feedUrl, {
    method: "GET",
    headers: Object.assign({
        "User-Agent": config.userAgent,
        Accept: "application/rss+xml, */*"
    }),
  });
  const text = await res.text();
  const posts = await rssParser.parseString(text);
  return posts ? posts.items : [];//.response.posts.reverse();
}


export async function getUsersToFetch() {
  const usersToFetch = await Users.find({
    where: {
      tumblrUUID: Not(IsNull()),
      followersCount: MoreThan(0)
    },
    order: {
      feedUpdatedAt: 'ASC',
    },
    take: 5,
  });

  return usersToFetch;
}

export async function updateTumblrUser( tumblrUsername: string ) {
  apiLogger.warn("updating tumblr user "+ tumblrUsername);
  let blogInfo;
  let user = await Users.findOneBy({
    "username": tumblrUsername + '_at_tumblr_com'
  });
  if(!user) {
    return null;
  }

  if(!user.updatedAt || (Date.now() - new Date(user.updatedAt) ) > 10 * 60 * 1000) {
    blogInfo = await getTumblrProfile(tumblrUsername);
    if(!blogInfo) {
      return null;
    }

    let userNeedsUpdate = false;
    const newUsername = blogInfo.name + '_at_tumblr_com';
    apiLogger.warn(newUsername + ' comparing with ' + user.username);
    if(newUsername != user.username) {
      user.username = newUsername;
      user.usernameLower = newUsername.toLowerCase();
      userNeedsUpdate = true;
    }

    if(user.avatarId) {
      const avatarFile = await DriveFiles.findOneBy({ id: user.avatarId });
        apiLogger.warn("comparing avatar: " + avatarFile.src);
      if(avatarFile && avatarFile.src != blogInfo.avatar[0].url) {
        const newAvatarFile = await uploadFromUrl({
          url: blogInfo.avatar[0].url,
          user: user,
        });
        user.avatarId = newAvatarFile.id;
      }
      userNeedsUpdate = true;
    }

    if(user.bannerId) {
      const bannerFile = await DriveFiles.findOneBy({ id: user.bannerId });
      if(bannerFile && bannerFile.src != blogInfo.theme.header_image) {
        const newBannerFile = await uploadFromUrl({
          url: blogInfo.theme.header_image,
          user: user,
        });
        user.bannerId = newBannerFile.id;
      }
      userNeedsUpdate = true;
    }

    if(userNeedsUpdate) {
      await db.transaction(async (transactionalEntityManager) => {
        user = await transactionalEntityManager.save(user);
      });
    }

    const profile = await UserProfiles.findOneByOrFail({ userId: user.id });
    if(profile) {
      let needProfileUpdate = false;
      if( profile.description != blogInfo.description) {
        profile.description = sanitize(blogInfo.description);
        needProfileUpdate = true;
      }

      if( profile.url != 'https://' +  blogInfo.name + '.tumblr.com') {
        profile.url = 'https://' +  blogInfo.name + '.tumblr.com';
        needProfileUpdate = true;
      }

      if(needProfileUpdate) {
        await db.transaction(async (transactionalEntityManager) => {
          await transactionalEntityManager.save(profile);
        });
      }
    }
  }
  return {user: user, blogInfo: blogInfo};
}

export async function createNewTumblrUser( username: string ) {
  const blogInfo = await getTumblrProfile(username);
  if(!blogInfo) {
    return null;
  }

  let user = await Users.findOneBy({
    "tumblrUUID": blogInfo.uuid
  });
  if(user) {
    return await updateTumblrUser(user.username);
  }

  let account: User | null = null;
  const newUsername = blogInfo.name + '_at_tumblr_com';
  user = new User({
    id: blogInfo.uuid,
    tumblrUUID: blogInfo.uuid,
    createdAt: new Date(),
    username: newUsername,
    usernameLower: newUsername.toLowerCase(),
    host: null,
    token: generateUserToken(),
    isAdmin: false,
    isBot: true,
  });

  await db.transaction(async (transactionalEntityManager) => {
    account = await transactionalEntityManager.save(user);
    if(account) {
      await transactionalEntityManager.save(
        new UserProfile({
          userId: account.id,
          url: 'https://' + newUsername,
          autoAcceptFollowed: true,
          password: '',
          description: sanitize(blogInfo.description),
        }),
      );

      usersChart.update(account, true);
    }
  });
  if(account) {
    const avatarFile = await uploadFromUrl({
      url: blogInfo.avatar[0].url,
      user: account,
    });
    const bannerFile = await uploadFromUrl({
      url: blogInfo.theme.header_image,
      user: account,
    });
    (account as User).avatarId = avatarFile.id;
    (account as User).bannerId = bannerFile.id;
    await db.transaction(async (transactionalEntityManager) => {
      account = await transactionalEntityManager.save(account);
    });
  }
  return {user: user, account: account, blogInfo: blogInfo};
}

export async function fetchTumblrFeed( user: User ) {
  if(user.tumblrUUID) {
    const responses = {
      user: user.username,
      new: []
    }
    const blogInfo = await getTumblrProfile(user.tumblrUUID);
    if(!blogInfo) {
      return;
    }
    let posts = await getTumblrPosts(blogInfo.name, 0);
    posts = posts.reverse()
    const lastUserUpdate = user.updatedAt;
    const transforms = []

    for(const post of posts) {
        const postDate = new Date(post.isoDate);
        if (!lastUserUpdate || !user.feedUpdatedAt || postDate > lastUserUpdate) {
          responses.new.push(post);
          let title = '';
          if(post.title) {
            const titleSansEllipsis = post.title.split('…')[0];
            if( !post.content || post.content.indexOf(titleSansEllipsis) < 0) {
              title = '<div class="tumblrTitle">' + sanitize(post.title) + '</div>';
            } else {
              title = '';
            }
          }
          let { reblogTrail, postContent } = await transformToReblogs(post.content)
          transforms.push( await transformToReblogs(post.content))

          const reblogTrailBlock = reblogTrail.length?
            '<div class="reblogTrail">' +
              reblogTrail.map(formatReblogItem).join('<hr/>') +
            '</div>' :
            '';

          const note = await create(user, {
            createdAt: new Date(),
            text:
              '<div class="tumblrPost">'+
                reblogTrailBlock +
                title+
                postContent +
              "</div>",
            apHashtags: post.categories
          });
        }
    };

    await Users.update(user.id, { feedUpdatedAt: new Date() });

    return transforms; // response;
  }
  return null;
}