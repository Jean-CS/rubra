import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { DiscoveryCandidate } from "./types";

const LABEL = "descoberta-automatica";

export const candidateMarker = (candidate: DiscoveryCandidate) =>
	`<!-- event-discovery:${candidate.event.provider}:${candidate.event.externalId} -->`;

export const buildCandidateIssue = (candidate: DiscoveryCandidate) => {
	const { event } = candidate;
	return {
		title: `[Evento descoberto] ${event.title}`,
		body: `${candidateMarker(candidate)}

## Descoberta automática

Este evento foi encontrado em uma página pública e **não foi publicado**. A descoberta precisa de revisão humana porque: **${candidate.reason}**.

| Campo | Valor |
| --- | --- |
| Fonte | ${event.provider} |
| Classificação | ${event.classification === "technology" ? "Tecnologia" : "Incerta"} |
| ID externo | \`${event.externalId}\` |
| Evento | ${event.title} |
| Data | ${event.date}${event.endDate ? ` a ${event.endDate}` : ""} |
| Horário | ${event.time ?? "Não informado"} |
| Local | ${event.location} |
| Formato | ${event.format} |
| Organizador | ${event.organizerName} |
| Status | ${event.status} |
| URL pública | ${event.url} |

### Descrição encontrada

${event.description ?? "Não disponível na fonte pública."}

### Revisão

- [ ] Confirmar relação com tecnologia em Londrina
- [ ] Associar ou cadastrar o organizador
- [ ] Conferir data, local, formato e URL
- [ ] Criar o Markdown em PR separado se aprovado

_Gerado pelo coletor público do Rubra. Não contém e-mail ou dados privados do organizador._`,
	};
};

interface GitHubIssue { body?: string | null }

const githubRequest = async <T>(path: string, token: string, init: RequestInit = {}): Promise<T> => {
	const response = await fetch(`https://api.github.com${path}`, {
		...init,
		headers: {
			Accept: "application/vnd.github+json",
			Authorization: `Bearer ${token}`,
			"X-GitHub-Api-Version": "2022-11-28",
			"User-Agent": "RubraEventIndexer/1.0",
			...init.headers,
		},
	});
	if (!response.ok) throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
	return response.status === 204 ? undefined as T : response.json() as Promise<T>;
};

const ensureLabel = async (repository: string, token: string) => {
	const path = `/repos/${repository}/labels/${encodeURIComponent(LABEL)}`;
	const response = await fetch(`https://api.github.com${path}`, {
		headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "RubraEventIndexer/1.0" },
	});
	if (response.ok) return;
	if (response.status !== 404) throw new Error(`Não foi possível verificar label: HTTP ${response.status}`);
	await githubRequest(`/repos/${repository}/labels`, token, {
		method: "POST",
		body: JSON.stringify({ name: LABEL, color: "6f5ae8", description: "Evento encontrado pelo coletor público" }),
	});
};

export const publishCandidates = async (
	candidates: DiscoveryCandidate[],
	repository: string,
	token: string,
) => {
	if (candidates.length === 0) return { created: 0, existing: 0 };
	await ensureLabel(repository, token);
	const issues = await githubRequest<GitHubIssue[]>(
		`/repos/${repository}/issues?state=all&labels=${encodeURIComponent(LABEL)}&per_page=100`,
		token,
	);
	let created = 0;
	let existing = 0;
	for (const candidate of candidates.slice(0, 20)) {
		const marker = candidateMarker(candidate);
		if (issues.some((issue) => issue.body?.includes(marker))) {
			existing += 1;
			continue;
		}
		const issue = buildCandidateIssue(candidate);
		await githubRequest(`/repos/${repository}/issues`, token, {
			method: "POST",
			body: JSON.stringify({ ...issue, labels: [LABEL, "evento"] }),
		});
		created += 1;
	}
	return { created, existing };
};

if (process.argv[1]?.endsWith("publish-candidates.ts")) {
	const token = process.env.GITHUB_TOKEN;
	const repository = process.env.GITHUB_REPOSITORY;
	if (!token || !repository) {
		console.log("GITHUB_TOKEN/GITHUB_REPOSITORY ausentes; publicação de candidatos ignorada.");
	} else {
		const path = resolve(process.cwd(), ".event-sync/candidates.json");
		readFile(path, "utf8")
			.then((source) => publishCandidates(JSON.parse(source), repository, token))
			.then((result) => console.log(JSON.stringify(result)))
			.catch((error) => { console.error(error); process.exitCode = 1; });
	}
}
