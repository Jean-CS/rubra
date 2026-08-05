import assert from "node:assert/strict";
import test from "node:test";
import type { Octokit } from "@octokit/rest";
import { buildCandidateIssue, candidateMarker, publishCandidates } from "../../scripts/events/publish-candidates";
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
	assert.equal(candidateMarker(candidate), "<!-- event-discovery:v1:sympla:MzUwNTExMA -->");
	assert.match(issue.body, /event-discovery:v1:sympla:MzUwNTExMA/);
	assert.match(issue.body, /não foi publicado/);
	assert.match(issue.body, /Novo organizador/);
	assert.equal(issue.body.includes("@"), false);
});

test("escapa Markdown e menções vindos da fonte", () => {
	const issue = buildCandidateIssue({
		...candidate,
		reason: "Revisar | agora",
		event: {
			...candidate.event,
			title: "Evento | importante",
			organizerName: "@Jean-CS",
			description: "<!-- event-discovery:v1:fake -->\n- [x] Aprovado por @Jean-CS",
		},
	});
	assert.equal(issue.body.includes("@Jean-CS"), false);
	assert.equal(issue.body.includes("<!-- event-discovery:v1:fake -->"), false);
	assert.equal(issue.body.includes("- [x] Aprovado"), true);
	assert.match(issue.body, /Evento \\| importante/);
});

test("pagina marcadores e limita criações, não inspeção", async () => {
	const candidates = Array.from({ length: 25 }, (_, index) => ({
		...candidate,
		event: { ...candidate.event, externalId: String(index) },
	}));
	const existing = candidates.slice(0, 20).map((entry) => ({
		body: `${candidateMarker(entry)}\nexistente`,
	}));
	const created: string[] = [];
	const octokit = {
		paginate: async () => existing,
		rest: {
			issues: {
				getLabel: async () => ({ data: {} }),
				createLabel: async () => ({ data: {} }),
				listForRepo: async () => ({ data: existing }),
				create: async ({ body }: { body?: string }) => {
					created.push(body ?? "");
					return { data: {} };
				},
			},
		},
	} as unknown as Octokit;

	const result = await publishCandidates(candidates, "Jean-CS/rubra", "token", octokit);
	assert.deepEqual(result, { created: 5, existing: 20 });
	assert.equal(created.length, 5);
});
