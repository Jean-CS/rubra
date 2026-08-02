interface CorrectableEvent {
	id: string;
	title: string;
	date: Date;
	endDate?: Date;
	time?: string;
	location: string;
	format: string;
	organizerName: string;
	organizerType: string;
	url: string;
	description: string;
	tags: string[];
}

const issueUrl = "https://github.com/Jean-CS/rubra/issues/new";

export const eventIssueUrl = `${issueUrl}?template=indicar-evento.yml`;

const dateKey = (date: Date) => date.toISOString().slice(0, 10);

export const eventCorrectionIssueUrl = (event: CorrectableEvent) => {
	const url = new URL(issueUrl);
	const params: Record<string, string> = {
		template: "indicar-evento.yml",
		title: `Corrigir evento: ${event.title}`,
		"request-type": "Correção de evento existente",
		"event-reference": event.id,
		"event-name": event.title,
		date: dateKey(event.date),
		location: event.location,
		format: event.format,
		"organizer-name": event.organizerName,
		"organizer-type": event.organizerType,
		url: event.url,
		description: event.description,
		tags: event.tags.join(", "),
		evidence: `Correção dos dados publicados no evento ${event.id}. Explique abaixo o que precisa mudar e inclua uma fonte verificável.`,
	};
	if (event.endDate) params["end-date"] = dateKey(event.endDate);
	if (event.time) params.time = event.time;
	Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
	return url.toString();
};
