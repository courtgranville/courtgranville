// Astro content collections — projects. Each project is a JSON file under
// src/content/projects/<slug>.json holding frontmatter + an ordered block
// array. Block image references are slugs into the per-project image manifest
// (src/content/projects-images.json), which the project route resolves to
// real srcset URLs at render time.

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Discriminated by `type`. Block layout (column ranges, gutter behaviour)
// is decided by the rendering component, not the data — the JSON only
// declares *what* it is, not *how wide*.
const blockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('label'),
    text: z.string(),
  }),
  z.object({
    type: z.literal('text'),
    body: z.string(),
  }),
  z.object({
    type: z.literal('quote'),
    body: z.string(),
    attribution: z.string().optional(),
  }),
  z.object({
    type: z.literal('image'),
    imageSlug: z.string(),
    variant: z.enum(['narrow', 'wide', 'bleed']).default('wide'),
    alt: z.string(),
    caption: z.string().optional(),
  }),
  z.object({
    type: z.literal('imagePair'),
    imageSlugs: z.array(z.string()).length(2),
    alt: z.string(),
  }),
  z.object({
    type: z.literal('imageGrid'),
    imageSlugs: z.array(z.string()).min(2).max(4),
    alt: z.string(),
  }),
  z.object({
    type: z.literal('specList'),
    entries: z.record(z.string(), z.string()),
  }),
]);

const projects = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/projects' }),
  schema: z.object({
    name: z.string(),
    year: z.number(),
    discipline: z.string(),
    framing: z.string(),
    heroImage: z.string(),
    group: z.boolean().optional().default(false),
    spec: z.record(z.string(), z.string()).optional(),
    exhibitions: z.array(z.string()).optional(),
    blocks: z.array(blockSchema),
  }),
});

// Blog — markdown posts. `draft: true` keeps a post out of production builds
// (the route + listing filter on import.meta.env.PROD) while staying visible
// in dev so the template can be worked on before launch.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects, blog };
