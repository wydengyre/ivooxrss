import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { Server, createServer } from "node:http";
import test from "node:test";
import { createServerAdapter } from "@whatwg-node/server";
import { Router, RouterType, html } from "itty-router";
import { UnstableDevWorker, unstable_dev } from "wrangler";

test("worker", async (t) => {
	await t.test(feedSuccess);
	await t.test(episodeSuccess);
});

// uncomment the relevant line in startWorker() for this to take effect
const logLevel = "info";
const baseUrl = new URL("https://foo.local");

async function feedSuccess() {
	const feedName = "feed_fg_f1372665_filtro_1.xml";
	const ivooxFeedP = readFile(`test/${feedName}`, "utf8");
	const expectedP = readFile("test/expected.xml", "utf8");
	const [ivooxFeed, expected] = await Promise.all([ivooxFeedP, expectedP]);

	const router = Router();
	router.get(`/${feedName}`, () => html(ivooxFeed));
	await using servers = await Servers.createWithIvooxRouter(router);
	const resp = await servers.worker.fetch(`/${feedName}`);
	assert.strict(resp.ok);
	assert.strictEqual(resp.status, 200);
	const feed = await resp.text();
	assert.strictEqual(feed, expected);
}

async function episodeSuccess() {
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

	const router = Router();
	const episodePageRel =
		"/ep-87-constantino-reformas-necesarias-ii-moralidad-y-audios-mp3_rf_121630930_1.html";
	router.get(episodePageRel, () => html(episodeHtml));
	const downloadPageRel = "/downloadlink_mm_121630930_46_b_1.html";
	router.get(downloadPageRel, () => html(downloadHtml));

	await using servers = await Servers.createWithIvooxRouter(router);

	const resp = await servers.worker.fetch(
		"/bleh.mp3?link=ep-87-constantino-reformas-necesarias-ii-moralidad-y-audios-mp3_rf_121630930_1",
		{ redirect: "manual" },
	);
	assert.strictEqual(resp.status, 302);
	assert.strictEqual(
		resp.headers.get("location"),
		"https://www.ivoox.com/ep-87-constantino-reformas-necesarias-ii-moralidad-y_md_121630930_1.mp3?t=laufoZuld6iroA..",
	);
}

class Servers {
	readonly worker: UnstableDevWorker;
	readonly #mockIvooxServer: Server;

	private constructor(worker: UnstableDevWorker, mockIvooxServer: Server) {
		this.worker = worker;
		this.#mockIvooxServer = mockIvooxServer;
	}

	static async createWithIvooxRouter(router: RouterType): Promise<Servers> {
		const ittyServer = createServerAdapter(router);
		const httpServer = createServer(ittyServer);
		await new Promise<void>((resolve) =>
			httpServer.listen(undefined, "localhost", resolve),
		);

		const ivooxAddress = httpServer.address();
		if (ivooxAddress === null) {
			throw new Error("RAI server address is null");
		}
		if (typeof ivooxAddress === "string") {
			throw new Error(
				`RAI server address is a string, we want an object: ${ivooxAddress}`,
			);
		}

		const IVOOX_BASE_URL = `http://localhost:${ivooxAddress.port}`;
		const vars = {
			BASE_URL: baseUrl.href,
			IVOOX_BASE_URL,
			LOG_LEVEL: logLevel,
		};

		const experimental = { disableExperimentalWarning: true };
		const worker = await unstable_dev("worker.ts", {
			// uncomment for help debugging
			logLevel,
			experimental,
			vars,
		});

		return new Servers(worker, httpServer);
	}

	get ivooxServerPort(): number {
		const ivooxAddress = this.#mockIvooxServer.address();
		if (ivooxAddress === null) {
			throw new Error("ivoox server address is null");
		}
		if (typeof ivooxAddress === "string") {
			throw new Error(
				`ivoox server address is a string, we want an object: ${ivooxAddress}`,
			);
		}
		return ivooxAddress.port;
	}

	async [Symbol.asyncDispose](): Promise<void> {
		await this.#mockIvooxServer[Symbol.asyncDispose]();
		await this.worker.stop();
	}
}
