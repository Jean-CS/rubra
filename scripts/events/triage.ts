import { normalizeText } from "./text";
import type { EventTriageSuggestion, ExternalEvent } from "./types";

interface SignalRule {
	reason: string;
	phrases: readonly string[];
}

const EDITORIAL_OVERRIDES: Readonly<Record<string, EventTriageSuggestion>> = {
	"sympla:3508566": {
		category: "technology",
		reasons: ["Exceção editorial: Health Connect Summit é um evento de tecnologia para a comunidade de saúde"],
	},
};

const OBVIOUS_NO_RULES: readonly SignalRule[] = [
	{
		reason: "Tema médico ou clínico sem foco tecnológico explícito",
		phrases: ["sindrome", "gestacao", "oncogi", "oncologia", "cirurgia", "cardiologia"],
	},
	{
		reason: "Tema jurídico ou profissional da advocacia",
		phrases: ["direito previdenciario", "forum de prerrogativas", "prerrogativas", "oab londrina"],
	},
	{
		reason: "Tema de alimentação, restaurantes ou food service",
		phrases: ["food nation", "food service", "gastronomia", "restaurante"],
	},
	{
		reason: "Tema comercial ou de precificação para outro setor",
		phrases: ["palestra comercial", "preco inteligente", "autopecas"],
	},
	{
		reason: "Tema de ESG e engenharia ambiental, não da comunidade de tecnologia",
		phrases: ["esg londrina", "engenheiros ambientais"],
	},
	{
		reason: "Tema de projeciologia ou conscienciologia",
		phrases: ["interacoes energeticas", "projeciologia", "conscienciologia"],
	},
];

const REVIEW_RULES: readonly SignalRule[] = [
	{
		reason: "Tecnologia aplicada principalmente à construção, arquitetura ou mercado imobiliário",
		phrases: ["construtech", "construcao civil", "mercado imobiliario", "engenharia civil", "arquitetura"],
	},
	{
		reason: "Tecnologia e automação voltadas principalmente à operação industrial",
		phrases: ["automacao", "industria 4", "tecnologia industrial", "manutencao industrial"],
	},
	{
		reason: "Tecnologia aplicada a uma comunidade setorial; requer confirmação editorial",
		phrases: ["healthtech", "health", "saude", "agtech", "agrotech", "agrotec", "agro", "fintech", "legaltech", "edtech", "martech", "greentech", "cleantech", "biotech"],
	},
];

const TECHNOLOGY_SIGNALS: readonly SignalRule[] = [
	{
		reason: "Tema direto de desenvolvimento de software ou comunidade técnica",
		phrases: ["gdg", "developer", "desenvolvedor", "software", "programacao", "frontend", "backend", "open source"],
	},
	{
		reason: "Tema direto de infraestrutura, dados, segurança ou inteligência artificial",
		phrases: ["cloud", "devops", "dados", "data", "ciberseguranca", "cybersecurity", "inteligencia artificial", "ia"],
	},
	{
		reason: "Formato prático voltado à criação de soluções tecnológicas",
		phrases: ["hackathon", "code dojo", "coding dojo"],
	},
];

const includesPhrase = (text: string, phrase: string) =>
	` ${text} `.includes(` ${normalizeText(phrase)} `);

const matchingReasons = (text: string, rules: readonly SignalRule[]) =>
	rules
		.filter((rule) => rule.phrases.some((phrase) => includesPhrase(text, phrase)))
		.map((rule) => rule.reason);

export const classifyEventTriage = (event: ExternalEvent): EventTriageSuggestion => {
	const override = EDITORIAL_OVERRIDES[`${event.provider}:${event.externalId}`];
	if (override) return override;

	const text = normalizeText([
		event.title,
		event.organizerName,
		event.description ?? "",
	].join(" "));
	const obviousNoReasons = matchingReasons(text, OBVIOUS_NO_RULES);
	if (obviousNoReasons.length > 0) return { category: "obvious-no", reasons: obviousNoReasons };

	const reviewReasons = matchingReasons(text, REVIEW_RULES);
	if (reviewReasons.length > 0) return { category: "review", reasons: reviewReasons };

	const technologyReasons = matchingReasons(text, TECHNOLOGY_SIGNALS);
	if (technologyReasons.length > 0) return { category: "technology", reasons: technologyReasons };

	if (event.classification === "technology") {
		return {
			category: "technology",
			reasons: ["Evento listado no catálogo público de tecnologia da fonte"],
		};
	}

	return {
		category: "review",
		reasons: ["Metadados públicos insuficientes para confirmar ou rejeitar o foco em tecnologia"],
	};
};
