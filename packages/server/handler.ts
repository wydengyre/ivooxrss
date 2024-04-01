import { mkFetchWithErr } from "@ivooxrss/ivoox/fetch.js";
import { Router, error } from "itty-router";
import { episodeHandler } from "./episode-handler.js";
import { feedHandler } from "./feed-handler.js";
import type { Logger } from "./logger.js";

export { type Config, mkFetch };

type Config = {
	baseURL: URL;
	ivooxBaseURL: URL;
	fetch: typeof fetch;
	logger: Logger;
};

function mkFetch(conf: Config): typeof fetch {
	const fetchWithErr = mkFetchWithErr(conf.fetch);

	const feedHandlerConf = {
		baseURL: conf.baseURL,
		ivooxBaseURL: conf.ivooxBaseURL,
		fetchWithErr,
	};
	const handleFeed = (request: Request) =>
		feedHandler(feedHandlerConf, request);

	const fetchEpisodeConf = {
		ivooxBaseURL: conf.ivooxBaseURL,
		fetchWithErr,
	};
	const handleEpisode = (request: Request) =>
		episodeHandler(fetchEpisodeConf, request);

	return Router()
		.get("/*.xml", handleFeed)
		.get("/*.mp3", handleEpisode)
		.all("*", notFound)
		.catch((err: Error) => {
			conf.logger.error(err);
			return error(500, "failed to process request");
		}).fetch;
}
const notFound = () => error(404, "Not found.");
