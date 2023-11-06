import test from "ava";

import {
	convertId,
	IdConvertType,
	nativeInitIdGenerator,
	nativeCreateId,
	nativeRandomStr,
} from "../built/index.js";

test("convert to mastodon id", (t) => {
	t.is(convertId("9gf61ehcxv", IdConvertType.MastodonId), "960365976481219");
	t.is(
		convertId("9fbr9z0wbrjqyd3u", IdConvertType.MastodonId),
		"2083785058661759970208986",
	);
	t.is(
		convertId("9fbs680oyviiqrol9md73p8g", IdConvertType.MastodonId),
		"5878598648988104013828532260828151168",
	);
});

test("create cuid2 with timestamp prefix", (t) => {
	nativeInitIdGenerator(16, "");
	t.not(nativeCreateId(Date.now()), nativeCreateId(Date.now()));
	t.is(nativeCreateId(Date.now()).length, 16);
});

test("create random string", (t) => {
	t.not(nativeRandomStr(16), nativeRandomStr(16));
	t.is(nativeRandomStr(24).length, 24);
});
