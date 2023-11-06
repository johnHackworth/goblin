/**
 * BOOT LOADER
 * サーバーからレスポンスされるHTMLに埋め込まれるスクリプトで、以下の役割を持ちます。
 * - 翻訳ファイルをフェッチする。
 * - バージョンに基づいて適切なメインスクリプトを読み込む。
 * - キャッシュされたコンパイル済みテーマを適用する。
 * - クライアントの設定値に基づいて対応するHTMLクラス等を設定する。
 * テーマをこの段階で設定するのは、メインスクリプトが読み込まれる間もテーマを適用したいためです。
 * 注: webpackは介さないため、このファイルではrequireやimportは使えません。
 */

"use strict";

// ブロックの中に入れないと、定義した変数がブラウザのグローバルスコープに登録されてしまい邪魔なので
(async () => {
	window.onerror = (e) => {
		console.error(e);
		renderError("SOMETHING_HAPPENED", e);
	};
	window.onunhandledrejection = (e) => {
		console.error(e);
		renderError("SOMETHING_HAPPENED_IN_PROMISE", e);
	};

	//#region Detect language & fetch translations
	const v = localStorage.getItem("v") || VERSION;

	const supportedLangs = LANGS;
	let lang = localStorage.getItem("lang");
	if (lang == null || !supportedLangs.includes(lang)) {
		if (supportedLangs.includes(navigator.language)) {
			lang = navigator.language;
		} else {
			lang = supportedLangs.find((x) => x.split("-")[0] === navigator.language);

			// Fallback
			if (lang == null) lang = "en-US";
		}
	}

	const res = await fetch(`/assets/locales/${lang}.${v}.json`);
	if (res.status === 200) {
		localStorage.setItem("lang", lang);
		localStorage.setItem("locale", await res.text());
		localStorage.setItem("localeVersion", v);
	} else {
		await checkUpdate();
		renderError("LOCALE_FETCH");
		return;
	}
	//#endregion

	//#region Script
	function importAppScript() {
		import(`/assets/${CLIENT_ENTRY}`).catch(async (e) => {
			await checkUpdate();
			console.error(e);
			renderError("APP_IMPORT", e);
		});
	}

	// タイミングによっては、この時点でDOMの構築が済んでいる場合とそうでない場合とがある
	if (document.readyState !== "loading") {
		importAppScript();
	} else {
		window.addEventListener("DOMContentLoaded", () => {
			importAppScript();
		});
	}
	//#endregion

	//#region Theme
	const theme = localStorage.getItem("theme");
	if (theme) {
		for (const [k, v] of Object.entries(JSON.parse(theme))) {
			document.documentElement.style.setProperty(`--${k}`, v.toString());

			// HTMLの theme-color 適用
			if (k === "htmlThemeColor") {
				for (const tag of document.head.children) {
					if (
						tag.tagName === "META" &&
						tag.getAttribute("name") === "theme-color"
					) {
						tag.setAttribute("content", v);
						break;
					}
				}
			}
		}
	}
	const colorSchema = localStorage.getItem("colorSchema");
	if (colorSchema) {
		document.documentElement.style.setProperty("color-schema", colorSchema);
	}
	//#endregion

	let fontSize = localStorage.getItem("fontSize");
	if (fontSize) {
		if (fontSize < 10) {
			// need to do this for now, as values before were 1, 2, 3 depending on the option
			localStorage.setItem("fontSize", null);
			fontSize = localStorage.getItem("fontSize");
		}
		document.documentElement.style.fontSize = `${fontSize}px`;
	}

	if (["ja-JP", "ja-KS", "ko-KR", "zh-CN", "zh-TW"].includes(lang)) {
		document.documentElement.classList.add("useCJKFont");
	}

	const useSystemFont = localStorage.getItem("useSystemFont");
	if (useSystemFont) {
		document.documentElement.classList.add("useSystemFont");
	}

	const wallpaper = localStorage.getItem("wallpaper");
	if (wallpaper) {
		document.documentElement.style.backgroundImage = `url(${wallpaper})`;
	}

	const customCss = localStorage.getItem("customCss");
	if (customCss && customCss.length > 0) {
		const style = document.createElement("style");
		style.innerHTML = customCss;
		document.head.appendChild(style);
	}

	async function addStyle(styleText) {
		const css = document.createElement("style");
		css.appendChild(document.createTextNode(styleText));
		document.head.appendChild(css);
	}

	function renderError(code, details) {
		let errorsElement = document.getElementById("errors");

		if (!errorsElement) {
			document.body.innerHTML = `
			<svg class="icon-warning" xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-alert-triangle" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
				<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
				<path d="M12 9v2m0 4v.01"></path>
				<path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75"></path>
			</svg>
			<h1>An error has occurred!</h1>
			<button class="button-big" onclick="location.reload(true);">
				<span class="button-label-big">Refresh</span>
			</button>
			<p class="dont-worry">Don't worry, it's (probably) not your fault.</p>
			<p>Please make sure your browser is up-to-date and any AdBlockers are off.</p>
			<p>If the problem persists after refreshing, please contact your instance's administrator.<br>You may also try the following options:</p>
			<a href="/flush">
				<button class="button-small">
					<span class="button-label-small">Clear preferences and cache</span>
				</button>
			</a>
			<br>
			<a href="/cli">
				<button class="button-small">
					<span class="button-label-small">Start the simple client</span>
				</button>
			</a>
			<br>
			<a href="/bios">
				<button class="button-small">
					<span class="button-label-small">Start the repair tool</span>
				</button>
			</a>
			<br>
			<div id="errors"></div>
			`;
			errorsElement = document.getElementById("errors");
		}
		const detailsElement = document.createElement("details");
		detailsElement.innerHTML = `
		<br>
		<summary>
			<code>ERROR CODE: ${code}</code>
		</summary>
		<code>${JSON.stringify(details)}</code>`;
		errorsElement.appendChild(detailsElement);
		addStyle(`
		* {
			font-family: BIZ UDGothic, Roboto, HelveticaNeue, Arial, sans-serif;
		}

		#firefish_app,
		#splash {
			display: none !important;
		}

		body,
		html {
			background-color: #191724;
			color: #e0def4;
			justify-content: center;
			margin: auto;
			padding: 10px;
			text-align: center;
		}

		button {
			border-radius: 999px;
			padding: 0px 12px 0px 12px;
			border: none;
			cursor: pointer;
			margin-bottom: 12px;
		}

		.button-big {
			background: linear-gradient(90deg, rgb(196, 167, 231), rgb(235, 188, 186));
			line-height: 50px;
		}

		.button-big:hover {
			background: rgb(49, 116, 143);
		}

		.button-small {
			background: #444;
			line-height: 40px;
		}

		.button-small:hover {
			background: #555;
		}

		.button-label-big {
			color: #191724;
			font-weight: bold;
			font-size: 20px;
			padding: 12px;
		}

		.button-label-small {
			color: rgb(156, 207, 216);
			font-size: 16px;
			padding: 12px;
		}

		a {
			color: rgb(156, 207, 216);
			text-decoration: none;
		}

		p,
		li {
			font-size: 16px;
		}

		.dont-worry,
		#msg {
			font-size: 18px;
		}

		.icon-warning {
			color: #f6c177;
			height: 4rem;
			padding-top: 2rem;
		}

		h1 {
			font-size: 32px;
		}

		code {
			font-family: Fira, FiraCode, monospace;
		}

		details {
			background: #1f1d2e;
			margin-bottom: 2rem;
			padding: 0.5rem 1rem;
			width: 40rem;
			border-radius: 10px;
			justify-content: center;
			margin: auto;
		}

		summary {
			cursor: pointer;
		}

		summary > * {
			display: inline;
		}

		@media screen and (max-width: 500px) {
			details {
				width: 50%;
			}
		`);
	}

	async function checkUpdate() {
		try {
			const res = await fetch("/api/meta", {
				method: "POST",
				cache: "no-cache",
			});

			const meta = await res.json();

			if (meta.version != v) {
				localStorage.setItem("v", meta.version);
				refresh();
			}
		} catch (e) {
			console.error(e);
			renderError("UPDATE_CHECK", e);
			throw e;
		}
	}

	function refresh() {
		// Clear cache (service worker)
		try {
			navigator.serviceWorker.controller.postMessage("clear");
			navigator.serviceWorker.getRegistrations().then((registrations) => {
				registrations.forEach((registration) => registration.unregister());
			});
		} catch (e) {
			console.error(e);
		}

		location.reload();
	}
})();
