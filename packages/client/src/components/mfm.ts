import { defineComponent, h } from "vue";
import * as mfm from "mfm-js";
import type { VNode } from "vue";
import MkUrl from "@/components/global/MkUrl.vue";
import MkLink from "@/components/MkLink.vue";
import MkMention from "@/components/MkMention.vue";
import MkEmoji from "@/components/global/MkEmoji.vue";
import { concat } from "@/scripts/array";
import MkFormula from "@/components/MkFormula.vue";
import MkCode from "@/components/MkCode.vue";
import MkGoogle from "@/components/MkGoogle.vue";
import MkSparkle from "@/components/MkSparkle.vue";
import MkA from "@/components/global/MkA.vue";
import { host } from "@/config";
import { reducedMotion } from "@/scripts/reduced-motion";
import { defaultStore } from "@/store";

export default defineComponent({
	props: {
		text: {
			type: String,
			required: true,
		},
		plain: {
			type: Boolean,
			default: false,
		},
		nowrap: {
			type: Boolean,
			default: false,
		},
		author: {
			type: Object,
			default: null,
		},
		i: {
			type: Object,
			default: null,
		},
		customEmojis: {
			required: false,
		},
		isNote: {
			type: Boolean,
			default: true,
		},
	},

	render() {
		if (this.text == null || this.text === "") return;

		const isPlain = this.plain;

		const ast = (isPlain ? mfm.parseSimple : mfm.parse)(this.text);

		const validTime = (t: string | null | undefined) => {
			if (t == null) return null;
			return t.match(/^[0-9.]+s$/) ? t : null;
		};

		const validNumber = (n: string | null | undefined) => {
			if (n == null) return null;
			const parsed = parseFloat(n);
			return !isNaN(parsed) && isFinite(parsed) && parsed > 0;
		};
		// const validEase = (e: string | null | undefined) => {
		// 	if (e == null) return null;
		// 	return e.match(/(steps)?\(-?[0-9.]+,-?[0-9.]+,-?[0-9.]+,-?[0-9.]+\)/)
		// 		? (e.startsWith("steps") ? e : "cubic-bezier" + e)
		// 		: null
		// }

		const genEl = (ast: mfm.MfmNode[]) =>
			concat(
				ast.map((token, index): VNode[] => {
					switch (token.type) {
						case "text": {
							const text = token.props.text.replace(/(\r\n|\n|\r)/g, "\n");

							if (!this.plain) {
								const res = [];
								for (const t of text.split("\n")) {
									res.push(h("br"));
									res.push(t);
								}
								res.shift();
								return res;
							} else {
								return [text.replace(/\n/g, " ")];
							}
						}

						case "bold": {
							return [h("b", genEl(token.children))];
						}

						case "strike": {
							return [h("del", genEl(token.children))];
						}

						case "italic": {
							return h(
								"i",
								{
									style: "font-style: oblique;",
								},
								genEl(token.children),
							);
						}

						case "fn": {
							// TODO: CSSを文字列で組み立てていくと token.props.args.~~~ 経由でCSSインジェクションできるのでよしなにやる
							let style: string;
							switch (token.props.name) {
								case "tada": {
									const speed = validTime(token.props.args.speed) || "1s";
									const delay = validTime(token.props.args.delay) || "0s";
									const loop = validNumber(token.props.args.loop) || "infinite";
									// const ease = validEase(token.props.args.ease) || "linear";
									style = `font-size: 150%; animation: tada ${speed} ${delay} linear ${loop} both;`;
									break;
								}
								case "jelly": {
									const speed = validTime(token.props.args.speed) || "1s";
									const delay = validTime(token.props.args.delay) || "0s";
									const loop = validNumber(token.props.args.loop) || "infinite";
									style = `animation: mfm-rubberBand ${speed} ${delay} linear ${loop} both;`;
									break;
								}
								case "twitch": {
									const speed = validTime(token.props.args.speed) || "0.5s";
									const delay = validTime(token.props.args.delay) || "0s";
									const loop = validNumber(token.props.args.loop) || "infinite";
									style = `animation: mfm-twitch ${speed} ${delay} ease ${loop};`;
									break;
								}
								case "shake": {
									const speed = validTime(token.props.args.speed) || "0.5s";
									const delay = validTime(token.props.args.delay) || "0s";
									const loop = validNumber(token.props.args.loop) || "infinite";
									style = `animation: mfm-shake ${speed} ${delay} ease ${loop};`;
									break;
								}
								case "spin": {
									const direction = token.props.args.left
										? "reverse"
										: token.props.args.alternate
										? "alternate"
										: "normal";
									const anime = token.props.args.x
										? "mfm-spinX"
										: token.props.args.y
										? "mfm-spinY"
										: "mfm-spin";
									const speed = validTime(token.props.args.speed) || "1.5s";
									const delay = validTime(token.props.args.delay) || "0s";
									const loop = validNumber(token.props.args.loop) || "infinite";
									style = `animation: ${anime} ${speed} ${delay} linear ${loop}; animation-direction: ${direction};`;
									break;
								}
								case "jump": {
									const speed = validTime(token.props.args.speed) || "0.75s";
									const delay = validTime(token.props.args.delay) || "0s";
									const loop = validNumber(token.props.args.loop) || "infinite";
									style = `animation: mfm-jump ${speed} ${delay} linear ${loop};`;
									break;
								}
								case "bounce": {
									const speed = validTime(token.props.args.speed) || "0.75s";
									const delay = validTime(token.props.args.delay) || "0s";
									const loop = validNumber(token.props.args.loop) || "infinite";
									style = `animation: mfm-bounce ${speed} ${delay} linear ${loop}; transform-origin: center bottom;`;
									break;
								}
								case "rainbow": {
									const speed = validTime(token.props.args.speed) || "1s";
									const delay = validTime(token.props.args.delay) || "0s";
									const loop = validNumber(token.props.args.loop) || "infinite";
									style = `animation: mfm-rainbow ${speed} ${delay} linear ${loop};`;
									break;
								}
								case "sparkle": {
									if (reducedMotion()) {
										return genEl(token.children);
									}
									return h(MkSparkle, {}, genEl(token.children));
								}
								case "fade": {
									const direction = token.props.args.out
										? "alternate-reverse"
										: "alternate";
									const speed = validTime(token.props.args.speed) || "1.5s";
									const delay = validTime(token.props.args.delay) || "0s";
									const loop = validNumber(token.props.args.loop) || "infinite";
									style = `animation: mfm-fade ${speed} ${delay} linear ${loop}; animation-direction: ${direction};`;
									break;
								}
								case "flip": {
									const transform =
										token.props.args.h && token.props.args.v
											? "scale(-1, -1)"
											: token.props.args.v
											? "scaleY(-1)"
											: "scaleX(-1)";
									style = `transform: ${transform};`;
									break;
								}
								case "x2": {
									return h(
										"span",
										{
											class: "mfm-x2",
										},
										genEl(token.children),
									);
								}
								case "x3": {
									return h(
										"span",
										{
											class: "mfm-x3",
										},
										genEl(token.children),
									);
								}
								case "x4": {
									return h(
										"span",
										{
											class: "mfm-x4",
										},
										genEl(token.children),
									);
								}
								case "font": {
									const family = token.props.args.serif
										? "serif"
										: token.props.args.monospace
										? "monospace"
										: token.props.args.cursive
										? "cursive"
										: token.props.args.fantasy
										? "fantasy"
										: token.props.args.emoji
										? "emoji"
										: token.props.args.math
										? "math"
										: null;
									if (family) style = `font-family: ${family};`;
									break;
								}
								case "blur": {
									return h(
										"span",
										{
											class: "_blur_text",
										},
										genEl(token.children),
									);
								}
								case "rotate": {
									const rotate = token.props.args.x
										? "perspective(128px) rotateX"
										: token.props.args.y
										? "perspective(128px) rotateY"
										: "rotate";
									const degrees = parseInt(token.props.args.deg) || "90";
									style = `transform: ${rotate}(${degrees}deg); transform-origin: center center;`;
									break;
								}
								case "position": {
									const x = parseFloat(token.props.args.x ?? "0");
									const y = parseFloat(token.props.args.y ?? "0");
									style = `transform: translateX(${x}em) translateY(${y}em);`;
									break;
								}
								case "crop": {
									const top = parseFloat(token.props.args.top ?? "0");
									const right = parseFloat(token.props.args.right ?? "0");
									const bottom = parseFloat(token.props.args.bottom ?? "0");
									const left = parseFloat(token.props.args.left ?? "0");
									style = `clip-path: inset(${top}% ${right}% ${bottom}% ${left}%);`;
									break;
								}
								case "scale": {
									const x = Math.min(parseFloat(token.props.args.x ?? "1"), 5);
									const y = Math.min(parseFloat(token.props.args.y ?? "1"), 5);
									style = `transform: scale(${x}, ${y});`;
									break;
								}
								case "fg": {
									let color = token.props.args.color;
									if (!/^[0-9a-f]{3,6}$/i.test(color)) color = "f00";
									style = `color: #${color};`;
									break;
								}
								case "bg": {
									let color = token.props.args.color;
									if (!/^[0-9a-f]{3,6}$/i.test(color)) color = "f00";
									style = `background-color: #${color};`;
									break;
								}
								case "small": {
									return h(
										"small",
										{
											style: "opacity: 0.7;",
										},
										genEl(token.children),
									);
								}
								case "center": {
									return h(
										"div",
										{
											style: "text-align: center;",
										},
										genEl(token.children),
									);
								}
							}
							if (style == null) {
								return h("span", {}, [
									"$[",
									token.props.name,
									" ",
									...genEl(token.children),
									"]",
								]);
							} else {
								return h(
									"span",
									{
										style: `display: inline-block;${style}`,
									},
									genEl(token.children),
								);
							}
						}

						case "small": {
							return [
								h(
									"small",
									{
										style: "opacity: 0.7;",
									},
									genEl(token.children),
								),
							];
						}

						case "center": {
							return [
								h(
									"div",
									{
										style: "text-align: center;",
									},
									genEl(token.children),
								),
							];
						}

						case "url": {
							return [
								h(MkUrl, {
									key: Math.random(),
									url: token.props.url,
									rel: "nofollow noopener",
								}),
							];
						}

						case "link": {
							return [
								h(
									MkLink,
									{
										key: Math.random(),
										url: token.props.url,
										rel: "nofollow noopener",
									},
									genEl(token.children),
								),
							];
						}

						case "mention": {
							return [
								h(MkMention, {
									key: Math.random(),
									host:
										(token.props.host == null &&
										this.author &&
										this.author.host != null
											? this.author.host
											: token.props.host) || host,
									username: token.props.username,
								}),
							];
						}

						case "hashtag": {
							return [
								h(
									MkA,
									{
										key: Math.random(),
										to: `/tags/${encodeURIComponent(token.props.hashtag)}`,
										style: "color:var(--hashtag);",
									},
									`#${token.props.hashtag}`,
								),
							];
						}

						case "blockCode": {
							return [
								h(MkCode, {
									key: Math.random(),
									code: token.props.code,
									lang: token.props.lang,
								}),
							];
						}

						case "inlineCode": {
							return [
								h(MkCode, {
									key: Math.random(),
									code: token.props.code,
									inline: true,
								}),
							];
						}

						case "quote": {
							if (!this.nowrap) {
								return [h("blockquote", genEl(token.children))];
							} else {
								return [
									h(
										"span",
										{
											class: "quote",
										},
										genEl(token.children),
									),
								];
							}
						}

						case "emojiCode": {
							return [
								h(MkEmoji, {
									key: Math.random(),
									emoji: `:${token.props.name}:`,
									customEmojis: this.customEmojis,
									normal: this.plain,
								}),
							];
						}

						case "unicodeEmoji": {
							return [
								h(MkEmoji, {
									key: Math.random(),
									emoji: token.props.emoji,
									customEmojis: this.customEmojis,
									normal: this.plain,
								}),
							];
						}

						case "mathInline": {
							return [
								h(MkFormula, {
									key: Math.random(),
									formula: token.props.formula,
									block: false,
								}),
							];
						}

						case "mathBlock": {
							return [
								h(MkFormula, {
									key: Math.random(),
									formula: token.props.formula,
									block: true,
								}),
							];
						}

						case "search": {
							// Disable "search" keyword
							// (see the issue #9816 on Codeberg)
							if (token.props.content.slice(-6).toLowerCase() === "search") {
								const sentinel = "#";
								let ast2 = (isPlain ? mfm.parseSimple : mfm.parse)(
									token.props.content.slice(0, -6) + sentinel,
								);
								if (
									ast2[ast2.length - 1].type === "text" &&
									ast2[ast2.length - 1].props.text.endsWith(sentinel)
								) {
									ast2[ast2.length - 1].props.text = ast2[
										ast2.length - 1
									].props.text.slice(0, -1);
								} else {
									// I don't think this scope is reachable
									console.warn(
										"Something went wrong while parsing MFM. Please send a bug report, if possible.",
									);
								}

								let prefix = "\n";
								if (
									index === 0 ||
									[
										"blockCode",
										"center",
										"mathBlock",
										"quote",
										"search",
									].includes(ast[index - 1].type)
								) {
									prefix = "";
								}

								return [
									prefix,
									...genEl(ast2),
									`${token.props.content.slice(-6)}\n`,
								];
							}

							return [
								h(MkGoogle, {
									key: Math.random(),
									q: token.props.query,
								}),
							];
						}

						case "plain": {
							return [h("span", genEl(token.children))];
						}

						default: {
							console.error("unrecognized ast type:", token.type);

							return [];
						}
					}
				}),
			);

		// Parse ast to DOM
		return h("span", genEl(ast));
	},
});
