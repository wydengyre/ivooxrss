import { mkFetch } from "@ivooxrss/server/handler.ts";
import * as logger from "@ivooxrss/server/logger.ts";

export default (<ExportedHandler<Env>>{
	fetch: (request, env, _ctx) => {
		const baseURL = new URL(env.BASE_URL);
		const ivooxBaseURL = new URL(env.IVOOX_BASE_URL);
		const l = logger.atLevelStr(env.LOG_LEVEL);

		const fetchFn = fetch.bind(globalThis);
		const fetchHandler = mkFetch({
			baseURL,
			ivooxBaseURL,
			fetch: fetchFn,
			logger: l,
		});
		return fetchHandler(request);
	},
});

type Env = {
	BASE_URL: string;
	IVOOX_BASE_URL: string;
	LOG_LEVEL: string;
};
