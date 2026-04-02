/**
 * Shared Zod schemas for the ALL Applied AI Network content repository.
 *
 * These schemas define the shape of every YAML/JSON config file used across
 * the learning tree, series definitions, and workshop metadata.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Enums & primitives
// ---------------------------------------------------------------------------

/** Difficulty levels used across all content types. */
export const DifficultyEnum = z.enum([
  "beginner",
  "intermediate",
  "advanced",
  "expert",
]);
export type Difficulty = z.infer<typeof DifficultyEnum>;

/** Layer numbers map to the learning-tree depth (0 = foundations, 5 = mastery). */
export const LayerSchema = z.number().int().min(0).max(5);

// ---------------------------------------------------------------------------
// node.yaml — individual learning node
// ---------------------------------------------------------------------------

export const NodeYamlSchema = z.object({
  /** Unique node identifier, e.g. "foundations/what-is-ai". */
  id: z
    .string()
    .min(1, "Node id must not be empty")
    .regex(
      /^[a-z0-9]+(?:[-/][a-z0-9]+)*$/,
      "Node id must be lowercase alphanumeric with hyphens/slashes"
    ),

  title: z.string().min(1, "Title must not be empty"),
  description: z.string().min(1, "Description must not be empty"),

  /** Layer in the learning tree (0-5). */
  layer: LayerSchema,

  difficulty: DifficultyEnum,

  /** Estimated time to complete, in minutes. */
  estimated_minutes: z.number().int().positive(),

  /** Relative path to the thumbnail image from the node directory. */
  thumbnail: z.string().min(1),

  /** Freeform tags for search and filtering. */
  tags: z.array(z.string().min(1)).default([]),

  /** Node IDs that must be completed before this node. */
  prerequisites: z.array(z.string().min(1)).default([]),

  /** Node IDs that this node unlocks upon completion. */
  unlocks: z.array(z.string().min(1)).default([]),

  /** Relative path to the primary content file from the node directory. */
  content_file: z.string().min(1),

  /** Optional Jupyter notebook file. */
  notebook_file: z.string().nullable().optional(),

  /** Content author. */
  author: z.string().optional(),

  /** ISO date string of last update. */
  last_updated: z.string().optional(),
});

export type NodeYaml = z.infer<typeof NodeYamlSchema>;

// ---------------------------------------------------------------------------
// series.yaml — ordered collection of learning nodes
// ---------------------------------------------------------------------------

export const SeriesYamlSchema = z.object({
  /** Unique series identifier, e.g. "series/getting-started". */
  id: z.string().min(1, "Series id must not be empty"),

  title: z.string().min(1, "Title must not be empty"),
  description: z.string().min(1, "Description must not be empty"),

  /** Difficulty — can be a single level or a range like "beginner-to-advanced". */
  difficulty: z.string().min(1, "Difficulty must not be empty"),

  /** Ordered list of node IDs belonging to this series. */
  nodes: z.array(z.string().min(1)).default([]),
});

export type SeriesYaml = z.infer<typeof SeriesYamlSchema>;

// ---------------------------------------------------------------------------
// metadata.yaml — workshop metadata
// ---------------------------------------------------------------------------

export const MetadataYamlSchema = z.object({
  title: z.string().min(1, "Title must not be empty"),
  description: z.string().min(1, "Description must not be empty"),
  difficulty: DifficultyEnum,
  estimated_minutes: z.number().int().positive(),
  tags: z.array(z.string().min(1)).default([]),
});

export type MetadataYaml = z.infer<typeof MetadataYamlSchema>;
