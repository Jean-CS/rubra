export const EVENT_STATUSES = ["Agendado", "Adiado", "Cancelado"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_FORMATS = ["Presencial", "Online", "Híbrido"] as const;
export type EventFormat = (typeof EVENT_FORMATS)[number];

export type EventProvider = "sympla" | "meetup";
export type EventClassification = "technology" | "uncertain";
export type OrganizerType = "Comunidade" | "Instituição de Ensino";

export interface ExternalEvent {
	provider: EventProvider;
	classification: EventClassification;
	externalId: string;
	url: string;
	title: string;
	date: string;
	endDate?: string;
	time?: string;
	location: string;
	city: string;
	format: EventFormat;
	organizerName: string;
	description?: string;
	status: EventStatus;
	tags: string[];
}

export interface EventAdapter {
	discover(): Promise<ExternalEvent[]>;
}

export interface EventSource {
	provider: EventProvider;
	externalId: string;
	url: string;
}

export interface DiscoveryCandidate {
	reason: string;
	event: ExternalEvent;
}
