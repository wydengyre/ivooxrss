import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { episodeStream } from "./episode.js";
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
	const downloadPageUrl = new URL(
		"https://ivoox.local/downloadlink_mm_121630930_46_b_1.html",
	);
	const downloadHtmlP = readFile(
		"test/downloadlink_mm_121630930_46_b_1.html",
		"utf8",
	);
	const [episodeHtml, downloadHtml] = await Promise.all([
		episodeHtmlP,
		downloadHtmlP,
	]);

	const audioContent = new Uint8Array([1, 2, 3, 4]);
	const fetchWithErr: FetchWithErr = (url) => {
		const urlStr = url.toString();
		if (urlStr === ivooxEpisodePageUrl.href) {
			return Promise.resolve(new Response(episodeHtml) as OkResponse);
		}

		if (urlStr === downloadPageUrl.href) {
			return Promise.resolve(new Response(downloadHtml) as OkResponse);
		}

		const expectedAudioUrl =
			"https://ivoox.local/ep-87-constantino-reformas-necesarias-ii-moralidad-y_md_121630930_1.mp3?t=laufoZuld6iroA..";
		if (urlStr === expectedAudioUrl) {
			return Promise.resolve(new Response(audioContent) as OkResponse);
		}

		throw new Error(`Unexpected url: ${urlStr}`);
	};

	const streamResponse = await episodeStream(fetchWithErr, ivooxEpisodePageUrl);
	assert.strictEqual(streamResponse.status, 200);
	const streamData = await streamResponse.arrayBuffer();
	assert.deepStrictEqual(streamData, audioContent.buffer);
}
