import assert from "node:assert/strict";
import test from "node:test";
import { assertRobotsAllowed, robotsAllows } from "../../scripts/events/robots";

const robots = `
User-agent: *
Disallow: /api
Disallow: /gql
Disallow: /calendar/
Allow: /
`;

test("permite páginas públicas e rejeita endpoints bloqueados pela regra mais específica", () => {
	assert.equal(robotsAllows(robots, "https://www.meetup.com/find/br--londrina/", "RubraEventIndexer/1.0"), true);
	assert.equal(robotsAllows(robots, "https://www.meetup.com/developerparana/", "RubraEventIndexer/1.0"), true);
	assert.equal(robotsAllows(robots, "https://www.meetup.com/gql", "RubraEventIndexer/1.0"), false);
	assert.throws(
		() => assertRobotsAllowed(robots, ["https://www.meetup.com/api/events"], "RubraEventIndexer/1.0"),
		/robots\.txt/,
	);
});
