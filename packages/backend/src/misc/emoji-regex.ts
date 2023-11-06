import twemoji from "twemoji-parser/dist/lib/regex.js";
const twemojiRegex = twemoji.default;

export const emojiRegex = new RegExp(`(${twemojiRegex.source})`);
export const emojiRegexAtStartToEnd = new RegExp(`^(${twemojiRegex.source})$`);
