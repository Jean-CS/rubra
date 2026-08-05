interface CorrectableEvent {
	id: string;
	title: string;
}

const issueUrl = "https://github.com/Jean-CS/rubra/issues/new";

export const eventIssueUrl = `${issueUrl}?template=indicar-evento.yml`;

export const eventCorrectionIssueUrl = (event: CorrectableEvent) => {
	const url = new URL(issueUrl);
	const params: Record<string, string> = {
		template: "indicar-evento.yml",
		title: `Corrigir evento: ${event.title}`,
		"event-reference": event.id,
		evidence: `Correção dos dados publicados no evento ${event.id}. Explique abaixo o que precisa mudar e inclua uma fonte verificável.`,
	};
	Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
	return url.toString();
};
