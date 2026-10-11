import { z } from "zod";

export const tapeEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("log"),
    args: z.array(z.string()),
  }),
  z.object({
    type: z.literal("error"),
    name: z.string(),
    message: z.string(),
  }),
  z.object({
    type: z.literal("test"),
    name: z.string(),
    pass: z.boolean(),
    message: z.string().optional(),
  }),
]);

export const predictVariantSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  expected: z.array(tapeEventSchema).min(1),
  answer: z.string().min(1),
  theory: z.string().min(1),
});

const identity = {
  id: z.string().min(1),
  level: z.number().int().positive(),
  order: z.number().int().positive(),
  title: z.string().min(1),
  tags: z.array(z.string()),
  updatedAt: z.string().min(1),
  rev: z.number().int().positive(),
};

export const predictCardSchema = z.object({
  ...identity,
  kind: z.literal("predict"),
  strict: z.boolean(),
  code: z.string().min(1),
  expected: z.array(tapeEventSchema).min(1),
  answer: z.string().min(1),
  theory: z.string().min(1),
  variants: z.array(predictVariantSchema).optional(),
});

export const implementCardSchema = z.object({
  ...identity,
  kind: z.literal("implement"),
  statement: z.string().min(1),
  starter: z.string().min(1),
  tests: z.array(z.object({ name: z.string().min(1), code: z.string().min(1) })).min(1),
  solution: z.string().min(1),
  theory: z.string().min(1),
  waitMs: z.number().int().positive().optional(),
});

export const cardSchema = z.discriminatedUnion("kind", [predictCardSchema, implementCardSchema]);

export const tombstoneSchema = z.object({
  id: z.string().min(1),
  deletedAt: z.string().min(1),
});

export const contentStampSchema = z.object({
  id: z.string(),
  updatedAt: z.string(),
  rev: z.number().int(),
  hash: z.string(),
});

export const manifestSchema = z.object({
  seedVersion: z.string(),
  tasks: z.array(contentStampSchema),
  tombstones: z.array(tombstoneSchema),
});

export const progressStatusSchema = z.enum(["missed", "unsure", "knew"]);

export type TapeEvent = z.infer<typeof tapeEventSchema>;
export type PredictCard = z.infer<typeof predictCardSchema>;
export type ImplementCard = z.infer<typeof implementCardSchema>;
export type Card = z.infer<typeof cardSchema>;
export type Tombstone = z.infer<typeof tombstoneSchema>;
export type Manifest = z.infer<typeof manifestSchema>;
export type ProgressStatus = z.infer<typeof progressStatusSchema>;
