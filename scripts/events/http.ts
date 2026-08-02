export class SourceBlockedError extends Error {
	constructor(
		message: string,
		public readonly status?: number,
	) {
		super(message);
		this.name = "SourceBlockedError";
	}
}

export class RequestLimitError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "RequestLimitError";
	}
}

interface HttpClientOptions {
	userAgent: string;
	timeoutMs: number;
	maxAttempts: number;
	maxRequests: number;
	maxRedirects: number;
	allowedHosts: readonly string[];
	fetchImpl?: typeof fetch;
}

const BLOCK_SIGNALS = [
	/queue-it/i,
	/queueit/i,
	/captcha/i,
	/challenge-platform/i,
	/cf-chl-/i,
	/just a moment/i,
	/cloudflare ray id/i,
	/attention required.*cloudflare/i,
];

const looksBlocked = (value: string) => BLOCK_SIGNALS.some((pattern) => pattern.test(value));

export class PublicHttpClient {
	private requestCount = 0;
	private logicalRequestCount = 0;
	private readonly fetchImpl: typeof fetch;

	constructor(private readonly options: HttpClientOptions) {
		this.fetchImpl = options.fetchImpl ?? fetch;
	}

	get requestsMade() {
		return this.requestCount;
	}

	get logicalRequestsMade() {
		return this.logicalRequestCount;
	}

	async getText(url: string): Promise<string> {
		this.assertSafeDestination(url);
		this.logicalRequestCount += 1;
		let lastError: unknown;

		for (let attempt = 1; attempt <= this.options.maxAttempts; attempt += 1) {
			try {
				return await this.requestFollowingSafeRedirects(url);
			} catch (error) {
				if (error instanceof SourceBlockedError || error instanceof RequestLimitError) throw error;
				lastError = error;
				if (attempt === this.options.maxAttempts) break;
			}
		}

		throw lastError instanceof Error ? lastError : new Error(`Falha ao consultar ${url}`);
	}

	private async requestFollowingSafeRedirects(initialUrl: string): Promise<string> {
		let currentUrl = initialUrl;

		for (let redirect = 0; redirect <= this.options.maxRedirects; redirect += 1) {
			this.assertSafeDestination(currentUrl);
			if (this.requestCount >= this.options.maxRequests) {
				throw new RequestLimitError(`Limite de ${this.options.maxRequests} requisições atingido`);
			}

			this.requestCount += 1;
			const response = await this.fetchImpl(currentUrl, {
				headers: {
					Accept: "text/html,application/xhtml+xml",
					"User-Agent": this.options.userAgent,
				},
				redirect: "manual",
				signal: AbortSignal.timeout(this.options.timeoutMs),
			});

			if (response.status === 403 || response.status === 429) {
				throw new SourceBlockedError(`Fonte interrompida após HTTP ${response.status}`, response.status);
			}

			if (response.status >= 300 && response.status < 400) {
				const location = response.headers.get("location");
				if (!location) throw new Error(`Redirecionamento sem destino em ${currentUrl}`);
				const nextUrl = new URL(location, currentUrl).toString();
				this.assertSafeDestination(nextUrl);
				if (looksBlocked(nextUrl)) {
					throw new SourceBlockedError(`Fonte redirecionou para uma proteção: ${new URL(nextUrl).hostname}`);
				}
				currentUrl = nextUrl;
				continue;
			}

			if (!response.ok) throw new Error(`HTTP ${response.status} ao consultar ${currentUrl}`);
			this.assertSafeDestination(response.url || currentUrl);

			const text = await response.text();
			if (looksBlocked(`${response.url}\n${text.slice(0, 100_000)}`)) {
				throw new SourceBlockedError("Fonte retornou captcha, Queue-it ou desafio do Cloudflare");
			}
			return text;
		}

		throw new Error(`Redirecionamentos demais ao consultar ${initialUrl}`);
	}

	private assertSafeDestination(value: string) {
		const url = new URL(value);
		if (url.protocol !== "https:") {
			throw new SourceBlockedError(`Destino inseguro recusado: ${url.protocol}`);
		}
		const host = url.hostname.toLocaleLowerCase("en-US");
		if (!this.options.allowedHosts.some((allowed) => host === allowed.toLocaleLowerCase("en-US"))) {
			throw new SourceBlockedError(`Destino fora da fonte permitida: ${host}`);
		}
	}
}
