import { load } from "cheerio";
import type { EventAdapter, ExternalEvent } from "../types";
import { canonicalUrl, compactText, normalizeText, toLocalDateParts } from "../text";
import type { PublicHttpClient } from "../http";
import { assertRobotsAllowed } from "../robots";

interface SymplaPayload {
	id?: string | number;
	name?: string;
	url?: string;
	start_date?: string;
	end_date?: string;
	event_type?: string;
	company?: string;
	organizer?: { name?: string };
	location?: {
		name?: string;
		city?: string;
		state?: string;
		address?: string;
	};
}

const extractContainingObject = (text: string, markerIndex: number) => {
	const stack: number[] = [];
	let inString = false;
	let escaped = false;

	for (let index = 0; index < text.length; index += 1) {
		const character = text[index];
		if (inString) {
			if (escaped) escaped = false;
			else if (character === "\\") escaped = true;
			else if (character === '"') inString = false;
			continue;
		}

		if (character === '"') inString = true;
		else if (character === "{") stack.push(index);
		else if (character === "}") {
			const start = stack.pop();
			if (start !== undefined && start <= markerIndex && markerIndex <= index) {
				return text.slice(start, index + 1);
			}
		}
	}

	return undefined;
};

const decodeFlightState = (html: string) => {
	const $ = load(html);
	const chunks: string[] = [];

	$("script").each((_, element) => {
		const script = $(element).html()?.trim() ?? "";
		const match = script.match(/^self\.__next_f\.push\((\[[\s\S]*\])\)$/);
		if (!match) return;

		try {
			const payload = JSON.parse(match[1]) as unknown[];
			if (typeof payload[1] === "string") chunks.push(payload[1]);
		} catch {
			// Outros scripts do Next não pertencem ao estado do catálogo.
		}
	});

	return chunks.join("");
};

const extractPayloads = (state: string) => {
	const payloads: SymplaPayload[] = [];
	const seenRanges = new Set<string>();
	const marker = '"company":"sympla"';
	let cursor = 0;

	while (cursor < state.length) {
		const markerIndex = state.indexOf(marker, cursor);
		if (markerIndex === -1) break;
		cursor = markerIndex + marker.length;
		const objectText = extractContainingObject(state, markerIndex);
		if (!objectText || seenRanges.has(objectText)) continue;
		seenRanges.add(objectText);

		try {
			const payload = JSON.parse(objectText) as SymplaPayload;
			if (payload.id && payload.name && payload.url && payload.start_date) payloads.push(payload);
		} catch {
			// Payload incompleto ou formato desconhecido: ignorado de forma segura.
		}
	}

	return payloads;
};

const locationLabel = (payload: SymplaPayload) => {
	const venue = compactText(payload.location?.name ?? payload.location?.address ?? "Local não informado");
	const city = compactText(payload.location?.city ?? "Londrina");
	const state = compactText(payload.location?.state ?? "PR");
	return venue.toLocaleLowerCase("pt-BR").includes(city.toLocaleLowerCase("pt-BR"))
		? venue
		: `${venue} — ${city}, ${state}`;
};

export const parseSymplaCatalog = (
	html: string,
	timeZone: string,
	classification: ExternalEvent["classification"] = "uncertain",
): ExternalEvent[] => {
	const state = decodeFlightState(html);
	if (!state) throw new Error("Estado serializado do catálogo Sympla não encontrado");
	const payloads = extractPayloads(state);
	if (payloads.length === 0 && !/"total"\s*:\s*0/.test(state)) {
		throw new Error("Payload de eventos da Sympla mudou ou está incompleto");
	}

	return payloads.flatMap((payload) => {
		if (!payload.id || !payload.name || !payload.url || !payload.start_date || !payload.organizer?.name) {
			return [];
		}
		const start = toLocalDateParts(payload.start_date, timeZone);
		const end = payload.end_date ? toLocalDateParts(payload.end_date, timeZone) : undefined;
		const city = compactText(payload.location?.city ?? "Londrina");
		const venue = locationLabel(payload);
		const organizerName = compactText(payload.organizer.name);
		const title = compactText(payload.name);
		const online = /online/i.test(`${payload.event_type ?? ""} ${venue}`);

		return [{
			provider: "sympla",
			classification,
			externalId: String(payload.id),
			url: canonicalUrl(payload.url),
			title,
			date: start.date,
			...(end && end.date !== start.date ? { endDate: end.date } : {}),
			time: start.time,
			location: venue,
			city,
			format: online ? "Online" : "Presencial",
			organizerName,
			description: `${title}, organizado por ${organizerName}, com realização em ${venue}.`,
			status: "Agendado",
			tags: ["Tecnologia", "Evento"],
		} satisfies ExternalEvent];
	});
};

export class SymplaAdapter implements EventAdapter {
	constructor(
		private readonly http: PublicHttpClient,
		private readonly catalogUrls: readonly string[],
		private readonly timeZone: string,
		private readonly allowedCities: readonly string[],
		private readonly robotsUrl?: string,
		private readonly userAgent = "RubraEventIndexer",
	) {}

	async discover() {
		if (this.robotsUrl) {
			const robots = await this.http.getText(this.robotsUrl);
			assertRobotsAllowed(robots, this.catalogUrls, this.userAgent);
		}
		const discovered = new Map<string, ExternalEvent>();
		for (const url of this.catalogUrls) {
			const html = await this.http.getText(url);
			const classification = /\/tecnologia\/?$/i.test(new URL(url).pathname) ? "technology" : "uncertain";
			for (const event of parseSymplaCatalog(html, this.timeZone, classification)) {
				if (!this.allowedCities.map(normalizeText).includes(normalizeText(event.city))) continue;
				const key = `${event.provider}:${event.externalId}`;
				const existing = discovered.get(key);
				if (!existing || event.classification === "technology") discovered.set(key, event);
			}
		}
		return [...discovered.values()];
	}
}
