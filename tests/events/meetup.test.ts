import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseMeetupDiscovery, parseMeetupEvents } from "../../scripts/events/adapters/meetup";
import { canonicalUrl, toLocalDateParts } from "../../scripts/events/text";

test("descobre somente links de grupos com sinais de tecnologia", async () => {
	const html = await readFile(new URL("../fixtures/meetup-discovery.html", import.meta.url), "utf8");
	assert.deepEqual(parseMeetupDiscovery(html, ["aws", "desenvolvimento", "tech"]), [
		"https://www.meetup.com/aws-user-group-londrina/",
		"https://www.meetup.com/Meetup-de-Desenvolvimento-profissional-Londrina/",
	]);
});

test("exige limites de palavra para sinais curtos de tecnologia", () => {
	const html = `
		<a href="/fotografia-londrina/">Fotografia Londrina</a>
		<a href="/familias-londrina/">Famílias Londrina</a>
		<a href="/ia-londrina/">IA Londrina</a>
		<a href="/inteligencia-artificial-londrina/">Inteligência Artificial Londrina</a>
	`;
	assert.deepEqual(parseMeetupDiscovery(html, ["ia", "inteligencia artificial"]), [
		"https://www.meetup.com/ia-londrina/",
		"https://www.meetup.com/inteligencia-artificial-londrina/",
	]);
});

test("preserva datas sem horário e converte instantes para o fuso local", () => {
	assert.deepEqual(toLocalDateParts("2026-09-10", "America/Sao_Paulo"), {
		date: "2026-09-10",
		time: undefined,
	});
	assert.deepEqual(toLocalDateParts("2026-09-10T11:30:00.000Z", "America/Sao_Paulo"), {
		date: "2026-09-10",
		time: "08h30",
	});
	assert.throws(() => toLocalDateParts("2026-02-31", "America/Sao_Paulo"), /inválida/);
});

test("aceita somente URLs HTTP e HTTPS", () => {
	assert.equal(canonicalUrl("https://example.com/path/?tracking=1#section"), "https://example.com/path");
	for (const value of ["javascript:alert(1)", "data:text/html,hello", "file:///tmp/evento"]) {
		assert.throws(() => canonicalUrl(value), /HTTP ou HTTPS/);
	}
});

test("extrai JSON-LD, filtra município e mapeia duração, formato e status explícito", async () => {
	const html = await readFile(new URL("../fixtures/meetup-group.html", import.meta.url), "utf8");
	const events = parseMeetupEvents(html, ["Londrina"], "America/Sao_Paulo");
	assert.equal(events.length, 3);
	assert.equal(events.some(({ title }) => title.includes("Maringá")), false);
	assert.deepEqual(events.map(({ externalId, format, status }) => ({ externalId, format, status })), [
		{ externalId: "310000001", format: "Presencial", status: "Agendado" },
		{ externalId: "310000003", format: "Híbrido", status: "Adiado" },
		{ externalId: "310000004", format: "Online", status: "Cancelado" },
	]);
	assert.equal(events[1].endDate, "2026-10-11");
});

test("falha com JSON-LD de evento alterado em vez de publicar dados parciais", () => {
	const html = '<script type="application/ld+json">{"@type":"Event", inválido}</script>';
	assert.throws(() => parseMeetupEvents(html, ["Londrina"], "America/Sao_Paulo"), /incompleto/i);
});
