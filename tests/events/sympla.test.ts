import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseSymplaCatalog, SymplaAdapter } from "../../scripts/events/adapters/sympla";

const fixture = new URL("../fixtures/sympla-catalog.html", import.meta.url);

test("extrai estado público da Sympla sem carregar página individual", async () => {
	const events = parseSymplaCatalog(await readFile(fixture, "utf8"), "America/Sao_Paulo", "technology");
	assert.equal(events.length, 2);
	assert.deepEqual(events[0], {
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
		description: "ECOTICNOVA 2026, organizado por GDG Londrina, com realização em Aurora Shopping — Londrina, PR.",
		status: "Agendado",
		tags: ["Tecnologia", "Evento"],
	});
	assert.equal(events[1].format, "Online");
	assert.equal(events[1].endDate, "2026-10-12");
	assert.equal(JSON.stringify(events).includes("nao-armazenar"), false);
});

test("deduplica o mesmo evento presente em categorias diferentes", async () => {
	const html = await readFile(fixture, "utf8");
	const http = { getText: async () => html } as never;
	const events = await new SymplaAdapter(http, [
		"https://example.com/eventos/londrina-pr/tecnologia",
		"https://example.com/eventos/londrina-pr/congresso-palestra",
		"https://example.com/eventos/londrina-pr/curso-workshop",
	], "America/Sao_Paulo", ["Londrina"]).discover();
	assert.equal(events.length, 2);
	assert.equal(events.every(({ classification }) => classification === "technology"), true);
});

test("falha com payload alterado ou incompleto sem inventar eventos", () => {
	assert.throws(
		() => parseSymplaCatalog("<html><script>self.__next_f.push([1,\"{}\"])</script></html>", "America/Sao_Paulo"),
		/payload/i,
	);
	assert.throws(() => parseSymplaCatalog("<html>layout novo</html>", "America/Sao_Paulo"), /serializado/i);
});

test("preserva cidade ausente como incompleta para triagem", async () => {
	const html = (await readFile(fixture, "utf8")).replaceAll('\\"city\\":\\"Londrina\\",', "");
	const events = parseSymplaCatalog(html, "America/Sao_Paulo", "technology");
	assert.equal(events.length, 2);
	assert.equal(events.every(({ city }) => city === ""), true);
	assert.equal(events.every(({ location }) => !location.includes("Londrina")), true);
});

test("rejeita URLs de evento fora do provedor", async () => {
	const html = (await readFile(fixture, "utf8")).replace(
		"https://www.sympla.com.br/evento/ecoticnova-2026/3505110?referrer=fixture",
		"https://example.com/evento/3505110",
	);
	const events = parseSymplaCatalog(html, "America/Sao_Paulo", "technology");
	assert.equal(events.some(({ externalId }) => externalId === "3505110"), false);
});
