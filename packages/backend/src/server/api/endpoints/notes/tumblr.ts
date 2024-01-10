import Parser from "rss-parser";
import { getResponse } from "../../../../misc/fetch.js";
import config from "../../../../config/index.js";
import define from "../../define.js";

import { fetchTumblrFeed, getUsersToFetch } from "@/services/tumblr/index.js";
import { Users } from "../../../../models/index.js";

const rssParser = new Parser();
export const meta = {
    tags: [
        "meta"
    ],
    requireCredential: false,
    allowGet: true,
    cacheSec: 60 * 3
};
export const paramDef = {
    type: "object",
    properties: {
        username: {
            type: "string"
        }
    },
};

export default define(meta, paramDef, async (ps)=>{
  let usersToFetch = [];
  let responses = [];
  if(ps.username) {
    let user = await Users.findOneBy({
      "username": ps.username
    });
    if(user) {
      usersToFetch.push(user);
    }
  } else {
    usersToFetch = await getUsersToFetch();
  }
  for(const user of usersToFetch) {
    responses.push(await fetchTumblrFeed(user));
  }
  return {
    responses: responses,
    users: usersToFetch
  }
});

const old = async () =>  {
    const res = await getResponse({
    url: '',//feedUrl,
    method: "GET",
    headers: Object.assign({
        "User-Agent": config.userAgent,
        Accept: "application/rss+xml, */*"
    }),
    timeout: 5000
  });
  const text = await res.text();
  const posts = rssParser.parseString(text);
//  const postFrom = user.feedUpdatedAt
// user .feedUpdatedAt = new Date();
}