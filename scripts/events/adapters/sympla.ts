import { load } from "cheerio";
import { z } from "zod";
import type { EventAdapter, ExternalEvent } from "../types";
import { externalEventSchema } from "../types";
import { canonicalUrl, compactText, normalizeText, toLocalDateParts } from "../text";
import type { PublicHttpClient } from "../http";
import { assertRobotsAllowed } from "../robots";

const symplaPayloadSchema = z.object({
	id: z.union([z.string(), z.number()]),
	name: z.string(),
	url: z.string(),
	start_date: z.string(),
	end_date: z.string().optional(),
	event_type: z.string().optional(),
	company: z.literal("sympla"),
	organizer: z.object({ name: z.string() }),
	location: z.object({
		name: z.string().optional(),
		city: z.string().optional(),
		state: z.string().optional(),
		address: z.string().optional(),
	}).optional(),
}).passthrough();

type SymplaPayload = z.infer<typeof symplaPayloadSchema>;

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
	const seen = new Set<string>();
	const marker = '"company":"sympla"';
	const stack: Array<{ start: number; containsMarker: boolean }> = [];
	let inString = false;
	let escaped = false;

	for (let index = 0; index < state.length; index += 1) {
		if (state.startsWith(marker, index) && stack.length > 0) {
			stack[stack.length - 1].containsMarker = true;
		}
		const character = state[index];
		if (inString) {
			if (escaped) escaped = false;
			else if (character === "\\") escaped = true;
			else if (character === '"') inString = false;
			continue;
		}
		if (character === '"') inString = true;
		else if (character === "{") stack.push({ start: index, containsMarker: false });
		else if (character === "}") {
			const frame = stack.pop();
			if (!frame?.containsMarker) continue;
			try {
				const parsed = symplaPayloadSchema.safeParse(JSON.parse(state.slice(frame.start, index + 1)));
				if (!parsed.success) continue;
				const key = String(parsed.data.id);
				if (!seen.has(key)) {
					seen.add(key);
					payloads.push(parsed.data);
				}
			} catch {
				// Payload incompleto ou formato desconhecido: ignorado de forma segura.
			}
		}
	}

	return payloads;
};

const locationLabel = (payload: SymplaPayload) => {
	const venue = compactText(payload.location?.name ?? payload.location?.address ?? "Local não informado");
	const city = compactText(payload.location?.city ?? "");
	const state = compactText(payload.location?.state ?? "PR");
	if (!city) return venue;
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
		const city = compactText(payload.location?.city ?? "");
		const venue = locationLabel(payload);
		const organizerName = compactText(payload.organizer.name);
		const title = compactText(payload.name);
		const online = /online/i.test(`${payload.event_type ?? ""} ${venue}`);

		const url = canonicalUrl(payload.url);
		if (!/(^|\.)sympla\.com\.br$/i.test(new URL(url).hostname)) return [];

		return [externalEventSchema.parse({
			provider: "sympla",
			classification,
			externalId: String(payload.id),
			url,
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
		})];
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
				if (event.city && !this.allowedCities.map(normalizeText).includes(normalizeText(event.city))) continue;
				const key = `${event.provider}:${event.externalId}`;
				const existing = discovered.get(key);
				if (!existing || event.classification === "technology") discovered.set(key, event);
			}
		}
		return [...discovered.values()];
	}
}
