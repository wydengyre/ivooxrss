import { convert } from "@ivooxrss/ivoox/feed.js";
import { FetchWithErr, NotOk } from "@ivooxrss/ivoox/fetch.js";
import { error } from "itty-router";

export { Config, feedHandler };

type Config = Readonly<{
	baseURL: URL;
	ivooxBaseURL: URL;
	fetchWithErr: FetchWithErr;
}>;

async function feedHandler(conf: Config, request: Request): Promise<Response> {
	const ourURL = new URL(request.url);
	const ivooxURL = new URL(ourURL.pathname, conf.ivooxBaseURL);
	let converted: string;
	try {
		converted = await convert(conf, ivooxURL);
	} catch (err) {
		if (err instanceof NotOk && err.status === 404) {
			return error(404, "Not found.");
		}
		throw err;
	}
	// TODO: content-language according to the feed?
	return new Response(converted, {
		headers: {
			"Content-Type": "application/xml",
		},
	});
}
