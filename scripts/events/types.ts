import { z } from "zod";

export const EVENT_STATUSES = ["Agendado", "Adiado", "Cancelado"] as const;
export const EVENT_FORMATS = ["Presencial", "Online", "Híbrido"] as const;
export const EVENT_PROVIDERS = ["sympla", "meetup"] as const;
export const EVENT_CLASSIFICATIONS = ["technology", "uncertain"] as const;
export const EVENT_TRIAGE_CATEGORIES = ["obvious-no", "review", "technology"] as const;
export const ORGANIZER_TYPES = ["Comunidade", "Instituição de Ensino"] as const;
export const SYNCABLE_FIELDS = [
	"title",
	"date",
	"endDate",
	"time",
	"location",
	"format",
	"organizerName",
	"url",
	"description",
	"status",
] as const;

export const isHttpUrl = (value: string) => {
	try {
		return ["http:", "https:"].includes(new URL(value).protocol);
	} catch {
		return false;
	}
};

export const httpUrlSchema = z.string().url().refine(isHttpUrl, "URL deve usar HTTP ou HTTPS");
export const eventStatusSchema = z.enum(EVENT_STATUSES);
export const eventFormatSchema = z.enum(EVENT_FORMATS);
export const eventProviderSchema = z.enum(EVENT_PROVIDERS);
export const eventClassificationSchema = z.enum(EVENT_CLASSIFICATIONS);
export const eventTriageCategorySchema = z.enum(EVENT_TRIAGE_CATEGORIES);
export const organizerTypeSchema = z.enum(ORGANIZER_TYPES);
export const syncableFieldSchema = z.enum(SYNCABLE_FIELDS);

export type EventStatus = z.infer<typeof eventStatusSchema>;
export type EventFormat = z.infer<typeof eventFormatSchema>;
export type EventProvider = z.infer<typeof eventProviderSchema>;
export type EventClassification = z.infer<typeof eventClassificationSchema>;
export type EventTriageCategory = z.infer<typeof eventTriageCategorySchema>;
export type OrganizerType = z.infer<typeof organizerTypeSchema>;
export type SyncableField = z.infer<typeof syncableFieldSchema>;

export const externalEventSchema = z.object({
	provider: eventProviderSchema,
	classification: eventClassificationSchema,
	externalId: z.string().min(1).max(500),
	url: httpUrlSchema,
	title: z.string().min(1),
	date: z.iso.date(),
	endDate: z.iso.date().optional(),
	time: z.string().min(1).optional(),
	location: z.string().min(1),
	city: z.string(),
	format: eventFormatSchema,
	organizerName: z.string().min(1),
	description: z.string().min(1).optional(),
	status: eventStatusSchema,
	tags: z.array(z.string().min(1)),
});

export type ExternalEvent = z.infer<typeof externalEventSchema>;

export interface EventAdapter {
	discover(): Promise<ExternalEvent[]>;
}

export const eventSourceSchema = z.object({
	provider: eventProviderSchema,
	externalId: z.string().min(1),
	url: httpUrlSchema,
});

export type EventSource = z.infer<typeof eventSourceSchema>;

export const eventTriageSuggestionSchema = z.object({
	category: eventTriageCategorySchema,
	reasons: z.array(z.string().min(1)).min(1),
});

export type EventTriageSuggestion = z.infer<typeof eventTriageSuggestionSchema>;

export const discoveryCandidateSchema = z.object({
	reason: z.string().min(1),
	event: externalEventSchema,
	triage: eventTriageSuggestionSchema,
});

export type DiscoveryCandidate = z.infer<typeof discoveryCandidateSchema>;
