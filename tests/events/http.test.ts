import assert from "node:assert/strict";
import test from "node:test";
import { PublicHttpClient, RequestLimitError, SourceBlockedError } from "../../scripts/events/http";

const options = {
	userAgent: "RubraEventIndexer/test",
	timeoutMs: 1_000,
	maxAttempts: 2,
	maxRequests: 4,
	maxRedirects: 3,
	allowedHosts: ["example.com"],
};

test("interrompe imediatamente em 403 e 429", async () => {
	for (const status of [403, 429]) {
		let calls = 0;
		const client = new PublicHttpClient({
			...options,
			fetchImpl: async () => { calls += 1; return new Response("blocked", { status }); },
		});
		await assert.rejects(client.getText("https://example.com"), SourceBlockedError);
		assert.equal(calls, 1);
	}
});

test("não segue redirect para Queue-it nem aceita captcha ou Cloudflare", async () => {
	const redirectClient = new PublicHttpClient({
		...options,
		fetchImpl: async () => new Response(null, { status: 302, headers: { location: "https://queue-it.example.com/wait" } }),
	});
	await assert.rejects(redirectClient.getText("https://example.com"), SourceBlockedError);

	for (const body of ["<title>captcha</title>", '<div class="cf-chl-widget">challenge</div>']) {
		const client = new PublicHttpClient({ ...options, fetchImpl: async () => new Response(body) });
		await assert.rejects(client.getText("https://example.com"), SourceBlockedError);
	}
});

test("segue somente redirects HTTPS dentro da fonte permitida", async () => {
	let safeCalls = 0;
	const safe = new PublicHttpClient({
		...options,
		fetchImpl: async () => {
			safeCalls += 1;
			return safeCalls === 1
				? new Response(null, { status: 302, headers: { location: "/catalogo" } })
				: new Response("ok");
		},
	});
	assert.equal(await safe.getText("https://example.com/inicio"), "ok");
	assert.equal(safeCalls, 2);

	for (const location of [
		"http://example.com/inseguro",
		"https://other.example/catalogo",
		"http://127.0.0.1:3000/admin",
	]) {
		let calls = 0;
		const client = new PublicHttpClient({
			...options,
			fetchImpl: async () => {
				calls += 1;
				return new Response(null, { status: 302, headers: { location } });
			},
		});
		await assert.rejects(client.getText("https://example.com"), SourceBlockedError);
		assert.equal(calls, 1);
	}
});

test("tenta falha transitória no máximo duas vezes e respeita teto global", async () => {
	let calls = 0;
	const retrying = new PublicHttpClient({
		...options,
		fetchImpl: async () => {
			calls += 1;
			if (calls === 1) throw new TypeError("network");
			return new Response("ok");
		},
	});
	assert.equal(await retrying.getText("https://example.com"), "ok");
	assert.equal(calls, 2);
	assert.equal(retrying.logicalRequestsMade, 1);
	assert.equal(retrying.requestsMade, 2);

	const limited = new PublicHttpClient({ ...options, maxRequests: 1, fetchImpl: async () => new Response("ok") });
	await limited.getText("https://example.com/one");
	await assert.rejects(limited.getText("https://example.com/two"), RequestLimitError);
});
