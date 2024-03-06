import type Koa from "koa";
import Router from "@koa/router";
import { v4 as uuid } from "uuid";
import { OAuth } from "oauth";
import { IsNull } from "typeorm";
import { getJson } from "@/misc/fetch.js";
import { publishMainStream } from "@/services/stream.js";
import config from "@/config/index.js";
import { fetchMeta } from "@/misc/fetch-meta.js";
import { Users, UserProfiles } from "@/models/index.js";
import type { ILocalUser } from "@/models/entities/user.js";
import signin from "../common/signin.js";
import { redisClient } from "../../../db/redis.js";
import { apiLogger } from "../logger.js";
import tumblr from 'tumblr.js'

const wrapBodyMessages = (text: String) => {
  return `<p style="background-color:rgb(0, 25, 53); color:#FFF; padding: 48px">${text}</p>`
}

const getTumblrUserData = async (accessToken: string, tokenSecret: string) => {
  const client = tumblr.createClient({
    consumer_key: config.tumblr.key,
    consumer_secret: config.tumblr.secret,
    token: accessToken,
    token_secret: tokenSecret,
  });

  const userData = await new Promise((resolve, reject) => {
    client.userInfo(function (err, data) {
      if(err) {
        apiLogger.error('error retrieving tumblr user info: ' + JSON.stringify(err))
        reject(err);
      } else {
        resolve(data);
      }
    })
  });

  const { name } = userData.user;
  let primaryBlog = userData.user.blogs[0].name;
  const blogs = userData.user.blogs.map( (blog) => {
    if(blog.primary) {
      primaryBlog = blog.name;
    }
    return blog.name;
  })
  return {
    name,
    primaryBlog,
    blogs,
  }
}

const auth = (opts) => {
  const oauth = new OAuth(
    'https://www.tumblr.com/oauth/request_token',
    'https://www.tumblr.com/oauth/access_token',
    opts.consumerKey,
    opts.consumerSecret,
    '1.0A',
    opts.callbackUrl,
    'HMAC-SHA1');
  const begin = () => new Promise((resolve, reject) => {
    oauth.getOAuthRequestToken((err, token, secret) => {
      if (err) { // on error getting request tokens
        return reject(err);
      }
      // got oauth request tokens
      resolve({
        requestToken: token,
        requestTokenSecret: secret,
        url: `https://www.tumblr.com/oauth/authorize?oauth_token=${token}`
      });
    });
  });
  const done = (ctx, verifier) => new Promise((resolve, reject) => {
    oauth.getOAuthAccessToken(ctx.requestToken, ctx.requestTokenSecret, verifier, (err, token, secret, res) => {
      if (err) { // on error getting access tokens
        return reject(err);
      }
      // got oauth access tokens
      resolve({
        accessToken: token,
        accessTokenSecret: secret,
        userId: res.user_id,
        screenName: res.screen_name
      });
    });
   });
  return {
    begin,
    done
  };
}



function getUserToken(ctx: Koa.BaseContext): string | null {
  return ((ctx.headers["cookie"] || "").match(/igi=(\w+)/) || [null, null])[1];
}

function compareOrigin(ctx: Koa.BaseContext): boolean {
  function normalizeUrl(url?: string): string {
    return url == null
      ? ""
      : url.endsWith("/")
      ? url.substr(0, url.length - 1)
      : url;
  }

  const referer = ctx.headers["referer"];

  return normalizeUrl(referer) === normalizeUrl(config.url);
}

// Init router
const router = new Router();

router.get("/disconnect/tumblr", async (ctx) => {
  if (!compareOrigin(ctx)) {
    ctx.throw(400, "invalid origin");
    return;
  }


  const userToken = getUserToken(ctx);
  if (userToken == null) {
    ctx.throw(400, "signin required");
    return;
  }

  const user = await Users.findOneByOrFail({
    host: IsNull(),
    token: userToken,
  });

  const profile = await UserProfiles.findOneByOrFail({ userId: user.id });

  profile.integrations.tumblr = undefined;

  await UserProfiles.update(user.id, {
    integrations: profile.integrations,
  });

  ctx.body = wrapBodyMessages("tumblr disconnected");

  // Publish i updated event
  publishMainStream(
    user.id,
    "meUpdated",
    await Users.pack(user, user, {
      detail: true,
      includeSecrets: true,
    }),
  );
});

async function getTbAuth() {
  const meta = await fetchMeta(true);

  if (
    config.tumblr
  ) {
    return auth({
      consumerKey: config.tumblr.key,
      consumerSecret: config.tumblr.secret,
      callbackUrl: `${config.url}/api/tb/cb`,
    });
  } else {
    return null;
  }
}

router.get("/connect/tumblr", async (ctx) => {
  apiLogger.warn('1');
  if (!compareOrigin(ctx)) {
    ctx.throw(400, "invalid origin");
    return;
  }
  apiLogger.warn('2');
  const userToken = getUserToken(ctx);
  if (userToken == null) {
    ctx.throw(400, "signin required");
    return;
  }
  apiLogger.warn('3');
  const tbAuth = await getTbAuth();
  const tbCtx = await tbAuth!.begin();
  redisClient.set(userToken, JSON.stringify(tbCtx));
  apiLogger.warn('4');
  ctx.redirect(tbCtx.url);
  apiLogger.warn('5');
});

router.get("/signin/tumblr", async (ctx) => {
  const tbAuth = await getTbAuth();
  const tbCtx = await tbAuth!.begin();

  const sessid = uuid();

  redisClient.set(sessid, JSON.stringify(tbCtx));

  ctx.cookies.set("signin_with_tumblr_sid", sessid, {
    path: "/",
    secure: config.url.startsWith("https"),
    httpOnly: true,
  });
  ctx.redirect(tbCtx.url);
});

router.get("/tb/cb", async (ctx) => {
  const userToken = getUserToken(ctx);
  const tbAuth = await getTbAuth();

  if (userToken == null) {
    const sessid = ctx.cookies.get("signin_with_tumblr_sid");

    if (sessid == null) {
      ctx.throw(400, "invalid session");
      return;
    }

    const get = new Promise<any>((res, rej) => {
      redisClient.get(sessid, async (_, tbCtx) => {
        res(tbCtx);
      });
    });

    const tbCtx = await get;

    const verifier = ctx.query.oauth_verifier;
    if (!verifier || typeof verifier !== "string") {
      ctx.throw(400, "invalid session");
      return;
    }

    const result = await tbAuth!.done(JSON.parse(tbCtx), verifier);

    const link = await UserProfiles.createQueryBuilder()
      .where("\"integrations\"->'tumblr'->>'name' = :name", {
        name: result.name,
      })
      .andWhere('"userHost" IS NULL')
      .getOne();

    if (link == null) {
      ctx.throw(
        404,
        `@${result.name} Can't be found...`,
      );
      return;
    }

    signin(
      ctx,
      (await Users.findOneBy({ id: link.userId })) as ILocalUser,
      true,
    );
  } else {
    const verifier = ctx.query.oauth_verifier;

    if (!verifier || typeof verifier !== "string") {
      ctx.throw(400, "invalid session");
      return;
    }

    const get = new Promise<any>((res, rej) => {
      redisClient.get(userToken, async (_, tbCtx) => {
        res(tbCtx);
      });
    });

    const tbCtx = await get;

    const result = await tbAuth!.done(JSON.parse(tbCtx), verifier);

    const { name, primaryBlog, blogs } = await getTumblrUserData(result.accessToken, result.accessTokenSecret);

    const user = await Users.findOneByOrFail({
      host: IsNull(),
      token: userToken,
    });

    const profile = await UserProfiles.findOneByOrFail({ userId: user.id });

    await UserProfiles.update(user.id, {
      integrations: {
        ...profile.integrations,
        tumblr: {
          accessToken: result.accessToken,
          accessTokenSecret: result.accessTokenSecret,
          name: name,
          primary: primaryBlog,
          blogs: blogs
        },
      },
    });

    ctx.body = wrapBodyMessages(`tumblr: @${name} connected to Goblin: @${user.username} successfully!`);

    // Publish i updated event
    publishMainStream(
      user.id,
      "meUpdated",
      await Users.pack(user, user, {
        detail: true,
        includeSecrets: true,
      }),
    );
  }
});

export default router;
