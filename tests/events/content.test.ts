import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { reconcileEvents } from "../../scripts/events/content";
import type { ExternalEvent } from "../../scripts/events/types";

const createProject = async () => {
	const root = await mkdtemp(join(tmpdir(), "rubra-events-"));
	await Promise.all([
		mkdir(join(root, "src/content/events"), { recursive: true }),
		mkdir(join(root, "src/content/communities"), { recursive: true }),
		mkdir(join(root, "src/content/institutions"), { recursive: true }),
	]);
	await writeFile(join(root, "src/content/communities/gdg-londrina.md"), `---
name: GDG Londrina
aliases:
  - GDG Londrina no Sympla
type: Developers
description: Comunidade
cadence: Meetups
status: Ativa
accent: red
tags:
  - Web
  - Cloud
---
`, "utf8");
	return root;
};

const externalEvent = (overrides: Partial<ExternalEvent> = {}): ExternalEvent => ({
	provider: "sympla",
	classification: "technology",
	externalId: "3505110",
	url: "https://www.sympla.com.br/evento/ecoticnova-2026/3505110",
	title: "ECOTICNOVA 2026",
	date: "2026-09-10",
	time: "08h",
	location: "Aurora Shopping — Londrina, PR",
	city: "Londrina",
	format: "Presencial",
	organizerName: "GDG Londrina",
	description: "Descrição factual da fonte.",
	status: "Agendado",
	tags: ["Tecnologia"],
	...overrides,
});

test("reconcilia evento manual, protege syncIgnore e é idempotente", async () => {
	const root = await createProject();
	const path = join(root, "src/content/events/ecoticnova.md");
	await writeFile(path, `---
title: ECOTICNOVA 2026
date: 2026-09-10
location: Local corrigido pela comunidade — Londrina, PR
format: Presencial
organizerName: GDG Londrina
organizerType: Comunidade
url: https://github.com/Jean-CS/rubra
description: Descrição corrigida pela comunidade.
tags:
  - Comunidade
syncIgnore:
  - description
  - location
---
`, "utf8");

	const first = await reconcileEvents([externalEvent()], root);
	assert.equal(first.changedFiles.length, 1);
	const updated = await readFile(path, "utf8");
	assert.match(updated, /provider: sympla/);
	assert.match(updated, /externalId: "?3505110"?/);
	assert.match(updated, /Descrição corrigida pela comunidade/);
	assert.match(updated, /Local corrigido pela comunidade — Londrina, PR/);

	const second = await reconcileEvents([externalEvent()], root);
	assert.deepEqual(second.changedFiles, []);
	const absent = await reconcileEvents([], root);
	assert.deepEqual(absent.changedFiles, []);
	assert.deepEqual(await readdir(join(root, "src/content/events")), ["ecoticnova.md"]);
});

test("cria Markdown apenas para organizador reconhecido e envia desconhecido para candidato", async () => {
	const root = await createProject();
	const result = await reconcileEvents([
		externalEvent({ externalId: "1", title: "Evento conhecido", url: "https://www.sympla.com.br/evento/conhecido/1" }),
		externalEvent({ externalId: "2", title: "Evento incerto", url: "https://www.sympla.com.br/evento/incerto/2", organizerName: "Organizador Novo" }),
	], root);
	assert.equal(result.changedFiles.length, 1);
	assert.equal(result.candidates.length, 1);
	assert.match(result.candidates[0].reason, /não reconhecido/);
	assert.equal(result.candidates[0].triage.category, "technology");
	assert.ok(result.candidates[0].triage.reasons.length > 0);
	const created = await readFile(result.changedFiles[0], "utf8");
	assert.match(created, /status: Agendado/);
	assert.match(created, /source:/);
});

test("reconhece alias da fonte e preserva o nome editorial do organizador", async () => {
	const root = await createProject();
	const result = await reconcileEvents([
		externalEvent({ organizerName: "GDG Londrina no Sympla" }),
	], root);
	assert.equal(result.candidates.length, 0);
	assert.equal(result.changedFiles.length, 1);
	const created = await readFile(result.changedFiles[0], "utf8");
	assert.match(created, /organizerName: GDG Londrina/);
	assert.doesNotMatch(created, /organizerName: GDG Londrina no Sympla/);
});

test("manda classificação incerta para triagem mesmo com organizador reconhecido", async () => {
	const root = await createProject();
	const result = await reconcileEvents([
		externalEvent({ classification: "uncertain", title: "Curso amplo", externalId: "9" }),
	], root);
	assert.deepEqual(result.changedFiles, []);
	assert.equal(result.candidates.length, 1);
	assert.match(result.candidates[0].reason, /Classificação/);
	assert.equal(result.candidates[0].triage.category, "technology");
});

test("organizador desconhecido não herda confiança de evento existente", async () => {
	const root = await createProject();
	const path = join(root, "src/content/events/existing.md");
	await writeFile(path, `---
title: ECOTICNOVA 2026
date: 2026-09-10
location: Londrina, PR
format: Presencial
organizerName: GDG Londrina
organizerType: Comunidade
url: https://www.sympla.com.br/evento/original/1
description: Evento confiável.
tags: [Tecnologia]
---
`, "utf8");

	const result = await reconcileEvents([externalEvent({
		externalId: "attacker",
		url: "https://www.sympla.com.br/evento/colisao/2",
		organizerName: "Organizador Desconhecido",
		location: "Londrina, PR",
	})], root);
	assert.deepEqual(result.changedFiles, []);
	assert.equal(result.candidates.length, 1);
	assert.match(result.candidates[0].reason, /não reconhecido/);
	assert.match(await readFile(path, "utf8"), /evento\/original\/1/);
});

test("protege descrição editorial ao vincular uma fonte pela primeira vez", async () => {
	const root = await createProject();
	const path = join(root, "src/content/events/manual.md");
	await writeFile(path, `---
title: ECOTICNOVA 2026
date: 2026-09-10
location: Londrina, PR
format: Presencial
organizerName: GDG Londrina
organizerType: Comunidade
url: https://www.sympla.com.br/evento/ecoticnova-2026/3505110
description: Texto editorial detalhado e aprovado.
tags: [Tecnologia]
---
`, "utf8");
	await reconcileEvents([externalEvent()], root);
	const updated = await readFile(path, "utf8");
	assert.match(updated, /Texto editorial detalhado e aprovado/);
	assert.match(updated, /syncIgnore:\n  - description/);
});

test("só altera status existente quando Meetup declara adiamento ou cancelamento", async () => {
	const root = await createProject();
	const path = join(root, "src/content/events/status.md");
	await writeFile(path, `---
title: ECOTICNOVA 2026
date: 2026-09-10
location: Londrina, PR
format: Presencial
organizerName: GDG Londrina
organizerType: Comunidade
url: https://www.meetup.com/gdg-londrina/events/123
description: Evento.
tags: [Tecnologia]
status: Cancelado
source:
  provider: meetup
  externalId: "123"
  url: https://www.meetup.com/gdg-londrina/events/123
---
`, "utf8");
	const scheduled = externalEvent({ provider: "meetup", externalId: "123", url: "https://www.meetup.com/gdg-londrina/events/123", status: "Agendado" });
	await reconcileEvents([scheduled], root);
	assert.match(await readFile(path, "utf8"), /status: Cancelado/);
	await reconcileEvents([{ ...scheduled, status: "Adiado" }], root);
	assert.match(await readFile(path, "utf8"), /status: Adiado/);
});
