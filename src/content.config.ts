import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const accentSchema = z.enum(["violet", "red", "lime", "cyan", "coral"]);
const tagsSchema = z.array(z.string().min(1)).min(1);

const communities = defineCollection({
	loader: glob({ base: "./src/content/communities", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		name: z.string().min(1),
		type: z.string().min(1),
		description: z.string().min(1),
		cadence: z.string().min(1),
		status: z.string().min(1),
		accent: accentSchema,
		tags: tagsSchema,
		draft: z.boolean().optional().default(false),
	}),
});

const institutions = defineCollection({
	loader: glob({ base: "./src/content/institutions", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		name: z.string().min(1),
		website: z.string().url(),
		type: z.string().min(1),
		description: z.string().min(1),
		profile: z.string().min(1),
		accent: accentSchema,
		tags: tagsSchema,
		draft: z.boolean().optional().default(false),
	}),
});

export const collections = { communities, institutions };
