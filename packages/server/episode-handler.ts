import { episodeAudio } from "@ivooxrss/ivoox/episode.js";
import { FetchWithErr, NotOk } from "@ivooxrss/ivoox/fetch.js";
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
	let audio: URL;
	try {
		audio = await episodeAudio(conf.fetchWithErr, ivooxEpisode);
	} catch (err) {
		if (err instanceof NotOk && err.status === 404) {
			return error(404, "Not found.");
		}
		throw err;
	}
	return Response.redirect(audio.toString(), 302);
}
