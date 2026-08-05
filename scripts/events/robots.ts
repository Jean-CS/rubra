import robotsParser from "robots-parser";

export const robotsAllows = (robots: string, targetUrl: string, userAgent: string) => {
	const target = new URL(targetUrl);
	const parser = robotsParser(new URL("/robots.txt", target).toString(), robots);
	return parser.isAllowed(target.toString(), userAgent) !== false;
};

export const assertRobotsAllowed = (robots: string, urls: readonly string[], userAgent: string) => {
	const denied = urls.find((url) => !robotsAllows(robots, url, userAgent));
	if (denied) throw new Error(`Coleta desativada por robots.txt para ${new URL(denied).pathname}`);
};
