import { episodeStream } from "@ivooxrss/ivoox/episode.js";
import { FetchWithErr, NotOk, OkResponse } from "@ivooxrss/ivoox/fetch.js";
import { error } from "itty-router";

export { Config, episodeHandler };

type Config = {
	ivooxBaseURL: URL;
	fetchWithErr: FetchWithErr;
};
async function episodeHandler(
	conf: Config,
	request: Request,
): Promise<Response> {
	const requestUrl = new URL(request.url);
	const ivooxEpisodeLink = requestUrl.searchParams.get("link");
	if (ivooxEpisodeLink === null) {
		return error(400, "Missing link parameter in query string");
	}
	const ivooxEpisode = new URL(`${ivooxEpisodeLink}.html`, conf.ivooxBaseURL);
	let audioRes: OkResponse;
	try {
		audioRes = await episodeStream(conf.fetchWithErr, ivooxEpisode);
	} catch (err) {
		if (err instanceof NotOk && err.status === 404) {
			return error(404, "Not found.");
		}
		throw err;
	}

	const contentType = audioRes.headers.get("content-type");
	if (contentType === null) {
		throw new Error("Missing content-type header");
	}
	if (!contentType.startsWith("audio/")) {
		throw new Error(`Unexpected content-type: ${contentType}`);
	}
	const contentLength = audioRes.headers.get("content-length");
	if (contentLength === null) {
		throw new Error("Missing content-length header");
	}
	const headers = new Headers({
		"content-type": contentType,
		"content-length": contentLength,
	});
	return new Response(audioRes.body, { headers });
}
