import { FetchWithErr } from "./fetch.js";

export { ParsedEpisodePage, ParsedDownloadPage, episodeAudio };

async function episodeAudio(
	fetchWithErr: FetchWithErr,
	ivooxEpisode: URL,
): Promise<URL> {
	console.log("episodeAudio", ivooxEpisode.href);
	// disable cache because ivoox returns temporary security keys
	const disableCache: RequestInit = {
		headers: { "Cache-Control": "no-cache" },
	};
	const episodePage = await fetchWithErr(ivooxEpisode, disableCache);
	const episodePageHtml = await episodePage.text();
	const { downloadPageUrl } = parseEpisodePage(ivooxEpisode, episodePageHtml);
	const downloadPage = await fetchWithErr(downloadPageUrl, disableCache);
	const downloadPageHtml = await downloadPage.text();
	const { downloadUrl } = parseDownloadPage(downloadPageHtml);
	return downloadUrl;
}

type ParsedEpisodePage = {
	downloadPageUrl: URL;
};

const downloadPageRe = /downloadlink_.+\.html/;
function parseEpisodePage(pageUrl: URL, html: string): ParsedEpisodePage {
	const downloadPageRes = downloadPageRe.exec(html);
	if (!downloadPageRes || downloadPageRes.length < 1) {
		throw new Error(`Could not find download page link in ${pageUrl}`);
	}
	const rel = downloadPageRes[0];
	const downloadPageUrl = new URL(rel, pageUrl);
	return { downloadPageUrl };
}

type ParsedDownloadPage = {
	downloadUrl: URL;
};
const downloadLinkRe = /(https:.+?\.mp3.+?)"/;
function parseDownloadPage(html: string): ParsedDownloadPage {
	const downloadLinkRes = downloadLinkRe.exec(html);
	if (!downloadLinkRes || downloadLinkRes.length < 2) {
		throw new Error(`Could not find download link in ${html}`);
	}
	const rel = downloadLinkRes[1];
	const downloadUrl = new URL(rel);
	return { downloadUrl };
}
