import { mkFetchWithErr } from "@ivooxrss/ivoox/fetch.js";
import { Router, error } from "itty-router";
import { episodeHandler } from "./episode-handler.js";
import { feedHandler } from "./feed-handler.js";
import { Logger } from "./logger.js";

export { Config, FetchHandler, mkFetchHandler };

type Config = {
	baseURL: URL;
	ivooxBaseURL: URL;
	fetch: typeof fetch;
	logger: Logger;
};

type FetchHandler = (req: Request) => Promise<Response>;
function mkFetchHandler(conf: Config): FetchHandler {
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

	const router = Router()
		.get("/*.xml", handleFeed)
		.get("/*.mp3", handleEpisode)
		.all("*", notFound);

	return (request: Request) =>
		router.handle(request).catch((err) => {
			conf.logger.error(err);
			return error(500, "failed to process request");
		});
}
const notFound = () => error(404, "Not found.");
