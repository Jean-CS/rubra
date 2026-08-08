import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import YAML from "yaml";
import {
	COURSE_AREAS,
	formatCourseTuition,
	getCourseLevelFamily,
	getRelatedCourses,
} from "../../src/lib/courses";

type CourseFixture = {
	id: string;
	data: {
		area: (typeof COURSE_AREAS)[number];
		level: string;
		name: string;
	};
};

const course = (
	id: string,
	name: string,
	area: CourseFixture["data"]["area"],
	level = "Tecnólogo",
): CourseFixture => ({ id, data: { area, level, name } });

test("classifica famílias de nível sem misturar graduação, técnico e pós", () => {
	assert.equal(getCourseLevelFamily("Bacharelado"), "graduation");
	assert.equal(getCourseLevelFamily("Técnico Integrado"), "technical");
	assert.equal(getCourseLevelFamily("MBA"), "postgraduate");
});

test("prioriza cursos relacionados de outras instituições e do mesmo nível", () => {
	const current = course("ifpr/ads", "ADS", "software-development");
	const candidates = [
		current,
		course("ifpr/engenharia", "Engenharia de Software", "software-development", "Bacharelado"),
		course("uel/especializacao", "Especialização", "software-development", "Especialização"),
		course("unifil/ads", "ADS UniFil", "software-development"),
		course("senac/ads", "ADS Senac", "software-development"),
		course("uel/dados", "Ciência de Dados", "data-ai"),
	];

	assert.deepEqual(
		getRelatedCourses(candidates, current).map(({ id }) => id),
		["senac/ads", "unifil/ads", "uel/especializacao", "ifpr/engenharia"],
	);
});

test("limita resultados e usa ordenação determinística", () => {
	const current = course("ifpr/ads", "ADS", "software-development");
	const candidates = [
		current,
		course("zeta/ads", "ADS", "software-development"),
		course("alpha/ads", "ADS", "software-development"),
		course("beta/ads", "ADS", "software-development"),
	];

	assert.deepEqual(
		getRelatedCourses(candidates, current, 2).map(({ id }) => id),
		["alpha/ads", "beta/ads"],
	);
});

test("formata mensalidade estruturada sem vazar representação de objeto", () => {
	assert.equal(formatCourseTuition({ type: "free" }), "Gratuito");
	assert.equal(formatCourseTuition({ type: "mixed" }), "Gratuito e pago");
	assert.equal(
		formatCourseTuition({ type: "paid", amount: "R$ 773,37/mês" }),
		"Pago · R$ 773,37/mês",
	);
	assert.equal(formatCourseTuition(undefined), undefined);
});

test("todos os cursos usam o contrato enriquecido sem chaves legadas", async () => {
	const institutionsRoot = join(process.cwd(), "src/content/institutions");
	const institutionIds = (await readdir(institutionsRoot, { withFileTypes: true }))
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name);
	const records: Record<string, unknown>[] = [];

	for (const institutionId of institutionIds) {
		const directory = join(institutionsRoot, institutionId);
		const files = (await readdir(directory)).filter((file) => file.endsWith(".md"));

		for (const file of files) {
			const contents = await readFile(join(directory, file), "utf8");
			const frontmatter = contents.split("---")[1];
			records.push(YAML.parse(frontmatter));
		}
	}

	assert.equal(records.length, 38);
	for (const record of records) {
		assert.equal(typeof record.area, "string");
		assert.ok(COURSE_AREAS.includes(record.area as (typeof COURSE_AREAS)[number]));
		assert.equal(Array.isArray(record.shifts), true);
		assert.equal((record.shifts as unknown[]).length > 0, true);
		assert.equal("shift" in record, false);
		assert.equal("url" in record, false);
		assert.equal("mec_grade" in record, false);
	}

	assert.ok(records.some((record) => (record.shifts as unknown[]).length > 1));
	assert.ok(
		records.some(
			(record) =>
				record.modality === "EAD" &&
				!("campus" in record) &&
				Array.isArray((record as { sources?: unknown[] }).sources),
		),
	);

	const tuitionTypes = new Set(
		records.flatMap((record) => {
			const tuition = record.tuition as { type?: string } | undefined;
			return tuition?.type ? [tuition.type] : [];
		}),
	);
	assert.deepEqual(
		[...tuitionTypes].sort(),
		["free", "mixed", "not-published", "paid"],
	);

	const mecStatuses = new Set(
		records.flatMap((record) => {
			const mec = record.mec as { status?: string } | undefined;
			return mec?.status ? [mec.status] : [];
		}),
	);
	assert.deepEqual(
		[...mecStatuses].sort(),
		["not-applicable", "not-found", "not-yet-rated", "rated"],
	);

	const enrichedAdsRecords = records.filter(
		(record) =>
			Array.isArray((record as { tags?: unknown[] }).tags) &&
			(record.tags as unknown[]).includes("ADS"),
	);
	assert.equal(enrichedAdsRecords.length, 6);
	for (const record of enrichedAdsRecords) {
		assert.equal(typeof record.admission, "object");
		assert.ok(Array.isArray(record.curriculumHighlights));
		assert.ok((record.curriculumHighlights as unknown[]).length >= 3);
		assert.ok(Array.isArray(record.sources));
		assert.ok((record.sources as unknown[]).length > 0);
		assert.equal(typeof record.verification, "object");
	}
});
