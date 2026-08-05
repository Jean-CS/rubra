import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { parse, stringify } from "yaml";
import {
	SYNCABLE_FIELDS,
	type DiscoveryCandidate,
	type ExternalEvent,
	type EventSource,
	type OrganizerType,
	type SyncableField,
} from "./types";
import { canonicalUrl, normalizeText, slugify } from "./text";

export { SYNCABLE_FIELDS } from "./types";

interface EventDocument {
	path: string;
	body: string;
	data: Record<string, unknown> & {
		title: string;
		date: string;
		location: string;
		organizerName: string;
		url: string;
		source?: EventSource;
		syncIgnore?: SyncableField[];
	};
}

interface OrganizerRecord {
	name: string;
	type: OrganizerType;
	tags: string[];
}

export interface ReconciliationResult {
	changedFiles: string[];
	candidates: DiscoveryCandidate[];
	discoveredCount: number;
}

const parseDocument = (path: string, source: string): EventDocument => {
	const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
	if (!match) throw new Error(`Frontmatter inválido em ${path}`);
	return { path, data: parse(match[1]), body: match[2] } as EventDocument;
};

const serializeDocument = (document: EventDocument) => {
	const yaml = stringify(document.data, { lineWidth: 0 });
	return `---\n${yaml}---\n${document.body}`;
};

const readMarkdownFiles = async (directory: string, recursive = false) => {
	const entries = await readdir(directory, { withFileTypes: true });
	const files: string[] = [];
	for (const entry of entries) {
		const path = join(directory, entry.name);
		if (entry.isDirectory() && recursive) files.push(...await readMarkdownFiles(path, true));
		else if (entry.isFile() && /\.mdx?$/.test(entry.name) && !entry.name.startsWith("_")) files.push(path);
	}
	return files.sort();
};

const buildOrganizerRegistry = async (projectRoot: string) => {
	const registry = new Map<string, OrganizerRecord>();
	const sources: Array<{ directory: string; type: OrganizerType }> = [
		{ directory: join(projectRoot, "src/content/communities"), type: "Comunidade" },
		{ directory: join(projectRoot, "src/content/institutions"), type: "Instituição de Ensino" },
	];

	for (const source of sources) {
		for (const path of await readMarkdownFiles(source.directory)) {
			const document = parseDocument(path, await readFile(path, "utf8"));
			const name = typeof document.data.name === "string" ? document.data.name : undefined;
			if (!name) continue;
			const tags = Array.isArray(document.data.tags)
				? document.data.tags.filter((tag): tag is string => typeof tag === "string")
				: [];
			registry.set(normalizeText(name), { name, type: source.type, tags });
		}
	}
	return registry;
};

const safeCanonicalUrl = (value: string) => {
	try { return canonicalUrl(value); } catch { return value; }
};

const fallbackKey = (title: string, date: string, locationOrCity: string) => {
	const normalizedPlace = normalizeText(locationOrCity);
	const city = normalizedPlace.includes("londrina") ? "londrina" : normalizedPlace;
	return `${normalizeText(title)}|${date}|${city}`;
};

const externalKeys = (event: ExternalEvent) => [
	`source:${event.provider}:${event.externalId}`,
	`url:${safeCanonicalUrl(event.url)}`,
	`fallback:${fallbackKey(event.title, event.date, event.city)}`,
];

const documentKeys = (document: EventDocument) => {
	const keys = [
		`url:${safeCanonicalUrl(document.data.url)}`,
		`fallback:${fallbackKey(document.data.title, document.data.date, document.data.location)}`,
	];
	if (document.data.source) {
		keys.unshift(`source:${document.data.source.provider}:${document.data.source.externalId}`);
	}
	return keys;
};

const completeEvent = (event: ExternalEvent) => Boolean(
	event.title && event.date && event.location && event.city && event.format &&
	event.organizerName && event.url && event.description && event.tags.length,
);

const candidateReason = (event: ExternalEvent, organizer?: OrganizerRecord) => {
	if (event.classification === "uncertain") return "Classificação de tecnologia ainda incerta";
	if (!organizer) return "Organizador ainda não reconhecido pelo Rubra";
	return "Campos obrigatórios ausentes";
};

const newEventData = (event: ExternalEvent, organizer: OrganizerRecord) => ({
	title: event.title,
	date: event.date,
	...(event.endDate ? { endDate: event.endDate } : {}),
	...(event.time ? { time: event.time } : {}),
	location: event.location,
	format: event.format,
	organizerName: organizer.name,
	organizerType: organizer.type,
	url: event.url,
	description: event.description,
	tags: [...new Set([...event.tags, ...organizer.tags.slice(0, 3)])],
	status: event.status,
	source: {
		provider: event.provider,
		externalId: event.externalId,
		url: event.url,
	},
});

const applyExternalEvent = (
	document: EventDocument,
	event: ExternalEvent,
	organizer: OrganizerRecord,
) => {
	const wasManual = !document.data.source;
	const ignored = new Set(document.data.syncIgnore ?? []);
	if (wasManual && typeof document.data.description === "string") {
		ignored.add("description");
		document.data.syncIgnore = [...ignored];
	}
	const sourceMatches = document.data.source?.provider === event.provider &&
		document.data.source.externalId === event.externalId;
	const nextValues: Partial<Record<SyncableField, unknown>> = {
		title: event.title,
		date: event.date,
		endDate: event.endDate,
		time: event.time,
		location: event.location,
		format: event.format,
		organizerName: organizer.name,
		url: event.url,
		...(event.description ? { description: event.description } : {}),
		...(event.status !== "Agendado" ? { status: event.status } : {}),
	};

	for (const [field, value] of Object.entries(nextValues) as [SyncableField, unknown][]) {
		if (ignored.has(field)) continue;
		if (value === undefined) delete document.data[field];
		else (document.data as Record<string, unknown>)[field] = value;
	}
	document.data.organizerType = organizer.type;
	if (!document.data.source || sourceMatches) {
		document.data.source = { provider: event.provider, externalId: event.externalId, url: event.url };
	}
};

const uniqueExternalEvents = (events: readonly ExternalEvent[]) => {
	const result: ExternalEvent[] = [];
	const seen = new Set<string>();
	for (const event of events) {
		const keys = externalKeys(event);
		if (keys.some((key) => seen.has(key))) continue;
		keys.forEach((key) => seen.add(key));
		result.push(event);
	}
	return result;
};

export const reconcileEvents = async (
	events: readonly ExternalEvent[],
	projectRoot: string,
): Promise<ReconciliationResult> => {
	const eventDirectory = join(projectRoot, "src/content/events");
	const documents = await Promise.all((await readMarkdownFiles(eventDirectory, true)).map(async (path) =>
		parseDocument(path, await readFile(path, "utf8")),
	));
	const originals = new Map(await Promise.all(documents.map(async (document) =>
		[document.path, await readFile(document.path, "utf8")] as const,
	)));
	const organizers = await buildOrganizerRegistry(projectRoot);
	const index = new Map<string, EventDocument>();
	documents.forEach((document) => documentKeys(document).forEach((key) => index.set(key, document)));
	const candidates: DiscoveryCandidate[] = [];
	const dirtyDocuments = new Set<EventDocument>();

	for (const event of uniqueExternalEvents(events)) {
		const existing = externalKeys(event).map((key) => index.get(key)).find(Boolean);
		const organizer = organizers.get(normalizeText(event.organizerName));
		if (event.classification === "uncertain" || !organizer || !completeEvent(event)) {
			candidates.push({
				reason: candidateReason(event, organizer),
				event,
			});
			continue;
		}

		if (existing) {
			const before = JSON.stringify(existing.data);
			applyExternalEvent(existing, event, organizer);
			if (JSON.stringify(existing.data) !== before) dirtyDocuments.add(existing);
			documentKeys(existing).forEach((key) => index.set(key, existing));
			continue;
		}

		const baseName = `${event.date}-${slugify(event.title)}`;
		let path = join(eventDirectory, `${baseName}.md`);
		let suffix = 2;
		while (documents.some((document) => document.path === path)) {
			path = join(eventDirectory, `${baseName}-${suffix}.md`);
			suffix += 1;
		}
		const document: EventDocument = { path, data: newEventData(event, organizer) as EventDocument["data"], body: "" };
		documents.push(document);
		dirtyDocuments.add(document);
		documentKeys(document).forEach((key) => index.set(key, document));
	}

	const changedFiles: string[] = [];
	for (const document of dirtyDocuments) {
		const serialized = serializeDocument(document);
		if (originals.get(document.path) === serialized) continue;
		await writeFile(document.path, serialized, "utf8");
		changedFiles.push(document.path);
	}

	return { changedFiles, candidates, discoveredCount: events.length };
};

export const writeCandidates = async (projectRoot: string, candidates: DiscoveryCandidate[]) => {
	const outputDirectory = join(projectRoot, ".event-sync");
	await mkdir(outputDirectory, { recursive: true });
	const path = join(outputDirectory, "candidates.json");
	await writeFile(path, `${JSON.stringify(candidates, null, 2)}\n`, "utf8");
	return path;
};

export const relativeChangedFiles = (paths: string[], projectRoot: string) =>
	paths.map((path) => path.slice(projectRoot.length + 1) || basename(path));
