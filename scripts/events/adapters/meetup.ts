import { load } from "cheerio";
import { z } from "zod";
import type { EventAdapter, EventFormat, EventStatus, ExternalEvent } from "../types";
import { externalEventSchema } from "../types";
import { canonicalUrl, compactText, htmlToText, normalizeText, toLocalDateParts, truncate } from "../text";
import type { PublicHttpClient } from "../http";
import { assertRobotsAllowed } from "../robots";

const meetupEventSchema = z.object({
	"@type": z.union([z.string(), z.array(z.string())]),
	name: z.string().optional(),
	url: z.string().optional(),
	description: z.string().optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	eventStatus: z.string().optional(),
	eventAttendanceMode: z.union([z.string(), z.array(z.string())]).optional(),
	location: z.object({
		name: z.string().optional(),
		address: z.union([
			z.string(),
			z.object({
				addressLocality: z.string().optional(),
				addressRegion: z.string().optional(),
				streetAddress: z.string().optional(),
			}),
		]).optional(),
	}).optional(),
	organizer: z.object({ name: z.string().optional(), url: z.string().optional() }).optional(),
}).passthrough();

type MeetupEvent = z.infer<typeof meetupEventSchema>;

const isEvent = (value: unknown): value is MeetupEvent => {
	const parsed = meetupEventSchema.safeParse(value);
	if (!parsed.success) return false;
	const type = parsed.data["@type"];
	return type === "Event" || (Array.isArray(type) && type.includes("Event"));
};

const collectEvents = (value: unknown, output: MeetupEvent[]) => {
	if (isEvent(value)) output.push(value);
	if (Array.isArray(value)) value.forEach((entry) => collectEvents(entry, output));
	else if (value && typeof value === "object") {
		Object.values(value).forEach((entry) => collectEvents(entry, output));
	}
};

const mapStatus = (status = ""): EventStatus => {
	if (/cancel/i.test(status)) return "Cancelado";
	if (/postpon/i.test(status)) return "Adiado";
	return "Agendado";
};

const mapFormat = (mode: MeetupEvent["eventAttendanceMode"]): EventFormat => {
	const value = Array.isArray(mode) ? mode.join(" ") : (mode ?? "");
	if (/mixed/i.test(value)) return "Híbrido";
	if (/online/i.test(value) && !/offline/i.test(value)) return "Online";
	return "Presencial";
};

const eventId = (url: string) => url.match(/\/events\/(\d+)/)?.[1] ?? canonicalUrl(url);

const meetupLocation = (event: MeetupEvent) => {
	const address = typeof event.location?.address === "object" ? event.location.address : undefined;
	const city = compactText(address?.addressLocality ?? "");
	const region = compactText(address?.addressRegion ?? "PR");
	const venue = compactText(event.location?.name ?? address?.streetAddress ?? "Online");
	const location = city && !normalizeText(venue).includes(normalizeText(city))
		? `${venue} — ${city}, ${region}`
		: venue;
	return { city, location };
};

export const parseMeetupDiscovery = (html: string, techKeywords: readonly string[]) => {
	const $ = load(html);
	const groups = new Set<string>();
	const normalizedKeywords = techKeywords.map(normalizeText);

	$("a[href]").each((_, element) => {
		const raw = $(element).attr("href");
		if (!raw) return;
		let url: URL;
		try {
			url = new URL(raw, "https://www.meetup.com");
		} catch {
			return;
		}
		if (!/(^|\.)meetup\.com$/i.test(url.hostname)) return;
		const segments = url.pathname.split("/").filter(Boolean);
		if (segments.length !== 1 || ["find", "login", "register", "topics"].includes(segments[0])) return;
		const haystack = normalizeText(`${segments[0]} ${$(element).text()}`);
		const tokens = new Set(haystack.split(" ").filter(Boolean));
		if (!normalizedKeywords.some((keyword) =>
			keyword.includes(" ") ? ` ${haystack} `.includes(` ${keyword} `) : tokens.has(keyword)
		)) return;
		groups.add(`https://www.meetup.com/${segments[0]}/`);
	});

	return [...groups];
};

export const parseMeetupEvents = (
	html: string,
	allowedCities: readonly string[],
	timeZone: string,
): ExternalEvent[] => {
	const $ = load(html);
	const payloads: MeetupEvent[] = [];
	let blocksWithEventSignal = 0;
	$("script[type='application/ld+json']").each((_, element) => {
		const source = $(element).html() ?? "";
		if (/schema\.org\/(?:Event|EventScheduled|EventCancelled|EventPostponed)|"@type"\s*:\s*"Event"/i.test(source)) {
			blocksWithEventSignal += 1;
		}
		try {
			collectEvents(JSON.parse(source || "null"), payloads);
		} catch {
			// Um bloco inválido não deve comprometer os outros JSON-LD da página.
		}
	});
	if (blocksWithEventSignal > 0 && payloads.length === 0) {
		throw new Error("JSON-LD de eventos do Meetup mudou ou está incompleto");
	}

	const allowed = allowedCities.map(normalizeText);
	const discovered = new Map<string, ExternalEvent>();
	for (const payload of payloads) {
		if (!payload.name || !payload.url || !payload.startDate || !payload.organizer?.name) continue;
		const { city, location } = meetupLocation(payload);
		if (!allowed.includes(normalizeText(city))) continue;
		const start = toLocalDateParts(payload.startDate, timeZone);
		const end = payload.endDate ? toLocalDateParts(payload.endDate, timeZone) : undefined;
		const url = canonicalUrl(payload.url);
		if (!/(^|\.)meetup\.com$/i.test(new URL(url).hostname)) continue;
		const description = payload.description ? truncate(htmlToText(payload.description)) : undefined;
		const event = externalEventSchema.parse({
			provider: "meetup",
			classification: "technology",
			externalId: eventId(url),
			url,
			title: compactText(payload.name),
			date: start.date,
			...(end && end.date !== start.date ? { endDate: end.date } : {}),
			time: start.time,
			location,
			city,
			format: mapFormat(payload.eventAttendanceMode),
			organizerName: compactText(payload.organizer.name),
			...(description ? { description } : {}),
			status: mapStatus(payload.eventStatus),
			tags: ["Tecnologia", "Meetup"],
		});
		discovered.set(`${event.provider}:${event.externalId}`, event);
	}
	return [...discovered.values()];
};

export class MeetupAdapter implements EventAdapter {
	constructor(
		private readonly http: PublicHttpClient,
		private readonly discoveryUrl: string,
		private readonly knownGroups: readonly string[],
		private readonly techKeywords: readonly string[],
		private readonly allowedCities: readonly string[],
		private readonly timeZone: string,
		private readonly robotsUrl?: string,
		private readonly userAgent = "RubraEventIndexer",
		private readonly maxGroupsPerRun = 12,
	) {}

	async discover() {
		const robots = this.robotsUrl ? await this.http.getText(this.robotsUrl) : undefined;
		if (robots) assertRobotsAllowed(robots, [this.discoveryUrl, ...this.knownGroups], this.userAgent);
		const discoveryHtml = await this.http.getText(this.discoveryUrl);
		const groups = new Set([
			...this.knownGroups.map(canonicalUrl),
			...parseMeetupDiscovery(discoveryHtml, this.techKeywords).map(canonicalUrl),
		]);
		const selectedGroups = [...groups].slice(0, this.maxGroupsPerRun);
		if (robots) assertRobotsAllowed(robots, selectedGroups, this.userAgent);
		const events = new Map<string, ExternalEvent>();
		for (const groupUrl of selectedGroups) {
			const html = await this.http.getText(groupUrl);
			for (const event of parseMeetupEvents(html, this.allowedCities, this.timeZone)) {
				events.set(`${event.provider}:${event.externalId}`, event);
			}
		}
		return [...events.values()];
	}
}
