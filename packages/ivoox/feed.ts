import type { FetchWithErr } from "./fetch.ts";

export { type Config, convert };

type Config = Readonly<{
	baseURL: URL;
	fetchWithErr: FetchWithErr;
}>;

async function convert(conf: Config, feedURL: URL): Promise<string> {
	const resp = await conf.fetchWithErr(feedURL.href);
	const rss = await resp.text();
	return convertRss(conf.baseURL, rss);
}

const rssItemRe =
	/<link>([^<]+)<\/link><enclosure url="(https:\/\/www.ivoox.com\/[^"]+?)"/g;
const linkPathnameRe = /^\/(.+)\.html$/;
const guidRe = /<guid>([^<]+)<\/guid>/g;
function convertRss(baseUrl: URL, rss: string): string {
	let out = rss;
	const matches = rss.matchAll(rssItemRe);
	for (const match of matches) {
		const linkUrl = new URL(match[1]);
		const audioUrl = new URL(match[2]);
		const link = linkPathnameRe.exec(linkUrl.pathname)?.[1];
		if (link === undefined) {
			throw new Error(`Could not find link in ${linkUrl}`);
		}
		const audioUrlPathAndQuery = `${audioUrl.pathname}?link=${link}`;
		const ourAudioUrl = new URL(audioUrlPathAndQuery, baseUrl);
		out = out.replaceAll(audioUrl.href, ourAudioUrl.href);
	}
	out = stripGuids(out);

	return out;
}

const stripGuids = (xml: string) => xml.replaceAll(guidRe, "");
