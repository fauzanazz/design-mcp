import { z } from "zod";

const RepoContextObject = z.object({
  summary: z.string().optional(),
  design_tokens: z.object({
    colors: z.record(z.string()).optional(),
    fonts: z.array(z.string()).optional(),
    spacing: z.array(z.string()).optional(),
  }).optional(),
  components: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
  })).optional(),
  framework: z.string().optional(),
  raw: z.string().optional(),
}).passthrough();

export const repoContextSchema = z.union([z.string(), RepoContextObject]);

export const ViewportSchema = z.enum(["desktop", "mobile"]).default("desktop");

export const ModeSchema = z.enum(["inspire", "clone", "enhance", "none"]).optional();

export const GenerateDesignSchema = z.object({
  prompt: z.string(),
  repo_context: repoContextSchema,
  viewport: ViewportSchema,
  mode: ModeSchema,
  url: z.string().optional(),
  animate_after_layout: z.boolean().optional(),
});

export const RefineDesignSchema = z.object({
  run_id_or_html: z.string(),
  feedback: z.string(),
  repo_context: repoContextSchema,
  mode: ModeSchema,
  url: z.string().optional(),
});

export const CreateEditorSessionSchema = z.object({
  title: z.string().optional(),
  platform_mode: z.enum(["web", "app"]).default("web"),
});

export const LinkEditorSessionSchema = z.object({
  code: z.string().length(6),
});

export const UnlinkEditorSessionSchema = z.object({
  session_id: z.string(),
});

export const GetCanvasSchema = z.object({
  canvas_id: z.string(),
});

export const ExtractCanvasDesignSchema = z.object({
  query: z.string(),
  canvas_id: z.string().optional(),
});

export const RateStyleDirectionSchema = z.object({
  run_id: z.string().uuid().optional(),
  quality: z.enum(["amazing", "slop"]),
  aesthetic: z.string().default("all"),
  title: z.string().min(1),
  signals: z.string().min(1),
  guidance: z.string().min(1),
  weight: z.number().int().min(1).max(10).default(5),
});
