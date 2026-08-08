import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import {
	EVENT_FORMATS,
	EVENT_PROVIDERS,
	EVENT_STATUSES,
	ORGANIZER_TYPES,
	SYNCABLE_FIELDS,
	isHttpUrl,
} from "../scripts/events/types";
import {
	COURSE_AREAS,
	COURSE_ESTIMATED_FIELDS,
	COURSE_MEC_STATUSES,
	COURSE_MODALITIES,
	COURSE_SHIFTS,
	COURSE_TUITION_TYPES,
	COURSE_VERIFICATION_STATUSES,
} from "./lib/courses";

const accentSchema = z.enum(["violet", "red", "lime", "cyan", "coral"]);
const tagsSchema = z.array(z.string().min(1)).min(1);
const aliasesSchema = z.array(z.string().min(1)).min(1).optional();
const httpUrlSchema = z.string().url().refine(isHttpUrl, "URL deve usar HTTP ou HTTPS");
const eventFormatSchema = z.enum(EVENT_FORMATS);
const organizerTypeSchema = z.enum(ORGANIZER_TYPES);
const eventStatusSchema = z.enum(EVENT_STATUSES);
const eventSourceSchema = z.object({
	provider: z.enum(EVENT_PROVIDERS),
	externalId: z.string().min(1),
	url: httpUrlSchema,
});
const syncIgnoreSchema = z.array(z.enum(SYNCABLE_FIELDS));
const courseTuitionSchema = z
	.object({
		type: z.enum(COURSE_TUITION_TYPES),
		amount: z.string().min(1).optional(),
		note: z.string().min(1).optional(),
	})
	.refine(({ type, amount }) => type !== "free" || !amount, {
		message: "Curso gratuito não deve ter valor de mensalidade",
		path: ["amount"],
	});
const courseMecSchema = z
	.object({
		status: z.enum(COURSE_MEC_STATUSES),
		grade: z.number().int().min(1).max(5).optional(),
		note: z.string().min(1).optional(),
	})
	.refine(({ status, grade }) => (status === "rated" ? grade !== undefined : grade === undefined), {
		message: "A nota MEC é obrigatória apenas quando o status é rated",
		path: ["grade"],
	});
const courseVerificationSchema = z.object({
	reviewedAt: z.coerce.date(),
	status: z.enum(COURSE_VERIFICATION_STATUSES),
	estimatedFields: z.array(z.enum(COURSE_ESTIMATED_FIELDS)).optional().default([]),
});

const communities = defineCollection({
	loader: glob({ base: "./src/content/communities", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		name: z.string().min(1),
		aliases: aliasesSchema,
		type: z.string().min(1),
		website: z.string().url().optional(),
		description: z.string().min(1),
		cadence: z.string().min(1),
		status: z.string().min(1),
		accent: accentSchema,
		tags: tagsSchema,
		draft: z.boolean().optional().default(false),
	}),
});

const institutions = defineCollection({
	loader: glob({
		base: "./src/content/institutions",
		pattern: ["*.{md,mdx}", "!_*.{md,mdx}"],
	}),
	schema: z.object({
		name: z.string().min(1),
		aliases: aliasesSchema,
		website: z.string().url(),
		type: z.string().min(1),
		description: z.string().min(1),
		summary: z.string().min(1).optional(),
		profile: z.string().min(1),
		accent: accentSchema,
		tags: tagsSchema,
		links: z
			.array(z.object({ label: z.string().min(1), url: z.string().url() }))
			.optional(),
		draft: z.boolean().optional().default(false),
	}),
});

const courses = defineCollection({
	loader: glob({ base: "./src/content/institutions", pattern: "*/*.{md,mdx}" }),
	schema: z
		.object({
			name: z.string().min(1),
			aliases: aliasesSchema,
			level: z.string().min(1),
			area: z.enum(COURSE_AREAS),
			description: z.string().min(1),
			officialUrl: httpUrlSchema.optional(),
			duration: z.string().min(1).optional(),
			modality: z.enum(COURSE_MODALITIES).optional(),
			shifts: z.array(z.enum(COURSE_SHIFTS)).min(1),
			workload: z.string().min(1).optional(),
			campus: z.string().min(1).optional(),
			tuition: courseTuitionSchema.optional(),
			admission: z
				.object({
					summary: z.string().min(1),
					url: httpUrlSchema.optional(),
				})
				.optional(),
			curriculumHighlights: z.array(z.string().min(1)).min(3).max(6).optional(),
			mec: courseMecSchema.optional(),
			sources: z
				.array(z.object({ label: z.string().min(1), url: httpUrlSchema }))
				.min(1)
				.optional(),
			verification: courseVerificationSchema.optional(),
			tags: tagsSchema,
			draft: z.boolean().optional().default(false),
		})
		.refine(({ verification, sources }) => verification?.status !== "verified" || Boolean(sources?.length), {
			message: "Registros verificados precisam indicar ao menos uma fonte",
			path: ["sources"],
		}),
});

const events = defineCollection({
	loader: glob({ base: "./src/content/events", pattern: "**/*.{md,mdx}" }),
	schema: z
		.object({
			title: z.string().min(1),
			date: z.coerce.date(),
			endDate: z.coerce.date().optional(),
			time: z.string().min(1).optional(),
			location: z.string().min(1),
			format: eventFormatSchema,
			organizerName: z.string().min(1),
			organizerType: organizerTypeSchema,
			url: httpUrlSchema,
			description: z.string().min(1),
			tags: tagsSchema,
			status: eventStatusSchema.optional().default("Agendado"),
			source: eventSourceSchema.optional(),
			syncIgnore: syncIgnoreSchema.optional(),
			draft: z.boolean().optional().default(false),
		})
		.refine(({ date, endDate }) => !endDate || endDate >= date, {
			message: "endDate deve ser igual ou posterior a date",
			path: ["endDate"],
		}),
});

export const collections = { communities, institutions, events, courses };
