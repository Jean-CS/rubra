import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { MeetupAdapter } from "./adapters/meetup";
import { SymplaAdapter } from "./adapters/sympla";
import { discoveryConfig } from "./config";
import { reconcileEvents, relativeChangedFiles, writeCandidates } from "./content";
import { PublicHttpClient } from "./http";
import type { EventAdapter } from "./types";

export const runSync = async (projectRoot: string) => {
	const adapters: EventAdapter[] = [];
	const clients: PublicHttpClient[] = [];
	if (discoveryConfig.symplaEnabled) {
		const http = new PublicHttpClient({ ...discoveryConfig.http, ...discoveryConfig.symplaHttp });
		clients.push(http);
		adapters.push(new SymplaAdapter(
			http,
			discoveryConfig.symplaCatalogUrls,
			discoveryConfig.timeZone,
			discoveryConfig.allowedCities,
			discoveryConfig.symplaRobotsUrl,
			discoveryConfig.http.userAgent,
		));
	}
	if (discoveryConfig.meetupEnabled) {
		const http = new PublicHttpClient({ ...discoveryConfig.http, ...discoveryConfig.meetupHttp });
		clients.push(http);
		adapters.push(new MeetupAdapter(
			http,
			discoveryConfig.meetupDiscoveryUrl,
			discoveryConfig.meetupKnownGroups,
			discoveryConfig.meetupTechKeywords,
			discoveryConfig.allowedCities,
			discoveryConfig.timeZone,
			discoveryConfig.meetupRobotsUrl,
			discoveryConfig.http.userAgent,
			discoveryConfig.meetupMaxGroupsPerRun,
		));
	}

	// Só escreve após todas as fontes terminarem; bloqueio ou parser quebrado preserva o conteúdo atual.
	const discovered = (await Promise.all(adapters.map((adapter) => adapter.discover()))).flat();
	const result = await reconcileEvents(discovered, projectRoot);
	const candidatePath = await writeCandidates(projectRoot, result.candidates);
	return {
		...result,
		candidatePath,
		logicalRequestsMade: clients.reduce((total, client) => total + client.logicalRequestsMade, 0),
		requestsMade: clients.reduce((total, client) => total + client.requestsMade, 0),
	};
};

const isEntrypoint = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isEntrypoint) {
	const projectRoot = resolve(process.cwd());
	runSync(projectRoot)
		.then((result) => {
			console.log(JSON.stringify({
				discovered: result.discoveredCount,
				changedFiles: relativeChangedFiles(result.changedFiles, projectRoot),
				candidates: result.candidates.length,
				logicalRequests: result.logicalRequestsMade,
				requests: result.requestsMade,
			}, null, 2));
		})
		.catch((error) => {
			console.error(error instanceof Error ? error.message : error);
			process.exitCode = 1;
		});
}
