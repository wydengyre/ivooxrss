import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { mock, test } from "node:test";
import { convert } from "./feed.ts";
import type { OkResponse } from "./fetch.ts";

test("feed", async (t) => {
	await t.test(testConvert);
});

async function testConvert() {
	const rssP = readFile("test/feed_fg_f1372665_filtro_1.xml", "utf8");
	const expectedP = readFile("test/expected.xml", "utf8");
	const [rss, expected] = await Promise.all([rssP, expectedP]);

	const fetch = mock.fn(() => Promise.resolve(new Response(rss) as OkResponse));
	const baseURL = new URL("https://foo.local/");
	const config = { baseURL, fetchWithErr: fetch };

	const feedUrl = new URL("https://www.ivoox.com/foo.xml");
	const converted = await convert(config, feedUrl);
	assert.strictEqual(fetch.mock.calls.length, 1);
	const call = fetch.mock.calls[0];
	assert.deepStrictEqual(call.arguments, [feedUrl.href]);
	assert.strictEqual(converted, expected);
}
