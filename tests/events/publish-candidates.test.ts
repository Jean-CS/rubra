import assert from "node:assert/strict";
import test from "node:test";
import { buildCandidateIssue, candidateMarker } from "../../scripts/events/publish-candidates";
import type { DiscoveryCandidate } from "../../scripts/events/types";

const candidate: DiscoveryCandidate = {
	reason: "Organizador ainda não reconhecido pelo Rubra",
	event: {
		provider: "sympla",
		classification: "uncertain",
		externalId: "3505110",
		url: "https://www.sympla.com.br/evento/exemplo/3505110",
		title: "Evento exemplo",
		date: "2026-09-10",
		location: "Londrina, PR",
		city: "Londrina",
		format: "Presencial",
		organizerName: "Novo organizador",
		description: "Descrição pública.",
		status: "Agendado",
		tags: ["Tecnologia"],
	},
};

test("Issue de descoberta contém marcador estável e dados para revisão", () => {
	const issue = buildCandidateIssue(candidate);
	assert.equal(candidateMarker(candidate), "<!-- event-discovery:sympla:3505110 -->");
	assert.match(issue.body, /event-discovery:sympla:3505110/);
	assert.match(issue.body, /não foi publicado/);
	assert.match(issue.body, /Novo organizador/);
	assert.equal(issue.body.includes("@"), false);
});
