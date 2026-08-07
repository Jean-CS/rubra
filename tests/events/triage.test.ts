import assert from "node:assert/strict";
import test from "node:test";
import { classifyEventTriage } from "../../scripts/events/triage";
import type { EventTriageCategory, ExternalEvent } from "../../scripts/events/types";

const externalEvent = (overrides: Partial<ExternalEvent> = {}): ExternalEvent => ({
	provider: "sympla",
	classification: "uncertain",
	externalId: "example",
	url: "https://www.sympla.com.br/evento/exemplo/example",
	title: "Evento amplo",
	date: "2026-09-10",
	location: "Londrina, PR",
	city: "Londrina",
	format: "Presencial",
	organizerName: "Organizador local",
	description: "Descrição pública do evento.",
	status: "Agendado",
	tags: ["Evento"],
	...overrides,
});

const curatedCases: Array<{
	title: string;
	organizerName: string;
	expected: EventTriageCategory;
}> = [
	{ title: "Sindromes Hipertensivas na Gestação - TURMA 1 8:30H", organizerName: "Divisão de Ensino e Pesquisa do HU-UEL", expected: "obvious-no" },
	{ title: "Sindromes Hipertensivas na Gestação - TURMA 2 13:30H", organizerName: "Divisão de Ensino e Pesquisa do HU-UEL", expected: "obvious-no" },
	{ title: "OncoGI Londrina 2026", organizerName: "Hospital do Câncer de Londrina", expected: "obvious-no" },
	{ title: "XII Fórum de Prerrogativas", organizerName: "OAB Londrina", expected: "obvious-no" },
	{ title: "XII Seminário de Direito Previdenciário da OAB/PR", organizerName: "OAB Londrina", expected: "obvious-no" },
	{ title: "Interações Energéticas com Pessoas e Ambientes / Londrina-PR", organizerName: "Instituto Internacional de Projeciologia e Conscienciologia", expected: "obvious-no" },
	{ title: "Preço Inteligente: do Custo ao Valor, em Londrina", organizerName: "Conselho de Arquitetura e Urbanismo do Paraná", expected: "obvious-no" },
	{ title: "Palestra Comercial Londrina", organizerName: "Scherer Autopeças", expected: "obvious-no" },
	{ title: "ESG+ Londrina 2026", organizerName: "Associação Norte Paranaense dos Engenheiros Ambientais", expected: "obvious-no" },
	{ title: "FOOD NATION TOUR EDIÇÃO LONDRINA", organizerName: "Grupo Food Nation", expected: "obvious-no" },
	{ title: "CW26 - Construtech Week 2026", organizerName: "Sinduscon PR Norte", expected: "review" },
	{ title: "Similar Tech Experience", organizerName: "Similar Tecnologia e Automação", expected: "review" },
];

test("reproduz as decisões editoriais usadas para calibrar a triagem", () => {
	for (const [index, curated] of curatedCases.entries()) {
		const result = classifyEventTriage(externalEvent({
			externalId: String(index),
			title: curated.title,
			organizerName: curated.organizerName,
			description: `${curated.title}, organizado por ${curated.organizerName}.`,
		}));
		assert.equal(result.category, curated.expected, curated.title);
		assert.ok(result.reasons.length > 0, curated.title);
	}
});

test("preserva Health Connect como exceção editorial de tecnologia", () => {
	const result = classifyEventTriage(externalEvent({
		externalId: "3508566",
		title: "Health Connect Summit 2026",
		organizerName: "POLO DA SAÚDE DE LONDRINA",
	}));
	assert.equal(result.category, "technology");
	assert.match(result.reasons[0], /Exceção editorial/);
});

test("distingue tecnologia direta de metadados insuficientes", () => {
	assert.equal(classifyEventTriage(externalEvent({
		title: "GDG Londrina: Cloud e desenvolvimento de software",
		organizerName: "GDG Londrina",
	})).category, "technology");
	assert.equal(classifyEventTriage(externalEvent()).category, "review");
});
