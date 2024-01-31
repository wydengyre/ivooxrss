import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { episodeAudio } from "./episode.js";
import { FetchWithErr, OkResponse } from "./fetch.js";

test("parseEpisodePage", async (t) => {
	await t.test(testEpisodeAudio);
});

async function testEpisodeAudio() {
	const ivooxEpisodePageUrl = new URL("https://ivoox.local/episode.html");
	const episodeHtmlP = readFile(
		"test/ep-87-constantino-reformas-necesarias-ii-moralidad-y-audios-mp3_rf_121630930_1.html",
		"utf8",
	);
	const downloadHtmlP = readFile(
		"test/downloadlink_mm_121630930_46_b_1.html",
		"utf8",
	);
	const [episodeHtml, downloadHtml] = await Promise.all([
		episodeHtmlP,
		downloadHtmlP,
	]);

	const fetchWithErr: FetchWithErr = (url) => {
		const content = url === ivooxEpisodePageUrl ? episodeHtml : downloadHtml;
		return Promise.resolve(new Response(content) as OkResponse);
	};
	const downloadUrl = await episodeAudio(fetchWithErr, ivooxEpisodePageUrl);
	const expected =
		"https://www.ivoox.com/ep-87-constantino-reformas-necesarias-ii-moralidad-y_md_121630930_1.mp3?t=laufoZuld6iroA..";
	assert.strictEqual(downloadUrl.href, expected);
}
