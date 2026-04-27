import { getDb } from "./db.js";
import type { StyleDirection, StyleDirectionQuality } from "./types.js";

export type CreateStyleDirectionInput = {
  source_run_id?: string | null;
  quality: StyleDirectionQuality;
  aesthetic: string;
  title: string;
  signals: string;
  guidance: string;
  weight: number;
};

export function createStyleDirection(input: CreateStyleDirectionInput): StyleDirection {
  const row: StyleDirection = {
    id: crypto.randomUUID(),
    source_run_id: input.source_run_id ?? null,
    quality: input.quality,
    aesthetic: input.aesthetic,
    title: input.title,
    signals: input.signals,
    guidance: input.guidance,
    weight: input.weight,
    created_at: Date.now(),
  };

  getDb().run(
    `INSERT INTO style_directions (id, source_run_id, quality, aesthetic, title, signals, guidance, weight, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [row.id, row.source_run_id, row.quality, row.aesthetic, row.title, row.signals, row.guidance, row.weight, row.created_at]
  );

  return row;
}

export function listStyleDirections(aesthetic: string, limit = 8): StyleDirection[] {
  return getDb().query<StyleDirection, [string, number]>(
    `SELECT * FROM style_directions
     WHERE aesthetic = ? OR aesthetic = 'all'
     ORDER BY quality ASC, weight DESC, created_at ASC
     LIMIT ?`
  ).all(aesthetic, limit);
}

export function buildStyleDirectionMemory(aesthetic: string): string {
  const rows = listStyleDirections(aesthetic);
  const amazing = rows.filter((row) => row.quality === "amazing");
  const slop = rows.filter((row) => row.quality === "slop");

  const format = (row: StyleDirection) => `- ${row.title}: ${row.guidance} Signals: ${row.signals}`;

  return [
    amazing.length > 0 ? `Amazing examples to emulate:\n${amazing.map(format).join("\n")}` : "",
    slop.length > 0 ? `Slop patterns to avoid:\n${slop.map(format).join("\n")}` : "",
  ].filter(Boolean).join("\n\n");
}
