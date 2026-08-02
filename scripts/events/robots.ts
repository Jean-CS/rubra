import { normalizeText } from "./text";

interface RobotsRule {
	type: "allow" | "disallow";
	pattern: string;
}

const patternMatches = (pattern: string, path: string) => {
	if (!pattern) return false;
	const anchored = pattern.endsWith("$");
	const source = (anchored ? pattern.slice(0, -1) : pattern)
		.replace(/[.+?^${}()|[\]\\]/g, "\\$&")
		.replaceAll("*", ".*");
	return new RegExp(`^${source}${anchored ? "$" : ""}`).test(path);
};

export const robotsAllows = (robots: string, targetUrl: string, userAgent: string) => {
	const product = normalizeText(userAgent.split(/[\s/]/)[0]);
	const groups: Array<{ agents: string[]; rules: RobotsRule[] }> = [];
	let group: { agents: string[]; rules: RobotsRule[] } | undefined;
	let hasRules = false;

	for (const rawLine of robots.split(/\r?\n/)) {
		const line = rawLine.replace(/#.*$/, "").trim();
		if (!line) continue;
		const separator = line.indexOf(":");
		if (separator === -1) continue;
		const field = line.slice(0, separator).trim().toLocaleLowerCase("en-US");
		const value = line.slice(separator + 1).trim();
		if (field === "user-agent") {
			if (!group || hasRules) {
				group = { agents: [], rules: [] };
				groups.push(group);
				hasRules = false;
			}
			group.agents.push(value === "*" ? "*" : normalizeText(value));
		} else if (group && (field === "allow" || field === "disallow")) {
			group.rules.push({ type: field, pattern: value });
			hasRules = true;
		}
	}

	const matchingGroups = groups.filter(({ agents }) =>
		agents.some((agent) => agent === "*" || (agent && product.includes(agent))),
	);
	const specificGroups = matchingGroups.filter(({ agents }) => agents.some((agent) => agent !== "*"));
	const rules = (specificGroups.length > 0 ? specificGroups : matchingGroups).flatMap(({ rules }) => rules);
	const path = `${new URL(targetUrl).pathname}${new URL(targetUrl).search}`;
	const matchingRules = rules
		.filter(({ pattern }) => patternMatches(pattern, path))
		.sort((left, right) =>
			right.pattern.length - left.pattern.length ||
			(left.type === "allow" ? -1 : 1),
		);
	return matchingRules[0]?.type !== "disallow";
};

export const assertRobotsAllowed = (robots: string, urls: readonly string[], userAgent: string) => {
	const denied = urls.find((url) => !robotsAllows(robots, url, userAgent));
	if (denied) throw new Error(`Coleta desativada por robots.txt para ${new URL(denied).pathname}`);
};
