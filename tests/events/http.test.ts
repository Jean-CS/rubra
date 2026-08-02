import assert from "node:assert/strict";
import test from "node:test";
import { PublicHttpClient, RequestLimitError, SourceBlockedError } from "../../scripts/events/http";

const options = {
	userAgent: "RubraEventIndexer/test",
	timeoutMs: 1_000,
	maxAttempts: 2,
	maxRequests: 4,
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

	const limited = new PublicHttpClient({ ...options, maxRequests: 1, fetchImpl: async () => new Response("ok") });
	await limited.getText("https://example.com/one");
	await assert.rejects(limited.getText("https://example.com/two"), RequestLimitError);
});
