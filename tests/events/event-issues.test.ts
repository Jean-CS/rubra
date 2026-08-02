import assert from "node:assert/strict";
import test from "node:test";
import { eventCorrectionIssueUrl } from "../../src/lib/eventIssues";

test("link de correção inclui somente a identidade estável do evento", () => {
	const event = {
		id: "eventos/gdg-londrina-encontro",
		title: "GDG Londrina",
		description: "Descrição extensa.".repeat(1_000),
		tags: Array.from({ length: 100 }, (_, index) => `tag-${index}`),
	};

	const correctionUrl = eventCorrectionIssueUrl(event);
	const url = new URL(correctionUrl);

	assert.deepEqual([...url.searchParams.keys()].sort(), [
		"event-reference",
		"evidence",
		"template",
		"title",
	]);
	assert.equal(url.searchParams.get("template"), "indicar-evento.yml");
	assert.equal(url.searchParams.get("event-reference"), event.id);
	assert.equal(url.searchParams.get("title"), `Corrigir evento: ${event.title}`);
	assert.match(url.searchParams.get("evidence") ?? "", /eventos\/gdg-londrina-encontro/);
	assert.equal(correctionUrl.includes("Descrição"), false);
	assert.equal(correctionUrl.length < 600, true);
});
