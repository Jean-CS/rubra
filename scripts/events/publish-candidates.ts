import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Octokit } from "@octokit/rest";
import {
	discoveryCandidateSchema,
	type DiscoveryCandidate,
	type EventTriageCategory,
} from "./types";
import { truncate } from "./text";

const LABEL = "descoberta-automatica";
const TRIAGE_LABELS: Record<EventTriageCategory, {
	name: string;
	color: string;
	description: string;
	displayName: string;
}> = {
	"obvious-no": {
		name: "triagem:obvio-nao",
		color: "D93F0B",
		description: "Provavelmente fora do escopo de tecnologia do Rubra",
		displayName: "Óbvio não",
	},
	review: {
		name: "triagem:revisar",
		color: "FBCA04",
		description: "Relação com a comunidade de tecnologia precisa de revisão",
		displayName: "Revisar",
	},
	technology: {
		name: "triagem:tecnologia",
		color: "0E8A16",
		description: "Provavelmente relacionado diretamente à comunidade de tecnologia",
		displayName: "Tecnologia",
	},
};
const MAX_CREATED_PER_RUN = 20;
const REQUEST_TIMEOUT_MS = 8_000;

export const candidateMarker = (candidate: DiscoveryCandidate) =>
	`<!-- event-discovery:v1:${candidate.event.provider}:${Buffer.from(candidate.event.externalId).toString("base64url")} -->`;

const escapeInline = (value: string, maxLength = 240) =>
	truncate(value, maxLength)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll("@", "&#64;")
		.replaceAll("|", "\\|")
		.replace(/\r?\n/g, "<br>");

const escapePreformatted = (value: string, maxLength = 1_000) =>
	truncate(value, maxLength)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll("@", "&#64;");

export const buildCandidateIssue = (candidate: DiscoveryCandidate) => {
	const { event } = candidate;
	const triageLabel = TRIAGE_LABELS[candidate.triage.category];
	const triageReasons = candidate.triage.reasons
		.map((reason) => `- ${escapeInline(reason, 500)}`)
		.join("\n");
	return {
		title: `[Evento descoberto] ${truncate(event.title.replace(/\s+/g, " ").trim(), 180).replaceAll("@", "@\u200b")}`,
		body: `${candidateMarker(candidate)}

## Descoberta automática

Este evento foi encontrado em uma página pública e **não foi publicado**. A descoberta precisa de revisão humana porque: **${escapeInline(candidate.reason)}**.

| Campo | Valor |
| --- | --- |
| Fonte | ${event.provider} |
| Classificação | ${event.classification === "technology" ? "Tecnologia" : "Incerta"} |
| Triagem sugerida | ${triageLabel.displayName} |
| ID externo | ${escapeInline(event.externalId)} |
| Evento | ${escapeInline(event.title)} |
| Data | ${escapeInline(`${event.date}${event.endDate ? ` a ${event.endDate}` : ""}`)} |
| Horário | ${escapeInline(event.time ?? "Não informado")} |
| Local | ${escapeInline(event.location)} |
| Formato | ${event.format} |
| Organizador | ${escapeInline(event.organizerName)} |
| Status | ${event.status} |
| URL pública | ${escapeInline(event.url, 500)} |

### Descrição encontrada

<pre>${escapePreformatted(event.description ?? "Não disponível na fonte pública.")}</pre>

### Motivos da triagem sugerida

${triageReasons}

### Revisão

- [ ] Confirmar relação com tecnologia em Londrina
- [ ] Associar ou cadastrar o organizador
- [ ] Conferir data, local, formato e URL
- [ ] Criar o Markdown em PR separado se aprovado

_Gerado pelo coletor público do Rubra. Não contém e-mail ou dados privados do organizador._`,
	};
};

const repositoryParts = (repository: string) => {
	const [owner, repo, extra] = repository.split("/");
	if (!owner || !repo || extra) throw new Error(`Repositório inválido: ${repository}`);
	return { owner, repo };
};

const requestOptions = () => ({ request: { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) } });

const ensureLabel = async (
	octokit: Octokit,
	owner: string,
	repo: string,
	label: { name: string; color: string; description: string },
) => {
	try {
		await octokit.rest.issues.getLabel({ owner, repo, name: label.name, ...requestOptions() });
	} catch (error) {
		if (!error || typeof error !== "object" || !("status" in error) || error.status !== 404) throw error;
		await octokit.rest.issues.createLabel({
			owner,
			repo,
			name: label.name,
			color: label.color,
			description: label.description,
			...requestOptions(),
		});
	}
};

export const publishCandidates = async (
	candidates: DiscoveryCandidate[],
	repository: string,
	token: string,
	octokit = new Octokit({ auth: token, userAgent: "RubraEventIndexer/1.0" }),
) => {
	if (candidates.length === 0) return { created: 0, existing: 0 };
	const { owner, repo } = repositoryParts(repository);
	for (const label of [
		{ name: LABEL, color: "6f5ae8", description: "Evento encontrado pelo coletor público" },
		...Object.values(TRIAGE_LABELS),
	]) {
		await ensureLabel(octokit, owner, repo, label);
	}
	const issues = await octokit.paginate(octokit.rest.issues.listForRepo, {
		owner,
		repo,
		state: "all",
		labels: LABEL,
		per_page: 100,
		...requestOptions(),
	});
	const existingMarkers = new Set(issues.flatMap((issue) => {
		const firstLine = issue.body?.split(/\r?\n/, 1)[0];
		return firstLine?.startsWith("<!-- event-discovery:v1:") ? [firstLine] : [];
	}));
	let created = 0;
	let existing = 0;
	for (const candidate of candidates) {
		const marker = candidateMarker(candidate);
		if (existingMarkers.has(marker)) {
			existing += 1;
			continue;
		}
		if (created >= MAX_CREATED_PER_RUN) break;
		const issue = buildCandidateIssue(candidate);
		await octokit.rest.issues.create({
			owner,
			repo,
			...issue,
			labels: [LABEL, "evento", TRIAGE_LABELS[candidate.triage.category].name],
			...requestOptions(),
		});
		existingMarkers.add(marker);
		created += 1;
	}
	return { created, existing };
};

if (process.argv[1]?.endsWith("publish-candidates.ts")) {
	const token = process.env.GITHUB_TOKEN;
	const repository = process.env.GITHUB_REPOSITORY;
	if (!token || !repository) {
		const message = "GITHUB_TOKEN/GITHUB_REPOSITORY ausentes; publicação de candidatos não executada.";
		if (process.env.GITHUB_ACTIONS === "true") {
			console.error(message);
			process.exitCode = 1;
		} else {
			console.log(message);
		}
	} else {
		const path = resolve(process.cwd(), ".event-sync/candidates.json");
		readFile(path, "utf8")
			.then((source) => publishCandidates(
				discoveryCandidateSchema.array().parse(JSON.parse(source)),
				repository,
				token,
			))
			.then((result) => console.log(JSON.stringify(result)))
			.catch((error) => { console.error(error); process.exitCode = 1; });
	}
}
